from pydantic import BaseModel, UUID4, Field
from typing import Optional, List
from datetime import datetime
from app.database.models import StatusEnum, PriorityEnum

class ComplaintBase(BaseModel):
    title: str
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    department: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None

class ComplaintStatusUpdate(BaseModel):
    status: StatusEnum

class ComplaintAssign(BaseModel):
    complaint_id: UUID4
    officer_id: UUID4

class ComplaintResponse(ComplaintBase):
    id: UUID4
    status: StatusEnum
    priority: PriorityEnum
    citizen_id: UUID4
    assigned_officer_id: Optional[UUID4] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ComplaintHistoryResponse(BaseModel):
    id: UUID4
    complaint_id: UUID4
    old_status: Optional[StatusEnum] = None
    new_status: StatusEnum
    changed_by: UUID4
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintWithHistoryResponse(ComplaintResponse):
    history: List[ComplaintHistoryResponse] = []
