from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, List
from app.database.models import Complaint, ComplaintHistory, User, StatusEnum, RoleEnum, PriorityEnum
from app.complaints.schemas import ComplaintCreate, ComplaintUpdate

def create_complaint(db: Session, complaint_in: ComplaintCreate, citizen_id: str):
    new_complaint = Complaint(
        **complaint_in.model_dump(),
        citizen_id=citizen_id,
        status=StatusEnum.SUBMITTED,
        priority=PriorityEnum.LOW
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint

def get_my_complaints(db: Session, citizen_id: str):
    return db.query(Complaint).filter(Complaint.citizen_id == citizen_id).all()

def get_complaint(db: Session, complaint_id: str, current_user: User):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    
    if current_user.role == RoleEnum.CITIZEN and str(complaint.citizen_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
        
    if current_user.role == RoleEnum.OFFICER and str(complaint.assigned_officer_id) != str(current_user.id) and current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
        
    return complaint

def update_complaint(db: Session, complaint_id: str, update_data: ComplaintUpdate, current_user: User):
    complaint = get_complaint(db, complaint_id, current_user)
    
    if complaint.status in [StatusEnum.RESOLVED, StatusEnum.CLOSED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot update RESOLVED or CLOSED complaint")
        
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(complaint, key, value)
        
    db.commit()
    db.refresh(complaint)
    return complaint

def delete_complaint(db: Session, complaint_id: str, current_user: User):
    complaint = get_complaint(db, complaint_id, current_user)
    db.delete(complaint)
    db.commit()

def search_complaints(db: Session, status: Optional[StatusEnum] = None, priority: Optional[PriorityEnum] = None, department: Optional[str] = None):
    query = db.query(Complaint)
    if status:
        query = query.filter(Complaint.status == status)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if department:
        query = query.filter(Complaint.department == department)
    return query.all()

def get_admin_complaints(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Complaint).offset(skip).limit(limit).all()

def assign_officer(db: Session, complaint_id: str, officer_id: str, admin_user: User):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    officer = db.query(User).filter(User.id == officer_id, User.role == RoleEnum.OFFICER).first()
    if not officer:
        raise HTTPException(status_code=400, detail="Invalid officer ID")
        
    old_status = complaint.status
    complaint.assigned_officer_id = officer.id
    complaint.status = StatusEnum.ASSIGNED
    
    history = ComplaintHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=StatusEnum.ASSIGNED,
        changed_by=admin_user.id
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)
    return complaint

def get_officer_complaints(db: Session, officer_id: str):
    return db.query(Complaint).filter(Complaint.assigned_officer_id == officer_id).all()

def update_complaint_status(db: Session, complaint_id: str, new_status: StatusEnum, officer_user: User):
    complaint = get_complaint(db, complaint_id, officer_user)
    
    old_status = complaint.status
    complaint.status = new_status
    
    history = ComplaintHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=new_status,
        changed_by=officer_user.id
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)
    return complaint
