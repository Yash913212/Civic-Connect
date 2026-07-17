from datetime import datetime, timedelta, timezone
from enum import Enum
from pydantic import BaseModel
from typing import Optional


class SLADuration(BaseModel):
    hours: int
    escalate_to: str  # Role or department to escalate to


class SLAConfig(BaseModel):
    # Default SLA durations by department (in hours)
    department_sla: dict[str, SLADuration] = {
        "Roads": SLADuration(hours=168, escalate_to="PUBLIC_WORKS"),  # 7 days
        "Drainage": SLADuration(hours=48, escalate_to="WATER_BOARD"),  # 2 days
        "Garbage": SLADuration(hours=24, escalate_to="SANITATION"),  # 1 day
        "Water": SLADuration(hours=48, escalate_to="WATER_BOARD"),  # 2 days
        "Streetlight": SLADuration(hours=72, escalate_to="ELECTRICAL"),  # 3 days
        "Electricity": SLADuration(hours=24, escalate_to="POWER_COMPANY"),  # 1 day
        "Safety": SLADuration(hours=12, escalate_to="POLICE"),  # 12 hours
        "Traffic": SLADuration(hours=24, escalate_to="TRAFFIC_POLICE"),  # 1 day
        "General": SLADuration(hours=120, escalate_to="ADMIN"),  # 5 days
    }
    
    # Priority multipliers
    priority_multipliers: dict[str, float] = {
        "Low": 1.5,      # 50% more time
        "Medium": 1.0,   # Standard time
        "High": 0.5,     # Half the time
        "Critical": 0.25, # Quarter of the time
    }
    
    # Escalation levels
    escalation_chain: list[str] = ["OFFICER", "ADMIN", "MUNICIPAL_COMMISSIONER"]


sla_config = SLAConfig()


def get_sla_deadline(department: str, priority: str, created_at: datetime) -> datetime:
    """Calculate SLA deadline based on department and priority."""
    base_sla = sla_config.department_sla.get(
        department, 
        sla_config.department_sla["General"]
    )
    multiplier = sla_config.priority_multipliers.get(priority, 1.0)
    
    sla_hours = int(base_sla.hours * multiplier)
    return created_at + timedelta(hours=sla_hours)


def get_escalation_target(department: str, current_level: int = 0) -> Optional[str]:
    """Get the escalation target based on current level."""
    if current_level >= len(sla_config.escalation_chain):
        return None
    return sla_config.escalation_chain[current_level]


def check_sla_violation(complaint_created_at: datetime, department: str, priority: str) -> tuple[bool, Optional[int]]:
    """
    Check if SLA is violated and return violation status and hours overdue.
    Returns: (is_violated, hours_overdue)
    """
    deadline = get_sla_deadline(department, priority, complaint_created_at)
    now = datetime.now(timezone.utc)
    
    if complaint_created_at.tzinfo is None:
        complaint_created_at = complaint_created_at.replace(tzinfo=timezone.utc)
    
    if now > deadline:
        overdue_hours = int((now - deadline).total_seconds() / 3600)
        return True, overdue_hours
    return False, None


def get_sla_status(complaint_created_at: datetime, department: str, priority: str) -> dict:
    """Get comprehensive SLA status for a complaint."""
    deadline = get_sla_deadline(department, priority, complaint_created_at)
    now = datetime.now(timezone.utc)
    
    if complaint_created_at.tzinfo is None:
        complaint_created_at = complaint_created_at.replace(tzinfo=timezone.utc)
    
    total_hours = int((deadline - complaint_created_at).total_seconds() / 3600)
    elapsed_hours = int((now - complaint_created_at).total_seconds() / 3600)
    remaining_hours = max(0, total_hours - elapsed_hours)
    
    is_overdue = now > deadline
    percentage_used = min(100, int((elapsed_hours / total_hours) * 100)) if total_hours > 0 else 100
    
    # Determine urgency level
    if is_overdue:
        urgency = "OVERDUE"
    elif percentage_used >= 80:
        urgency = "CRITICAL"
    elif percentage_used >= 60:
        urgency = "WARNING"
    else:
        urgency = "ON_TRACK"
    
    return {
        "deadline": deadline.isoformat(),
        "total_hours": total_hours,
        "elapsed_hours": elapsed_hours,
        "remaining_hours": remaining_hours,
        "is_overdue": is_overdue,
        "percentage_used": percentage_used,
        "urgency": urgency,
    }
