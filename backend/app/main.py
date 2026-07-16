from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from app.core.dependencies import limiter, manager
from app.core.config import settings
from app.database.database import engine, Base
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
import os

load_dotenv()

try:
    Base.metadata.create_all(bind=engine)
    print("Database connected successfully.")
except Exception as e:
    print("Database initialization failed:", e)

if not settings.DATABASE_URL.startswith("sqlite"):
    migrations = [
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS image_url VARCHAR",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS latitude VARCHAR",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS longitude VARCHAR",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS address VARCHAR",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS user_id VARCHAR",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_to VARCHAR",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS ai_summary VARCHAR",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS ai_request_letter VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR",
    ]
    for stmt in migrations:
        try:
            with engine.begin() as conn:
                conn.execute(text(stmt))
        except Exception:
            pass

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE complaints ALTER COLUMN priority TYPE VARCHAR USING priority::VARCHAR"))
            conn.execute(text("ALTER TABLE complaints ALTER COLUMN status TYPE VARCHAR USING status::VARCHAR"))
    except Exception:
        pass

    for table in ["notifications", "departments"]:
        try:
            Base.metadata.tables[table].create(bind=engine, checkfirst=True)
        except Exception:
            pass

app = FastAPI(title="CivicConnect API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://civic-connect-self.vercel.app",
        "https://civic-connect-self.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.auth.routes import router as auth_router
from app.routers.complaints import router as complaints_router
from app.routers.users import router as users_router, officers_router
from app.routers.departments import router as departments_router
from app.routers.notifications import router as notifications_router
from app.routers.analytics import router as analytics_router
from app.routers.ai_routes import router as ai_router
from app.routers.predictions import router as predictions_router

from fastapi import APIRouter
api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(complaints_router, prefix="/complaints", tags=["Complaints"])
api_router.include_router(officers_router, tags=["Users"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(departments_router, prefix="/departments", tags=["Departments"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(ai_router, tags=["AI"])
api_router.include_router(predictions_router, tags=["Predictions"])

app.include_router(api_router)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


@app.get("/")
@app.head("/")
def root():
    return {"message": "Welcome to CivicConnect API"}
