from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.routes import router as auth_router
from app.database.database import engine, Base

# Create tables (In production, use Alembic migrations instead)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CivicConnect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow your frontend in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "CivicConnect API is running"}
