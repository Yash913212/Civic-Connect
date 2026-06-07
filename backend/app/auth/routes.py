from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User
from app.auth.schemas import UserCreate, UserResponse, LoginRequest, TokenResponse, RefreshTokenRequest
from app.auth.service import create_user, authenticate_user
from app.auth.dependencies import get_current_user
from app.core.security import create_access_token
from app.core.config import settings
from jose import jwt, JWTError

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = create_user(db, user)
    return {
        "message": "Registration successful",
        "user": UserResponse.model_validate(db_user)
    }

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    return authenticate_user(db, login_data)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/refresh", response_model=dict)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(request.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        token_type = payload.get("type")
        if user_id is None or token_type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
        
    new_access_token = create_access_token(subject=str(user.id))
    return {"access_token": new_access_token}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    # Simple implementation: instruct client to drop tokens.
    # To fully invalidate tokens server-side, a token blacklist/redis would be needed.
    return {"message": "Successfully logged out"}
