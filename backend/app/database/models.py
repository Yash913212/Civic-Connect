import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Enum, func, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.database.database import Base
import enum

class RoleEnum(str, enum.Enum):
    CITIZEN = "CITIZEN"
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"

class PriorityEnum(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

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

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.CITIZEN, nullable=False)
    is_active = Column(Boolean, default=True)
    points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak_days = Column(Integer, default=0)
    last_active_date = Column(DateTime(timezone=True), nullable=True)
    complaints_submitted = Column(Integer, default=0)
    complaints_verified = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class NotificationType(str, enum.Enum):
    STATUS_UPDATE = "status_update"
    ASSIGNMENT = "assignment"
    COMPLAINT_SUBMITTED = "complaint_submitted"
    COMPLAINT_RESOLVED = "complaint_resolved"

class ComplaintStatus(str, enum.Enum):
    PENDING = "Pending"
    UNASSIGNED = "Unassigned"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    ESCALATED = "Escalated"
    RESOLVED = "Resolved"

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(String, nullable=True)
    longitude = Column(String, nullable=True)
    address = Column(String, nullable=True)
    department = Column(String, default="General")
    priority = Column(String, default="Low")
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.UNASSIGNED)
    image_url = Column(String, nullable=True)
    verification_status = Column(String, default="PENDING")
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    sla_deadline = Column(DateTime(timezone=True), nullable=True)
    sla_status = Column(String, default="ON_TRACK")
    ai_summary = Column(String, nullable=True)
    ai_request_letter = Column(String, nullable=True)
    escalation_level = Column(Integer, default=0)
    last_escalated_at = Column(DateTime(timezone=True), nullable=True)
    resolution_image_url = Column(String, nullable=True)
    resolution_notes = Column(String, nullable=True)
    verification_score = Column(Integer, nullable=True)
    verified_by = Column(String(36), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    complaint_id = Column(UUID(as_uuid=True), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Badge(Base):
    __tablename__ = "badges"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    icon = Column(String, nullable=True)
    points = Column(Integer, default=0)

class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    badge_id = Column(String, ForeignKey("badges.id"), nullable=False)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
