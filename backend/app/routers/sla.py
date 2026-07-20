from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Complaint as DBComplaint, User, RoleEnum
from app.auth.dependencies import get_current_user
from app.core.sla import get_sla_status, get_sla_deadline
from datetime import datetime, timezone

router = APIRouter()


@router.get("/{complaint_id}/sla")
def get_complaint_sla(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get SLA status for a specific complaint."""
    complaint = db.query(DBComplaint).filter(DBComplaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Check authorization
    is_owner = complaint.user_id and str(complaint.user_id) == str(current_user.id)
    is_admin = current_user.role == RoleEnum.ADMIN
    is_assigned = complaint.assigned_to and str(complaint.assigned_to) == str(current_user.id)
    
    if not (is_owner or is_admin or is_assigned):
        raise HTTPException(status_code=403, detail="Not authorized to view SLA status")
    
    # Calculate SLA status
    created_at = complaint.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    
    sla_status = get_sla_status(
        created_at,
        complaint.department,
        complaint.priority
    )
    
    return {
        "complaint_id": str(complaint.id),
        "title": complaint.title,
        "department": complaint.department,
        "priority": complaint.priority,
        "status": complaint.status,
        "sla": sla_status,
    }


@router.get("/sla/overview")
def get_sla_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get SLA overview for all active complaints (admin only)."""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can view SLA overview")
    
    active_complaints = db.query(DBComplaint).filter(
        DBComplaint.status.in_(["Pending", "Assigned", "In Progress"])
    ).all()
    
    overview = {
        "total_active": len(active_complaints),
        "on_track": 0,
        "warning": 0,
        "critical": 0,
        "overdue": 0,
        "by_department": {},
        "breaches": [],
    }
    
    for complaint in active_complaints:
        created_at = complaint.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        
        sla_status = get_sla_status(
            created_at,
            complaint.department,
            complaint.priority
        )
        
        # Count by urgency
        urgency = sla_status["urgency"]
        if urgency == "ON_TRACK":
            overview["on_track"] += 1
        elif urgency == "WARNING":
            overview["warning"] += 1
        elif urgency == "CRITICAL":
            overview["critical"] += 1
        elif urgency == "OVERDUE":
            overview["overdue"] += 1
        
        if urgency in ["WARNING", "CRITICAL", "OVERDUE"]:
            overview["breaches"].append({
                "id": f"C-{str(complaint.id)[:4].upper()}",
                "original_id": str(complaint.id),
                "dept": complaint.department or "Unknown",
                "hours": f"{sla_status['elapsed_hours']}h",
                "priority": complaint.priority or "Normal",
                "status": urgency.title(),
            })

        # Count by department
        dept = complaint.department or "General"
        if dept not in overview["by_department"]:
            overview["by_department"][dept] = {
                "total": 0,
                "overdue": 0,
            }
        overview["by_department"][dept]["total"] += 1
        if urgency == "OVERDUE":
            overview["by_department"][dept]["overdue"] += 1
    
    return overview
