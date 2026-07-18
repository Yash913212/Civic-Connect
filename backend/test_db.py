from app.database.database import SessionLocal
from app.database.models import Complaint as DBComplaint, ComplaintStatus
from sqlalchemy import func, case
from datetime import datetime, timedelta, timezone

db = SessionLocal()
try:
    print("Total count...")
    total = db.query(DBComplaint).count()
    print("Priority...")
    priority_counts = db.query(DBComplaint.priority, func.count(DBComplaint.id)).group_by(DBComplaint.priority).all()
    print("Dept...")
    dept_stats = db.query(
        DBComplaint.department,
        func.count(DBComplaint.id).label('total'),
        func.sum(case((DBComplaint.status == ComplaintStatus.RESOLVED, 1), else_=0)).label('resolved')
    ).group_by(DBComplaint.department).all()
    print("Trends...")
    today = datetime.now(timezone.utc).date()
    target_date = today - timedelta(days=0)
    new_count = db.query(DBComplaint).filter(func.date(DBComplaint.created_at) == target_date).count()
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
