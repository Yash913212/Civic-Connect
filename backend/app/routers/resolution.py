from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Complaint as DBComplaint, User, RoleEnum, ComplaintStatus
from app.auth.dependencies import get_current_user
from app.core.dependencies import manager
import base64
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter()


class ResolutionSubmit(BaseModel):
    resolution_notes: str | None = None


class VerificationAction(BaseModel):
    action: str  # "verify" or "reject"
    notes: str | None = None


def calculate_verification_score(original_description: str, resolution_notes: str | None) -> int:
    """
    Calculate a basic verification score based on resolution notes quality.
    In production, this would use AI image comparison.
    """
    score = 50  # Base score
    
    if resolution_notes:
        # Add points for detailed notes
        word_count = len(resolution_notes.split())
        if word_count >= 10:
            score += 20
        elif word_count >= 5:
            score += 10
        
        # Add points for action verbs
        action_verbs = ["repaired", "fixed", "cleaned", "replaced", "installed", "removed", "painted"]
        if any(verb in resolution_notes.lower() for verb in action_verbs):
            score += 15
        
        # Add points for time references
        time_refs = ["today", "yesterday", "hours", "minutes", "completed"]
        if any(ref in resolution_notes.lower() for ref in time_refs):
            score += 15
    
    return min(100, score)


@router.post("/{complaint_id}/resolution")
async def submit_resolution(
    complaint_id: str,
    resolution_notes: str = Form(None),
    resolution_image: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit resolution photo and notes for a complaint."""
    if current_user.role not in [RoleEnum.OFFICER, RoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Only officers can submit resolutions")
    
    complaint = db.query(DBComplaint).filter(DBComplaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Check if officer is assigned to this complaint
    if current_user.role == RoleEnum.OFFICER and complaint.assigned_to != str(current_user.id):
        raise HTTPException(status_code=403, detail="You are not assigned to this complaint")
    
    # Process resolution image
    resolution_image_url = None
    if resolution_image:
        try:
            contents = await resolution_image.read()
            # Convert to base64 for storage (in production, use cloud storage)
            resolution_image_url = f"data:image/jpeg;base64,{base64.b64encode(contents).decode()}"
        except Exception as e:
            logger.error(f"Failed to process resolution image: {e}")
            raise HTTPException(status_code=400, detail="Failed to process image")
    
    # Calculate verification score
    verification_score = calculate_verification_score(
        complaint.description,
        resolution_notes
    )
    
    # Update complaint
    complaint.resolution_image_url = resolution_image_url
    complaint.resolution_notes = resolution_notes
    complaint.verification_status = "PENDING"
    complaint.verification_score = verification_score
    
    db.commit()
    db.refresh(complaint)
    
    return {
        "message": "Resolution submitted for verification",
        "complaint_id": str(complaint.id),
        "verification_score": verification_score,
        "verification_status": "PENDING",
    }


@router.patch("/{complaint_id}/verify")
def verify_resolution(
    complaint_id: str,
    request: VerificationAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Admin verification of resolution."""
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can verify resolutions")
    
    complaint = db.query(DBComplaint).filter(DBComplaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if not complaint.resolution_image_url:
        raise HTTPException(status_code=400, detail="No resolution submitted yet")
    
    if request.action == "verify":
        complaint.verification_status = "VERIFIED"
        complaint.status = ComplaintStatus.RESOLVED.value
        complaint.verified_by = str(current_user.id)
        complaint.verified_at = datetime.now(timezone.utc)
        
        # Notify and update citizen
        if complaint.user_id:
            from app.database.models import Notification, NotificationType
            citizen = db.query(User).filter(User.id == complaint.user_id).first()
            if citizen:
                citizen.complaints_verified = (citizen.complaints_verified or 0) + 1
            notif = Notification(
                user_id=complaint.user_id,
                title="Complaint Resolved",
                message=f"Your complaint '{complaint.title}' has been verified and resolved.",
                type=NotificationType.COMPLAINT_RESOLVED,
                complaint_id=complaint.id,
            )
            db.add(notif)
            db.flush()
        
        message = "Resolution verified and complaint marked as resolved"
    elif request.action == "reject":
        complaint.verification_status = "REJECTED"
        complaint.verification_score = max(0, (complaint.verification_score or 50) - 30)
        
        # Notify officer
        if complaint.assigned_to:
            from app.database.models import Notification, NotificationType
            notif = Notification(
                user_id=complaint.assigned_to,
                title="Resolution Rejected",
                message=f"Resolution for '{complaint.title}' was rejected. Notes: {request.notes or 'No notes provided'}",
                type=NotificationType.STATUS_UPDATE,
                complaint_id=complaint.id,
            )
            db.add(notif)
            db.flush()
        
        message = "Resolution rejected. Officer needs to resubmit."
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'verify' or 'reject'")
    
    db.commit()
    db.refresh(complaint)
    
    return {
        "message": message,
        "complaint_id": str(complaint.id),
        "verification_status": complaint.verification_status,
    }


@router.get("/{complaint_id}/resolution")
def get_resolution_status(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get resolution status for a complaint."""
    complaint = db.query(DBComplaint).filter(DBComplaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Check authorization
    is_owner = complaint.user_id and str(complaint.user_id) == str(current_user.id)
    is_admin = current_user.role == RoleEnum.ADMIN
    is_assigned = complaint.assigned_to and str(complaint.assigned_to) == str(current_user.id)
    
    if not (is_owner or is_admin or is_assigned):
        raise HTTPException(status_code=403, detail="Not authorized to view resolution status")
    
    return {
        "complaint_id": str(complaint.id),
        "has_resolution": bool(complaint.resolution_image_url),
        "resolution_notes": complaint.resolution_notes,
        "verification_status": complaint.verification_status,
        "verification_score": complaint.verification_score,
        "verified_at": complaint.verified_at.isoformat() if complaint.verified_at else None,
    }
