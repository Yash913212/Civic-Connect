import asyncio
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload
from app.database.database import get_db
from app.database.models import Complaint as DBComplaint
from app.database.models import User, RoleEnum, ComplaintStatus, PriorityEnum, DepartmentEnum, Notification, NotificationType
from app.auth.dependencies import get_current_user
from app.auth.dependencies import get_optional_user as get_user_from_auth
from app.core.dependencies import manager
from app.core.gamification import award_points
import json
import logging
import re

logger = logging.getLogger(__name__)

router = APIRouter()


class Complaint(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=2000)
    location: str = Field(..., min_length=1, max_length=500)
    latitude: str | None = None
    longitude: str | None = None
    address: str | None = None
    department: DepartmentEnum = DepartmentEnum.GENERAL
    priority: PriorityEnum = PriorityEnum.LOW
    image_url: str | None = None
    ai_summary: str | None = None
    ai_request_letter: str | None = None


class StatusUpdateRequest(BaseModel):
    status: str


class AssignRequest(BaseModel):
    officer_id: str | None = None


class ComplaintUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, min_length=1, max_length=2000)
    location: str | None = Field(None, min_length=1, max_length=500)
    latitude: str | None = None
    longitude: str | None = None
    address: str | None = None
    department: DepartmentEnum | None = None
    priority: PriorityEnum | None = None
    image_url: str | None = None
    ai_summary: str | None = None
    ai_request_letter: str | None = None


def _create_notification(db: Session, user_id, title: str, message: str, ntype: NotificationType, complaint_id=None):
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=ntype,
        complaint_id=complaint_id,
    )
    db.add(notif)
    db.flush()


def _sanitize_html(text: str | None) -> str | None:
    if not text:
        return text
    text = re.sub(r'<[^>]*>', '', text)
    text = text.replace('javascript:', '').replace('onerror=', '').replace('onclick=', '')
    return text[:5000]

def _complaint_to_dict(c: DBComplaint, db: Session, officer_cache: dict[str, str] | None = None) -> dict:
    assigned_name = None
    if c.assigned_to:
        if officer_cache is not None:
            assigned_name = officer_cache.get(c.assigned_to)
        else:
            officer = db.query(User).filter(User.id == c.assigned_to).first()
            assigned_name = officer.full_name if officer else None
    return {
        "id": str(c.id),
        "title": _sanitize_html(c.title),
        "description": _sanitize_html(c.description),
        "location": _sanitize_html(c.location),
        "latitude": c.latitude,
        "longitude": c.longitude,
        "address": _sanitize_html(c.address),
        "dept": c.department,
        "priority": c.priority,
        "status": c.status.value if hasattr(c.status, 'value') else c.status,
        "image_url": c.image_url,
        "ai_summary": c.ai_summary,
        "ai_request_letter": c.ai_request_letter,
        "user_id": str(c.user_id) if c.user_id else None,
        "assigned_to": str(c.assigned_to) if c.assigned_to else None,
        "assigned_name": assigned_name,
        "time": c.created_at.isoformat() if c.created_at else "Just now"
    }


@router.post("")
def create_complaint(
    complaint: Complaint,
    db: Session = Depends(get_db),
    authorization: str | None = Header(None),
):
    try:
        user = get_user_from_auth(authorization, db)

        db_complaint = DBComplaint(
            title=complaint.title,
            description=complaint.description,
            location=complaint.location,
            latitude=complaint.latitude,
            longitude=complaint.longitude,
            address=complaint.address,
            department=complaint.department,
            priority=complaint.priority,
            image_url=complaint.image_url,
            ai_summary=complaint.ai_summary,
            ai_request_letter=complaint.ai_request_letter,
            user_id=user.id if user else None,
            status=ComplaintStatus.PENDING.value
        )
        db.add(db_complaint)
        db.flush()

        if user:
            _create_notification(db, user.id,
                "Complaint Submitted",
                f"Your complaint '{db_complaint.title}' has been submitted successfully.",
                NotificationType.COMPLAINT_SUBMITTED, db_complaint.id)
            
            user.complaints_submitted = (user.complaints_submitted or 0) + 1
            award_points(user, "complaint_submitted", db)

        db.commit()
        db.refresh(db_complaint)

        return {"message": "Complaint Submitted Successfully", "id": str(db_complaint.id)}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Complaint creation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while submitting complaint.")


# ──────────────────────────────────────────────
# Citizen endpoints
# ──────────────────────────────────────────────

@router.get("/my")
def get_my_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaints = db.query(DBComplaint).filter(
        DBComplaint.user_id == str(current_user.id)
    ).order_by(DBComplaint.created_at.desc()).all()
    return [_complaint_to_dict(c, db) for c in complaints]


@router.put("/{complaint_id}")
def update_complaint(
    complaint_id: str,
    request: ComplaintUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(DBComplaint).filter(DBComplaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    is_owner = complaint.user_id and str(complaint.user_id) == str(current_user.id)
    is_admin = current_user.role == RoleEnum.ADMIN
    is_assigned = complaint.assigned_to and str(complaint.assigned_to) == str(current_user.id)

    if not (is_owner or is_admin or is_assigned):
        raise HTTPException(status_code=403, detail="Not authorized to update this complaint")

    if request.title is not None: complaint.title = request.title
    if request.description is not None: complaint.description = request.description
    if request.location is not None: complaint.location = request.location
    if request.latitude is not None: complaint.latitude = request.latitude
    if request.longitude is not None: complaint.longitude = request.longitude
    if request.address is not None: complaint.address = request.address
    if request.department is not None: complaint.department = request.department
    if request.priority is not None: complaint.priority = request.priority
    if request.image_url is not None: complaint.image_url = request.image_url
    if request.ai_summary is not None: complaint.ai_summary = request.ai_summary
    if request.ai_request_letter is not None: complaint.ai_request_letter = request.ai_request_letter

    db.commit()
    db.refresh(complaint)

    if complaint.user_id:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(manager.send_personal_message(
                    json.dumps({
                        "type": "STATUS_UPDATE",
                        "complaint_id": str(complaint.id),
                        "status": complaint.status.value if hasattr(complaint.status, 'value') else complaint.status,
                        "title": complaint.title
                    }),
                    str(complaint.user_id)
                ))
        except Exception as e:
            logger.warning(f"Failed to send WebSocket notification: {e}")

    return _complaint_to_dict(complaint, db)


@router.delete("/{complaint_id}")
def delete_complaint(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(DBComplaint).filter(DBComplaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    is_owner = complaint.user_id and str(complaint.user_id) == str(current_user.id)
    is_admin = current_user.role == RoleEnum.ADMIN

    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to delete this complaint")

    db.delete(complaint)
    db.commit()

    return {"message": "Complaint deleted", "id": str(complaint_id)}


# ──────────────────────────────────────────────
# Officer endpoints
# ──────────────────────────────────────────────

@router.patch("/{complaint_id}/status")
def update_complaint_status(
    complaint_id: str,
    request: StatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [RoleEnum.OFFICER, RoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Only officers and admins can change complaint status")

    complaint = db.query(DBComplaint).filter(DBComplaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    valid_statuses = [s.value for s in ComplaintStatus]
    if request.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    complaint.status = request.status
    db.flush()

    new_status = complaint.status.value if hasattr(complaint.status, 'value') else complaint.status

    if complaint.user_id and complaint.user_id != current_user.id:
        _create_notification(db, complaint.user_id,
            "Status Update",
            f"Your complaint '{complaint.title}' is now '{new_status}'.",
            NotificationType.STATUS_UPDATE, complaint.id)

    if new_status == "Resolved" and complaint.user_id:
        _create_notification(db, complaint.user_id,
            "Complaint Resolved",
            f"Your complaint '{complaint.title}' has been resolved!",
            NotificationType.COMPLAINT_RESOLVED, complaint.id)

    if complaint.assigned_to and complaint.assigned_to != current_user.id:
        _create_notification(db, complaint.assigned_to,
            "Status Update",
            f"Complaint '{complaint.title}' updated to '{new_status}'.",
            NotificationType.STATUS_UPDATE, complaint.id)

    db.commit()
    db.refresh(complaint)

    return {
        "id": str(complaint.id),
        "title": complaint.title,
        "status": new_status,
        "message": f"Complaint status updated to '{new_status}'"
    }


# ──────────────────────────────────────────────
# Admin endpoints
# ──────────────────────────────────────────────

@router.get("")
def get_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(DBComplaint)
    if current_user.role == RoleEnum.OFFICER and current_user.department:
        query = query.filter(DBComplaint.department == current_user.department)
    complaints = query.options(joinedload(DBComplaint.assigned_officer)).order_by(DBComplaint.created_at.desc()).all()
    officer_ids = {c.assigned_to for c in complaints if c.assigned_to}
    officers = db.query(User).filter(User.id.in_(officer_ids)).all() if officer_ids else []
    officer_cache = {str(o.id): o.full_name for o in officers}
    return [_complaint_to_dict(c, db, officer_cache) for c in complaints]


@router.patch("/{complaint_id}/assign")
def assign_officer(
    complaint_id: str,
    request: AssignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can assign officers")

    complaint = db.query(DBComplaint).filter(DBComplaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if request.officer_id:
        officer = db.query(User).filter(
            User.id == request.officer_id,
            User.role == RoleEnum.OFFICER,
            User.is_active == True
        ).first()
        if not officer:
            raise HTTPException(status_code=404, detail="Officer not found")
        complaint.assigned_to = officer.id
        if complaint.status == ComplaintStatus.PENDING.value:
            complaint.status = ComplaintStatus.ASSIGNED.value

        _create_notification(db, officer.id,
            "New Assignment",
            f"Complaint '{complaint.title}' has been assigned to you.",
            NotificationType.ASSIGNMENT, complaint.id)

        if complaint.user_id:
            _create_notification(db, complaint.user_id,
                "Officer Assigned",
                f"Officer {officer.full_name} has been assigned to your complaint '{complaint.title}'.",
                NotificationType.ASSIGNMENT, complaint.id)
    else:
        complaint.assigned_to = None

    db.commit()
    db.refresh(complaint)

    officer_name = None
    if complaint.assigned_to:
        officer = db.query(User).filter(User.id == complaint.assigned_to).first()
        officer_name = officer.full_name if officer else None

    return {
        "id": str(complaint.id),
        "assigned_to": str(complaint.assigned_to) if complaint.assigned_to else None,
        "assigned_name": officer_name,
        "status": complaint.status.value if hasattr(complaint.status, 'value') else complaint.status,
        "message": f"Assigned to {officer_name}" if officer_name else "Officer unassigned"
    }
