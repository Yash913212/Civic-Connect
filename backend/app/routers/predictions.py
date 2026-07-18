from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.database import get_db
from app.database.models import Complaint as DBComplaint
from app.database.models import User, RoleEnum
from app.auth.dependencies import get_current_user, require_role
from collections import defaultdict
from datetime import datetime, timedelta, timezone
import random
import math

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.get("/hotspots")
def get_hotspot_predictions(
    current_user: User = Depends(require_role([RoleEnum.OFFICER, RoleEnum.ADMIN])),
    db: Session = Depends(get_db),
):
    """
    Predicts complaint hotspots for the upcoming week.
    Uses historical density + departmental trends to compute risk zones.
    """
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    complaints = (
        db.query(DBComplaint)
        .filter(
            DBComplaint.latitude.isnot(None),
            DBComplaint.longitude.isnot(None),
            DBComplaint.created_at >= thirty_days_ago,
        )
        .all()
    )

    if not complaints:
        return {"hotspots": [], "total_predicted": 0}

    zone_buckets = defaultdict(list)
    for c in complaints:
        lat = round(float(c.latitude), 2)
        lng = round(float(c.longitude), 2)
        zone_buckets[(lat, lng)].append(c)

    hotspots = []
    total_predicted = 0

    for (lat, lng), cluster in zone_buckets.items():
        count = len(cluster)
        dept_counts = defaultdict(int)
        days_active = 0
        for c in cluster:
            dept_counts[c.department or "General"] += 1
            if c.status != "Resolved":
                days_active += 1

        trend = count / max(1, len(set(c.created_at.date() for c in cluster if c.created_at)))
        avg_days_open = days_active / max(1, count)
        top_dept = max(dept_counts, key=dept_counts.get)

        risk_score = min(1.0, (trend * 0.4 + (count / 20) * 0.3 + avg_days_open / 14 * 0.3))
        predicted_next = max(1, int(round(count * trend * random.uniform(0.8, 1.3))))

        if risk_score > 0.2:
            hotspots.append({
                "lat": lat + random.uniform(-0.01, 0.01),
                "lng": lng + random.uniform(-0.01, 0.01),
                "intensity": round(risk_score, 2),
                "predicted_complaints": predicted_next,
                "current_count": count,
                "top_department": top_dept,
                "avg_resolution_days": round(avg_days_open, 1),
            })
            total_predicted += predicted_next

    hotspots.sort(key=lambda h: h["intensity"], reverse=True)

    return {
        "hotspots": hotspots[:20],
        "total_predicted": total_predicted,
        "period": "next_7_days",
    }


@router.get("/analytics")
def get_prediction_analytics(
    current_user: User = Depends(require_role([RoleEnum.OFFICER, RoleEnum.ADMIN])),
    db: Session = Depends(get_db),
):
    """Aggregated prediction analytics for the prediction tab."""
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)

    total = db.query(DBComplaint).filter(
        DBComplaint.created_at >= thirty_days_ago
    ).count()

    dept_counts = (
        db.query(DBComplaint.department, func.count(DBComplaint.id))
        .filter(DBComplaint.created_at >= thirty_days_ago)
        .group_by(DBComplaint.department)
        .all()
    )

    unresolved = db.query(DBComplaint).filter(
        DBComplaint.status != "Resolved",
        DBComplaint.created_at >= thirty_days_ago,
    ).count()

    return {
        "total_complaints_30d": total,
        "unresolved": unresolved,
        "resolution_rate": round((total - unresolved) / max(1, total) * 100, 1) if total > 0 else 0,
        "departments": [
            {"name": dept or "General", "count": count}
            for dept, count in dept_counts
        ],
    }
