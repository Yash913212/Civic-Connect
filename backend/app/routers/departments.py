from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Department, User, RoleEnum
from app.auth.dependencies import get_current_user

router = APIRouter()


class DepartmentCreate(BaseModel):
    name: str
    description: str = ""


class DepartmentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None


@router.get("")
def list_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).order_by(Department.name).all()
    return [
        {
            "id": str(d.id),
            "name": d.name,
            "description": d.description,
            "is_active": d.is_active,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in depts
    ]


@router.post("")
def create_department(
    request: DepartmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create departments")
    existing = db.query(Department).filter(Department.name == request.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department already exists")
    dept = Department(name=request.name, description=request.description)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {"id": str(dept.id), "name": dept.name, "description": dept.description, "is_active": dept.is_active}


@router.patch("/{department_id}")
def update_department(
    department_id: str,
    request: DepartmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can update departments")
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    if request.name is not None:
        dept.name = request.name
    if request.description is not None:
        dept.description = request.description
    if request.is_active is not None:
        dept.is_active = request.is_active
    db.commit()
    db.refresh(dept)
    return {"id": str(dept.id), "name": dept.name, "description": dept.description, "is_active": dept.is_active}


@router.delete("/{department_id}")
def delete_department(
    department_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete departments")
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted"}
