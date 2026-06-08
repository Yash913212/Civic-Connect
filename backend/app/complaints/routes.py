from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.database import get_db
from app.database.models import User, RoleEnum, StatusEnum, PriorityEnum
from app.auth.dependencies import get_current_user, RequireCitizen, RequireOfficer, RequireAdmin
from app.complaints.schemas import (
    ComplaintCreate, ComplaintUpdate, ComplaintResponse, 
    ComplaintStatusUpdate, ComplaintAssign, ComplaintWithHistoryResponse
)
from app.complaints import services

router = APIRouter(prefix="/api", tags=["Complaints"])

@router.post("/complaints", response_model=ComplaintResponse, dependencies=[RequireCitizen])
def create_complaint(
    complaint_in: ComplaintCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return services.create_complaint(db, complaint_in, current_user.id)

@router.get("/complaints/my", response_model=List[ComplaintResponse], dependencies=[RequireCitizen])
def get_my_complaints(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return services.get_my_complaints(db, current_user.id)

@router.get("/complaints/search", response_model=List[ComplaintResponse])
def search_complaints(
    status: Optional[StatusEnum] = None,
    priority: Optional[PriorityEnum] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return services.search_complaints(db, status=status, priority=priority, department=department)

@router.get("/complaints/{id}", response_model=ComplaintWithHistoryResponse)
def get_complaint(
    id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return services.get_complaint(db, id, current_user)

@router.patch("/complaints/{id}", response_model=ComplaintResponse, dependencies=[RequireCitizen])
def update_complaint(
    id: str, 
    update_data: ComplaintUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return services.update_complaint(db, id, update_data, current_user)

@router.delete("/complaints/{id}", dependencies=[RequireCitizen])
def delete_complaint(
    id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    services.delete_complaint(db, id, current_user)
    return {"message": "Complaint deleted successfully"}

# --- Admin Routes ---
@router.get("/admin/complaints", response_model=List[ComplaintResponse], dependencies=[RequireAdmin])
def get_admin_complaints(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    return services.get_admin_complaints(db, skip=skip, limit=limit)

@router.post("/admin/assign", response_model=ComplaintResponse, dependencies=[RequireAdmin])
def assign_officer(
    assign_data: ComplaintAssign, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return services.assign_officer(db, str(assign_data.complaint_id), str(assign_data.officer_id), current_user)

# --- Officer Routes ---
@router.get("/officer/complaints", response_model=List[ComplaintResponse], dependencies=[RequireOfficer])
def get_officer_complaints(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return services.get_officer_complaints(db, current_user.id)

@router.patch("/officer/complaints/{id}/status", response_model=ComplaintResponse, dependencies=[RequireOfficer])
def update_complaint_status(
    id: str, 
    status_data: ComplaintStatusUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return services.update_complaint_status(db, id, status_data.status, current_user)
