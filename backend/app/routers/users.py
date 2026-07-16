from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, RoleEnum
from app.auth.dependencies import get_current_user

officers_router = APIRouter(prefix="")
router = APIRouter()


class RoleUpdateRequest(BaseModel):
    role: str


class DepartmentUpdateRequest(BaseModel):
    department: str | None = None


@officers_router.get("/officers")
def list_officers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can list officers")

    officers = db.query(User).filter(User.role == RoleEnum.OFFICER, User.is_active == True).all()
    return [
        {
            "id": str(o.id),
            "full_name": o.full_name,
            "email": o.email,
            "department": o.department,
        }
        for o in officers
    ]


@router.get("")
def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can list users")
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "phone_number": u.phone_number,
            "role": u.role.value if hasattr(u.role, 'value') else u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.patch("/{user_id}/role")
def update_user_role(
    user_id: str,
    request: RoleUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can change roles")
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        user.role = RoleEnum(request.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(r.value for r in RoleEnum)}")
    db.commit()
    return {"message": f"User role updated to {request.role}"}


@router.patch("/{user_id}/toggle-active")
def toggle_user_active(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can toggle user status")
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot disable your own account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}


@router.patch("/{user_id}/department")
def update_user_department(
    user_id: str,
    request: DepartmentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can update department")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.department = request.department
    db.commit()
    return {"message": f"Department updated to '{request.department}'", "department": user.department}
