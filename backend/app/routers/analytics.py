from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Complaint, ComplaintStatus
from datetime import datetime, timedelta
from sqlalchemy import func, case

router = APIRouter()


@router.get("")
def get_analytics(db: Session = Depends(get_db)):
    total = db.query(Complaint).count()
    closed = db.query(Complaint).filter(Complaint.status == ComplaintStatus.RESOLVED).count()
    open_cases = total - closed
    resolution_rate = int((closed / total * 100)) if total > 0 else 0

    priority_counts = db.query(Complaint.priority, func.count(Complaint.id)).group_by(Complaint.priority).all()
    priority_map = {p: c for p, c in priority_counts}
    priority_data = [
        {"name": "Critical", "value": priority_map.get("Critical", 0), "color": "#ef4444"},
        {"name": "High", "value": priority_map.get("High", 0), "color": "#f97316"},
        {"name": "Medium", "value": priority_map.get("Medium", 0), "color": "#eab308"},
        {"name": "Low", "value": priority_map.get("Low", 0), "color": "#10b981"},
    ]

    dept_stats = db.query(
        Complaint.department,
        func.count(Complaint.id).label('total'),
        func.sum(case((Complaint.status == ComplaintStatus.RESOLVED, 1), else_=0)).label('resolved')
    ).group_by(Complaint.department).all()

    dept_performance = []
    colors = ['#f59e0b', '#06b6d4', '#10b981', '#3b82f6', '#eab308', '#f97316', '#ef4444', '#a855f7']
    for i, (dept, d_total, d_resolved) in enumerate(dept_stats):
        eff = int((d_resolved / d_total * 100)) if d_total > 0 else 0
        dept_performance.append({
            "name": dept or "General",
            "efficiency": eff,
            "fill": colors[i % len(colors)]
        })

    today = datetime.utcnow().date()
    trends = []
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        new_count = db.query(Complaint).filter(
            func.date(Complaint.created_at) == target_date
        ).count()
        res_count = db.query(Complaint).filter(
            func.date(Complaint.updated_at) == target_date,
            Complaint.status == ComplaintStatus.RESOLVED
        ).count()
        trends.append({
            "name": target_date.strftime("%a"),
            "new": new_count,
            "resolved": res_count
        })

    return {
        "kpis": {
            "total": total,
            "open": open_cases,
            "closed": closed,
            "resolutionRate": resolution_rate
        },
        "priorityData": priority_data,
        "deptPerformance": dept_performance,
        "trends": trends
    }
