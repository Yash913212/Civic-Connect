import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Enum, func, Text, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.database import Base
import enum

class RoleEnum(str, enum.Enum):
    CITIZEN = "CITIZEN"
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"

class StatusEnum(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    ANALYZED = "ANALYZED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    VERIFIED = "VERIFIED"
    CLOSED = "CLOSED"

class PriorityEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.CITIZEN, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    complaints = relationship("Complaint", foreign_keys="[Complaint.citizen_id]", back_populates="citizen")
    assigned_complaints = relationship("Complaint", foreign_keys="[Complaint.assigned_officer_id]", back_populates="assigned_officer")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    image_url = Column(String, nullable=True)
    status = Column(Enum(StatusEnum), default=StatusEnum.SUBMITTED, nullable=False)
    priority = Column(Enum(PriorityEnum), default=PriorityEnum.LOW, nullable=False)
    department = Column(String, nullable=True)
    
    citizen_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_officer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    citizen = relationship("User", foreign_keys=[citizen_id], back_populates="complaints")
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id], back_populates="assigned_complaints")
    history = relationship("ComplaintHistory", back_populates="complaint", cascade="all, delete-orphan")


class ComplaintHistory(Base):
    __tablename__ = "complaint_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    complaint_id = Column(UUID(as_uuid=True), ForeignKey("complaints.id"), nullable=False)
    old_status = Column(Enum(StatusEnum), nullable=True)
    new_status = Column(Enum(StatusEnum), nullable=False)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    complaint = relationship("Complaint", back_populates="history")
    changer = relationship("User", foreign_keys=[changed_by])
