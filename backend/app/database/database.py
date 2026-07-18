from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

import os
import sys

# Detect if running in a test environment
IS_TESTING = (
    "pytest" in sys.modules
    or (len(sys.argv) > 0 and "pytest" in sys.argv[0])
    or os.getenv("TESTING") == "1"
)

db_url = "sqlite:///./test.db" if IS_TESTING else settings.DATABASE_URL

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    db_url,
    connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
