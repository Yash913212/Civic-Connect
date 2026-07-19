from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database.models import User, Complaint, ComplaintStatus, Badge, UserBadge, RoleEnum
from sqlalchemy import insert
import logging

logger = logging.getLogger(__name__)


def seed_badges(db: Session):
    """Seed initial badges into the database."""
    badge_data = [
        ("first_complaint", "First Step", "Submit your first complaint", "🎯", 10),
        ("complaint_warrior", "Complaint Warrior", "Submit 5 complaints", "⚔️", 50),
        ("civic_champion", "Civic Champion", "Submit 10 complaints", "🏆", 100),
        ("city_guardian", "City Guardian", "Submit 25 complaints", "🛡️", 250),
        ("verified_reporter", "Verified Reporter", "Have 3 complaints verified as resolved", "✅", 75),
        ("streak_master", "Streak Master", "Maintain a 7-day active streak", "🔥", 100),
        ("priority_hunter", "Priority Hunter", "Submit 3 high-priority complaints", "⚡", 60),
        ("department_expert", "Department Expert", "Submit complaints in 3 different departments", "🎓", 80),
    ]
    
    for badge_id, name, description, icon, points in badge_data:
        existing = db.query(Badge).filter(Badge.id == badge_id).first()
        if not existing:
            db.add(Badge(
                id=badge_id,
                name=name,
                description=description,
                icon=icon,
                points=points
            ))
    db.commit()


BADGES = {
    "first_complaint": {
        "name": "First Step",
        "description": "Submit your first complaint",
        "icon": "🎯",
        "points": 10,
    },
    "complaint_warrior": {
        "name": "Complaint Warrior",
        "description": "Submit 5 complaints",
        "icon": "⚔️",
        "points": 50,
    },
    "civic_champion": {
        "name": "Civic Champion",
        "description": "Submit 10 complaints",
        "icon": "🏆",
        "points": 100,
    },
    "city_guardian": {
        "name": "City Guardian",
        "description": "Submit 25 complaints",
        "icon": "🛡️",
        "points": 250,
    },
    "verified_reporter": {
        "name": "Verified Reporter",
        "description": "Have 3 complaints verified as resolved",
        "icon": "✅",
        "points": 75,
    },
    "streak_master": {
        "name": "Streak Master",
        "description": "Maintain a 7-day active streak",
        "icon": "🔥",
        "points": 100,
    },
    "priority_hunter": {
        "name": "Priority Hunter",
        "description": "Submit 3 high-priority complaints",
        "icon": "⚡",
        "points": 60,
    },
    "department_expert": {
        "name": "Department Expert",
        "description": "Submit complaints in 3 different departments",
        "icon": "🎓",
        "points": 80,
    },
}

# Level thresholds
LEVEL_THRESHOLDS = [
    0, 50, 150, 300, 500, 750, 1000, 1500, 2000, 3000, 5000
]

# Points per action
POINTS = {
    "complaint_submitted": 10,
    "complaint_verified": 25,
    "upvote_received": 5,
    "daily_active": 2,
    # Officer points
    "officer_resolved_critical": 150,
    "officer_resolved_high": 100,
    "officer_resolved_medium": 50,
    "officer_resolved_low": 25,
    "officer_sla_bonus": 50,
}


def calculate_level(points: int) -> int:
    """Calculate user level based on points."""
    if points is None:
        points = 0
    level = 1
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if points >= threshold:
            level = i + 1
        else:
            break
    return min(level, 10)


def get_points_to_next_level(points: int) -> int:
    """Get points needed to reach next level."""
    if points is None:
        points = 0
    current_level = calculate_level(points)
    if current_level >= len(LEVEL_THRESHOLDS):
        return 0
    return LEVEL_THRESHOLDS[current_level] - points


def award_points(user: User, action: str, db: Session) -> dict:
    """Award points to user for an action."""
    if user.points is None:
        user.points = 0
    if user.level is None:
        user.level = 1
    if user.streak_days is None:
        user.streak_days = 0

    points = POINTS.get(action, 0)
    if points == 0:
        return {"points_added": 0, "total_points": user.points, "level": user.level}
    
    old_level = user.level
    user.points += points
    user.level = calculate_level(user.points)
    
    # Update streak
    now = datetime.now(timezone.utc)
    if user.last_active_date:
        last_active = user.last_active_date
        if last_active.tzinfo is None:
            last_active = last_active.replace(tzinfo=timezone.utc)
        
        days_since_last = (now.date() - last_active.date()).days if last_active.date() != now.date() else 0
        if days_since_last == 1:
            user.streak_days += 1
        elif days_since_last > 1:
            user.streak_days = 1
    else:
        user.streak_days = 1
    
    user.last_active_date = now
    
    # Check for level up
    level_up = user.level > old_level
    
    # Check for badge eligibility
    new_badges = check_badge_eligibility(user, db)
    
    db.commit()
    
    return {
        "points_added": points,
        "total_points": user.points,
        "level": user.level,
        "level_up": level_up,
        "new_badges": new_badges,
        "streak_days": user.streak_days,
    }


def check_badge_eligibility(user: User, db: Session) -> list[dict]:
    """Check if user is eligible for any new badges and award them."""
    if user.streak_days is None:
        user.streak_days = 0

    earned_user_badges = db.query(UserBadge).filter(UserBadge.user_id == user.id).all()
    earned_badge_ids = {ub.badge_id for ub in earned_user_badges}
    new_badges = []
    
    complaint_count = db.query(Complaint).filter(
        Complaint.user_id == user.id
    ).count()
    
    verified_count = db.query(Complaint).filter(
        Complaint.user_id == user.id,
        Complaint.status == ComplaintStatus.RESOLVED.value,
        Complaint.verification_status == "VERIFIED"
    ).count()
    
    departments = db.query(Complaint.department).filter(
        Complaint.user_id == user.id
    ).distinct().count()
    
    high_priority_count = db.query(Complaint).filter(
        Complaint.user_id == user.id,
        Complaint.priority == "High"
    ).count()
    
    badge_checks = {
        "first_complaint": complaint_count >= 1,
        "complaint_warrior": complaint_count >= 5,
        "civic_champion": complaint_count >= 10,
        "city_guardian": complaint_count >= 25,
        "verified_reporter": verified_count >= 3,
        "streak_master": user.streak_days >= 7,
        "priority_hunter": high_priority_count >= 3,
        "department_expert": departments >= 3,
    }
    
    for badge_id, condition in badge_checks.items():
        if condition and badge_id not in earned_badge_ids:
            db.add(UserBadge(user_id=user.id, badge_id=badge_id))
            badge_info = db.query(Badge).filter(Badge.id == badge_id).first()
            if badge_info:
                new_badges.append({
                    "id": badge_info.id,
                    "name": badge_info.name,
                    "description": badge_info.description,
                    "icon": badge_info.icon,
                    "points": badge_info.points,
                })
            elif badge_id in BADGES:
                local_info = BADGES[badge_id]
                new_badges.append({
                    "id": badge_id,
                    "name": local_info["name"],
                    "description": local_info["description"],
                    "icon": local_info.get("icon"),
                    "points": local_info["points"],
                })
    
    if new_badges:
        db.commit()
    
    return new_badges


def get_user_gamification_profile(user: User, db: Session) -> dict:
    """Get comprehensive gamification profile for a user."""
    earned_user_badges = db.query(UserBadge).filter(UserBadge.user_id == user.id).all()
    earned_badge_ids = {ub.badge_id for ub in earned_user_badges}
    
    all_badges = []
    badges_in_db = db.query(Badge).all()
    for badge in badges_in_db:
        all_badges.append({
            "id": badge.id,
            "name": badge.name,
            "description": badge.description,
            "icon": badge.icon,
            "points": badge.points,
            "earned": badge.id in earned_badge_ids,
        })
    
    if not all_badges:
        for badge_id, badge_info in BADGES.items():
            all_badges.append({
                "id": badge_id,
                **badge_info,
                "earned": badge_id in earned_badge_ids,
            })
    
    points_to_next = get_points_to_next_level(user.points)
    current_level = user.level
    current_threshold = LEVEL_THRESHOLDS[current_level - 1] if current_level <= len(LEVEL_THRESHOLDS) else LEVEL_THRESHOLDS[-1]
    next_threshold = LEVEL_THRESHOLDS[current_level] if current_level < len(LEVEL_THRESHOLDS) else None
    progress_percentage = 0
    if next_threshold:
        progress_percentage = int(((user.points - current_threshold) / (next_threshold - current_threshold)) * 100)
    
    leaderboard_position = db.query(User).filter(
        User.role == user.role,
        User.points > user.points
    ).count() + 1
    
    return {
        "points": user.points,
        "level": user.level,
        "streak_days": user.streak_days,
        "complaints_submitted": user.complaints_submitted or 0,
        "complaints_verified": user.complaints_verified or 0,
        "badges": all_badges,
        "earned_badges_count": len(earned_badge_ids),
        "total_badges": len(all_badges),
        "points_to_next_level": points_to_next,
        "level_progress_percentage": progress_percentage,
        "leaderboard_position": leaderboard_position,
    }


def get_leaderboard(db: Session, limit: int = 10, role: str = "CITIZEN") -> list[dict]:
    """Get top users by points."""
    role_enum = RoleEnum.CITIZEN if role == "CITIZEN" else RoleEnum.OFFICER
    top_users = db.query(User).filter(
        User.role == role_enum,
        User.is_active == True
    ).order_by(User.points.desc()).limit(limit).all()
    
    results = []
    for i, user in enumerate(top_users):
        badge_count = db.query(UserBadge).filter(UserBadge.user_id == user.id).count()
        results.append({
            "rank": i + 1,
            "user_id": str(user.id),
            "name": user.full_name,
            "points": user.points,
            "level": user.level,
            "badges_count": badge_count,
        })
    
    return results
