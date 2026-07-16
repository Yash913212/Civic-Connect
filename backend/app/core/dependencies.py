from fastapi import WebSocket, Depends, HTTPException, status, Header
from fastapi import Request
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.core.config import settings
from app.database.database import get_db
from app.database.models import User
from slowapi import Limiter
from slowapi.util import get_remote_address
from PIL import Image
import io

limiter = Limiter(key_func=get_remote_address)


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except:
                    pass

    async def broadcast_to_admins(self, message: str, db: Session):
        from app.database.models import RoleEnum
        admins = db.query(User).filter(User.role == RoleEnum.ADMIN).all()
        for admin in admins:
            await self.send_personal_message(message, str(admin.id))


manager = ConnectionManager()


def get_optional_user(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        return None
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id:
            return db.query(User).filter(User.id == user_id).first()
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return None


def compress_image(contents: bytes, max_size=(1024, 1024), quality=80) -> bytes:
    try:
        img = Image.open(io.BytesIO(contents))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        output = io.BytesIO()
        img.save(output, format="JPEG", quality=quality, optimize=True)
        return output.getvalue()
    except Exception as e:
        print(f"Image compression failed: {e}")
        return contents
