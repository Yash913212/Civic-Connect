from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, RoleEnum
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        import uuid
        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def require_role(required_roles: list[RoleEnum]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

RequireCitizen = Depends(require_role([RoleEnum.CITIZEN, RoleEnum.OFFICER, RoleEnum.ADMIN]))
RequireOfficer = Depends(require_role([RoleEnum.OFFICER, RoleEnum.ADMIN]))
RequireAdmin = Depends(require_role([RoleEnum.ADMIN]))

def get_optional_user(authorization: str | None = None, db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str:
            import uuid
            try:
                user_id = uuid.UUID(user_id_str)
                return db.query(User).filter(User.id == user_id).first()
            except ValueError:
                pass
    except JWTError:
        pass
    return None
