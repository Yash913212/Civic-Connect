import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.database.models import Complaint, ComplaintStatus, NotificationType, Notification, User, RoleEnum
from app.core.sla import check_sla_violation, get_sla_status, get_escalation_target
from app.core.dependencies import manager
import json

logger = logging.getLogger(__name__)

SLA_CHECK_INTERVAL = 300  # 5 minutes


async def monitor_sla_violations():
    """Background task to monitor SLA violations and trigger escalations."""
    while True:
        try:
            db = SessionLocal()
            try:
                # Get all active complaints (not resolved)
                active_complaints = db.query(Complaint).filter(
                    Complaint.status.in_([
                        ComplaintStatus.PENDING.value,
                        ComplaintStatus.ASSIGNED.value,
                        ComplaintStatus.IN_PROGRESS.value
                    ])
                ).all()

                for complaint in active_complaints:
                    await process_complaint_sla(complaint, db)
            finally:
                db.close()
        except Exception as e:
            logger.error(f"SLA monitoring error: {e}")
        
        await asyncio.sleep(SLA_CHECK_INTERVAL)


async def process_complaint_sla(complaint: Complaint, db: Session):
    """Process SLA status for a single complaint."""
    if not complaint.sla_deadline:
        # Initialize SLA deadline if not set
        from app.core.sla import get_sla_deadline
        complaint.sla_deadline = get_sla_deadline(
            complaint.department, 
            complaint.priority, 
            complaint.created_at
        )
        db.commit()
        return

    is_overdue, hours_overdue = check_sla_violation(
        complaint.created_at,
        complaint.department,
        complaint.priority
    )

    sla_status = get_sla_status(
        complaint.created_at,
        complaint.department,
        complaint.priority
    )

    # Update SLA status
    old_status = complaint.sla_status
    complaint.sla_status = sla_status["urgency"]

    # Send warnings at different thresholds
    if sla_status["urgency"] == "CRITICAL" and old_status != "CRITICAL":
        await send_sla_warning(complaint, db, "CRITICAL", sla_status["remaining_hours"])
    elif sla_status["urgency"] == "WARNING" and old_status == "ON_TRACK":
        await send_sla_warning(complaint, db, "WARNING", sla_status["remaining_hours"])

    # Handle SLA breach and escalation
    if is_overdue and complaint.sla_status != "OVERDUE":
        complaint.sla_status = "OVERDUE"
        await escalate_complaint(complaint, db, hours_overdue)

    db.commit()


async def send_sla_warning(complaint: Complaint, db: Session, level: str, remaining_hours: int):
    """Send SLA warning notification."""
    # Notify assigned officer
    if complaint.assigned_to:
        notification_type = NotificationType.SLA_WARNING
        title = f"SLA {level} Warning"
        message = (
            f"Complaint '{complaint.title}' SLA is {level}. "
            f"Only {remaining_hours} hours remaining before breach."
        )
        
        notif = Notification(
            user_id=complaint.assigned_to,
            title=title,
            message=message,
            type=notification_type,
            complaint_id=complaint.id,
        )
        db.add(notif)
        db.flush()

        # Send WebSocket notification
        try:
            await manager.send_personal_message(
                json.dumps({
                    "type": "SLA_WARNING",
                    "complaint_id": str(complaint.id),
                    "level": level,
                    "remaining_hours": remaining_hours,
                    "title": complaint.title,
                }),
                complaint.assigned_to
            )
        except Exception as e:
            logger.warning(f"Failed to send SLA warning WebSocket: {e}")


async def escalate_complaint(complaint: Complaint, db: Session, hours_overdue: int):
    """Escalate complaint to next level."""
    current_level = complaint.escalation_level or 0
    next_target = get_escalation_target(complaint.department, current_level)
    
    if not next_target:
        logger.warning(f"Complaint {complaint.id} has reached maximum escalation level")
        return

    # Increment escalation level
    complaint.escalation_level = current_level + 1
    complaint.last_escalated_at = datetime.now(timezone.utc)

    # Find admin users to notify
    admins = db.query(User).filter(User.role == RoleEnum.ADMIN).all()
    
    for admin in admins:
        notif = Notification(
            user_id=admin.id,
            title="SLA Breach - Auto-Escalation",
            message=(
                f"Complaint '{complaint.title}' has breached SLA by {hours_overdue} hours. "
                f"Auto-escalated to {next_target}. Department: {complaint.department}"
            ),
            type=NotificationType.SLA_BREACH,
            complaint_id=complaint.id,
        )
        db.add(notif)
        db.flush()

        # Send WebSocket notification
        try:
            await manager.send_personal_message(
                json.dumps({
                    "type": "SLA_BREACH",
                    "complaint_id": str(complaint.id),
                    "hours_overdue": hours_overdue,
                    "escalation_target": next_target,
                    "title": complaint.title,
                }),
                admin.id
            )
        except Exception as e:
            logger.warning(f"Failed to send SLA breach WebSocket: {e}")

    # Notify current assignee if exists
    if complaint.assigned_to:
        notif = Notification(
            user_id=complaint.assigned_to,
            title="Complaint Escalated",
            message=(
                f"Your complaint '{complaint.title}' has been escalated due to SLA breach. "
                f"Please prioritize immediate action."
            ),
            type=NotificationType.SLA_BREACH,
            complaint_id=complaint.id,
        )
        db.add(notif)
        db.flush()


def start_sla_monitor():
    """Start the SLA monitoring background task."""
    asyncio.create_task(monitor_sla_violations())
    logger.info("SLA monitoring background task started")
