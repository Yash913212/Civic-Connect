from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User
from app.auth.dependencies import get_current_user
from app.core.gamification import (
    get_user_gamification_profile,
    get_leaderboard,
    award_points,
    BADGES,
)

router = APIRouter()


@router.get("/profile")
def get_gamification_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get gamification profile for current user."""
    return get_user_gamification_profile(current_user, db)


@router.get("/leaderboard")
def get_gamification_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get public leaderboard."""
    return get_leaderboard(db, limit)


@router.get("/badges")
def get_all_badges():
    """Get all available badges."""
    return [
        {"id": badge_id, **badge_info}
        for badge_id, badge_info in BADGES.items()
    ]


@router.post("/award")
def manually_award_points(
    user_id: str,
    action: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually award points (admin only)."""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only admins can manually award points")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = award_points(user, action, db)
    return {
        "message": f"Awarded {result['points_added']} points to {user.full_name}",
        "result": result,
    }
