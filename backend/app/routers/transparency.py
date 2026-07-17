from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database.database import get_db
from app.database.models import Complaint, ComplaintStatus, Department
from datetime import datetime, timedelta, timezone

router = APIRouter()


@router.get("/public/stats")
def get_public_stats(db: Session = Depends(get_db)):
    """Get public statistics for the transparency portal (no auth required)."""
    total_complaints = db.query(Complaint).count()
    
    # Status distribution
    status_counts = db.query(
        Complaint.status,
        func.count(Complaint.id)
    ).group_by(Complaint.status).all()
    
    status_distribution = {status: count for status, count in status_counts}
    
    # Department distribution
    dept_counts = db.query(
        Complaint.department,
        func.count(Complaint.id)
    ).group_by(Complaint.department).all()
    
    department_distribution = {dept: count for dept, count in dept_counts}
    
    # Priority distribution
    priority_counts = db.query(
        Complaint.priority,
        func.count(Complaint.id)
    ).group_by(Complaint.priority).all()
    
    priority_distribution = {priority: count for priority, count in priority_counts}
    
    # Resolution rate
    resolved_count = status_distribution.get("Resolved", 0)
    resolution_rate = (resolved_count / total_complaints * 100) if total_complaints > 0 else 0
    
    # Average resolution time (for resolved complaints)
    resolved_complaints = db.query(Complaint).filter(
        Complaint.status == ComplaintStatus.RESOLVED.value,
        Complaint.updated_at.isnot(None)
    ).all()
    
    avg_resolution_hours = 0
    if resolved_complaints:
        total_hours = 0
        for complaint in resolved_complaints:
            created = complaint.created_at
            updated = complaint.updated_at
            if created and updated:
                if created.tzinfo is None:
                    created = created.replace(tzinfo=timezone.utc)
                if updated.tzinfo is None:
                    updated = updated.replace(tzinfo=timezone.utc)
                hours = (updated - created).total_seconds() / 3600
                total_hours += hours
        avg_resolution_hours = int(total_hours / len(resolved_complaints))
    
    # Recent activity (last 7 days)
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_count = db.query(Complaint).filter(
        Complaint.created_at >= week_ago
    ).count()
    
    return {
        "total_complaints": total_complaints,
        "resolution_rate": round(resolution_rate, 1),
        "avg_resolution_hours": avg_resolution_hours,
        "recent_complaints_7d": recent_count,
        "status_distribution": status_distribution,
        "department_distribution": department_distribution,
        "priority_distribution": priority_distribution,
    }


@router.get("/public/trending")
def get_trending_issues(db: Session = Depends(get_db)):
    """Get trending issues for the public dashboard."""
    # Get complaints from last 30 days
    month_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    # Top departments by complaint count
    top_departments = db.query(
        Complaint.department,
        func.count(Complaint.id).label("count")
    ).filter(
        Complaint.created_at >= month_ago
    ).group_by(
        Complaint.department
    ).order_by(
        func.count(Complaint.id).desc()
    ).limit(5).all()
    
    # Top locations by complaint count
    top_locations = db.query(
        Complaint.location,
        func.count(Complaint.id).label("count")
    ).filter(
        Complaint.created_at >= month_ago,
        Complaint.location.isnot(None)
    ).group_by(
        Complaint.location
    ).order_by(
        func.count(Complaint.id).desc()
    ).limit(10).all()
    
    return {
        "top_departments": [
            {"department": dept, "count": count}
            for dept, count in top_departments
        ],
        "top_locations": [
            {"location": loc, "count": count}
            for loc, count in top_locations
        ],
    }


@router.get("/public/performance")
def get_department_performance(db: Session = Depends(get_db)):
    """Get department performance metrics for transparency."""
    departments = db.query(Department).filter(Department.is_active == True).all()
    
    performance = []
    for dept in departments:
        # Total complaints for this department
        total = db.query(Complaint).filter(
            Complaint.department == dept.name
        ).count()
        
        # Resolved complaints
        resolved = db.query(Complaint).filter(
            Complaint.department == dept.name,
            Complaint.status == ComplaintStatus.RESOLVED.value
        ).count()
        
        # Resolution rate
        resolution_rate = (resolved / total * 100) if total > 0 else 0
        
        # Average resolution time
        resolved_complaints = db.query(Complaint).filter(
            Complaint.department == dept.name,
            Complaint.status == ComplaintStatus.RESOLVED.value,
            Complaint.updated_at.isnot(None)
        ).all()
        
        avg_hours = 0
        if resolved_complaints:
            total_hours = 0
            for complaint in resolved_complaints:
                created = complaint.created_at
                updated = complaint.updated_at
                if created and updated:
                    if created.tzinfo is None:
                        created = created.replace(tzinfo=timezone.utc)
                    if updated.tzinfo is None:
                        updated = updated.replace(tzinfo=timezone.utc)
                    hours = (updated - created).total_seconds() / 3600
                    total_hours += hours
            avg_hours = int(total_hours / len(resolved_complaints))
        
        performance.append({
            "department": dept.name,
            "total_complaints": total,
            "resolved": resolved,
            "resolution_rate": round(resolution_rate, 1),
            "avg_resolution_hours": avg_hours,
        })
    
    # Sort by resolution rate (best performing first)
    performance.sort(key=lambda x: x["resolution_rate"], reverse=True)
    
    return performance


@router.get("/public/wards")
def get_ward_stats(db: Session = Depends(get_db)):
    """Get ward/area-wise statistics."""
    # This is a simplified version - in production, you'd have a wards table
    # For now, we'll group by location (first part of address)
    
    month_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    # Get all complaints with locations
    complaints = db.query(Complaint).filter(
        Complaint.created_at >= month_ago,
        Complaint.location.isnot(None)
    ).all()
    
    # Simple ward grouping based on location keywords
    ward_stats = {}
    for complaint in complaints:
        # Extract a simple ward identifier from location
        location = complaint.location or "Unknown"
        # Use first 20 chars as a simple ward identifier
        ward = location[:20] if len(location) > 20 else location
        
        if ward not in ward_stats:
            ward_stats[ward] = {
                "total": 0,
                "resolved": 0,
                "pending": 0,
            }
        
        ward_stats[ward]["total"] += 1
        if complaint.status == ComplaintStatus.RESOLVED.value:
            ward_stats[ward]["resolved"] += 1
        elif complaint.status in ["Pending", "Assigned", "In Progress"]:
            ward_stats[ward]["pending"] += 1
    
    # Sort by total complaints
    sorted_wards = sorted(ward_stats.items(), key=lambda x: x[1]["total"], reverse=True)
    
    return [
        {"ward": ward, **stats}
        for ward, stats in sorted_wards[:20]  # Top 20 wards
    ]
