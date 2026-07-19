from contextlib import asynccontextmanager
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
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database connected successfully.")
except Exception as e:
    logger.error("Database initialization failed: %s", e)

migrations = [
    ("complaints", "image_url", "VARCHAR"),
    ("complaints", "latitude", "VARCHAR"),
    ("complaints", "longitude", "VARCHAR"),
    ("complaints", "address", "VARCHAR"),
    ("complaints", "user_id", "VARCHAR"),
    ("complaints", "assigned_to", "VARCHAR"),
    ("complaints", "ai_summary", "VARCHAR"),
    ("complaints", "ai_request_letter", "VARCHAR"),
    ("complaints", "verification_status", "VARCHAR DEFAULT 'PENDING'"),
    ("users", "department", "VARCHAR"),
    ("users", "points", "INTEGER DEFAULT 0"),
    ("users", "level", "INTEGER DEFAULT 1"),
    ("users", "streak_days", "INTEGER DEFAULT 0"),
    ("users", "last_active_date", "TIMESTAMP"),
    ("users", "complaints_submitted", "INTEGER DEFAULT 0"),
    ("users", "complaints_verified", "INTEGER DEFAULT 0"),
]

for table, column, col_type in migrations:
    try:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
            logger.info(f"Added column {column} to table {table}")
    except Exception as e:
        pass

for table in ["notifications", "departments", "badges", "user_badges"]:
    try:
        Base.metadata.tables[table].create(bind=engine, checkfirst=True)
        logger.info(f"Table {table} verified/created.")
    except Exception as e:
        logger.debug(f"Table creation skipped for {table}: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.sla_monitor import start_sla_monitor
    from app.core.gamification import seed_badges
    from app.database.database import SessionLocal, IS_TESTING

    if not IS_TESTING:
        start_sla_monitor()

    db = SessionLocal()
    try:
        seed_badges(db)
        logger.info("Badges seeded successfully")
    except Exception as e:
        logger.warning(f"Badge seeding skipped: {e}")
    finally:
        db.close()

    yield


app = FastAPI(title="CivicConnect API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def limit_request_size(request, call_next):
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > max_size:
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    status_code=413,
                    content={"detail": f"Request body too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB}MB."}
                )
        except (ValueError, TypeError):
            pass
    response = await call_next(request)
    return response

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://civic-connect-self.vercel.app",
]

if settings.ALLOWED_ORIGINS:
    origins.extend([o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Set-Cookie"],
    expose_headers=["Set-Cookie"],
    max_age=3600,
)

from app.auth.routes import router as auth_router
from app.routers.complaints import router as complaints_router
from app.routers.users import router as users_router, officers_router
from app.routers.departments import router as departments_router
from app.routers.notifications import router as notifications_router
from app.routers.analytics import router as analytics_router
from app.routers.ai_routes import router as ai_router
from app.routers.predictions import router as predictions_router
from app.routers.sla import router as sla_router
from app.routers.resolution import router as resolution_router
from app.routers.transparency import router as transparency_router
from app.routers.gamification import router as gamification_router

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
api_router.include_router(sla_router, prefix="/complaints", tags=["SLA"])
api_router.include_router(resolution_router, prefix="/complaints", tags=["Resolution"])
api_router.include_router(transparency_router, prefix="/transparency", tags=["Transparency"])
api_router.include_router(gamification_router, prefix="/gamification", tags=["Gamification"])

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
