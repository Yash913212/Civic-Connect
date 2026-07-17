import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Enum, func, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.database.database import Base
import enum


def generate_uuid():
    return str(uuid.uuid4())


class RoleEnum(str, enum.Enum):
    CITIZEN = "CITIZEN"
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.CITIZEN, nullable=False)
    department = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Gamification fields
    points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    badges = Column(String, default="")  # Comma-separated badge IDs
    complaints_submitted = Column(Integer, default=0)
    complaints_verified = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    last_active_date = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class NotificationType(str, enum.Enum):
    STATUS_UPDATE = "status_update"
    ASSIGNMENT = "assignment"
    COMPLAINT_SUBMITTED = "complaint_submitted"
    COMPLAINT_RESOLVED = "complaint_resolved"
    SLA_WARNING = "sla_warning"
    SLA_BREACH = "sla_breach"

class ComplaintStatus(str, enum.Enum):
    PENDING = "Pending"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"

class PriorityEnum(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class DepartmentEnum(str, enum.Enum):
    ROADS = "Roads"
    DRAINAGE = "Drainage"
    GARBAGE = "Garbage"
    WATER = "Water"
    STREETLIGHT = "Streetlight"
    ELECTRICITY = "Electricity"
    SAFETY = "Safety"
    TRAFFIC = "Traffic"
    GENERAL = "General"

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(String, nullable=True)
    longitude = Column(String, nullable=True)
    address = Column(String, nullable=True)
    department = Column(String, default="General", index=True)
    priority = Column(String, default="Low", index=True)
    status = Column(String, default=ComplaintStatus.PENDING.value, index=True)
    image_url = Column(String, nullable=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    assigned_to = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    ai_summary = Column(String, nullable=True)
    ai_request_letter = Column(String, nullable=True)
    
    # SLA tracking fields
    sla_deadline = Column(DateTime(timezone=True), nullable=True)
    escalation_level = Column(Integer, default=0)
    sla_status = Column(String, default="ON_TRACK")  # ON_TRACK, WARNING, CRITICAL, OVERDUE
    last_escalated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Resolution verification fields
    resolution_image_url = Column(String, nullable=True)
    resolution_notes = Column(String, nullable=True)
    verification_status = Column(String, nullable=True)  # PENDING, VERIFIED, REJECTED
    verification_score = Column(Integer, nullable=True)  # 0-100 confidence score
    verified_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    assigned_officer = relationship("User", foreign_keys=[assigned_to])

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    complaint_id = Column(String(36), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
