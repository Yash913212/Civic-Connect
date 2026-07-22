import sys
import logging
from sqlalchemy import text
from app.database.database import engine

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

uuid_migrations = [
    ("users", "id"),
    ("complaints", "id"),
    ("complaints", "user_id"),
    ("complaints", "assigned_to"),
    ("departments", "id"),
    ("notifications", "id"),
    ("notifications", "user_id"),
    ("notifications", "complaint_id"),
    ("user_badges", "id"),
    ("user_badges", "user_id"),
]

for table, column in uuid_migrations:
    try:
        with engine.begin() as conn:
            conn.execute(text(
                f"ALTER TABLE {table} ALTER COLUMN {column} TYPE UUID USING {column}::uuid"
            ))
            logger.info(f"Successfully converted {table}.{column} to UUID")
    except Exception as e:
        logger.error(f"Failed to convert {table}.{column} to UUID: {e}")
