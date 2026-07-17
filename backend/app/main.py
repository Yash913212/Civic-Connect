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
        except Exception as e:
            logger.debug("Migration step skipped: %s", e)

    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE complaints ALTER COLUMN priority TYPE VARCHAR USING priority::VARCHAR"))
            conn.execute(text("ALTER TABLE complaints ALTER COLUMN status TYPE VARCHAR USING status::VARCHAR"))
    except Exception as e:
        logger.debug("Type migration skipped: %s", e)

    for table in ["notifications", "departments"]:
        try:
            Base.metadata.tables[table].create(bind=engine, checkfirst=True)
        except Exception as e:
            logger.debug("Table creation skipped for %s: %s", table, e)

app = FastAPI(title="CivicConnect API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.middleware("http")
async def limit_request_size(request, call_next):
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > max_size:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=413,
            content={"detail": f"Request body too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB}MB."}
        )
    response = await call_next(request)
    return response

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
app.include_router(ai_router, tags=["AI"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Start SLA monitoring background task
@app.on_event("startup")
async def startup_event():
    from app.core.sla_monitor import start_sla_monitor
    start_sla_monitor()


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
