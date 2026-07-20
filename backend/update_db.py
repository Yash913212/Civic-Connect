import os
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

settings = settings
engine = create_engine(settings.DATABASE_URL)

alter_users_queries = [
    "ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0;",
    "ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;",
    "ALTER TABLE users ADD COLUMN badges VARCHAR DEFAULT '';",
    "ALTER TABLE users ADD COLUMN complaints_submitted INTEGER DEFAULT 0;",
    "ALTER TABLE users ADD COLUMN complaints_verified INTEGER DEFAULT 0;",
    "ALTER TABLE users ADD COLUMN streak_days INTEGER DEFAULT 0;",
    "ALTER TABLE users ADD COLUMN last_active_date TIMESTAMP WITH TIME ZONE;"
]

alter_complaints_queries = [
    "ALTER TABLE complaints ADD COLUMN sla_deadline TIMESTAMP WITH TIME ZONE;",
    "ALTER TABLE complaints ADD COLUMN escalation_level INTEGER DEFAULT 0;",
    "ALTER TABLE complaints ADD COLUMN sla_status VARCHAR DEFAULT 'ON_TRACK';",
    "ALTER TABLE complaints ADD COLUMN last_escalated_at TIMESTAMP WITH TIME ZONE;",
    "ALTER TABLE complaints ADD COLUMN resolution_image_url VARCHAR;",
    "ALTER TABLE complaints ADD COLUMN resolution_notes VARCHAR;",
    "ALTER TABLE complaints ADD COLUMN verification_status VARCHAR;",
    "ALTER TABLE complaints ADD COLUMN verification_score INTEGER;",
    "ALTER TABLE complaints ADD COLUMN verified_by VARCHAR(36) REFERENCES users(id);",
    "ALTER TABLE complaints ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;"
]

alter_enum_queries = [
    "ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'SLA_WARNING';",
    "ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'SLA_BREACH';"
]

with engine.connect() as conn:
    # First, run enum updates, and we must commit them separately because ALTER TYPE cannot run in a transaction block
    try:
        # We need to run ALTER TYPE outside of a transaction or with autocommit, depending on the postgresql version.
        # But SQLAlchemy's execution model typically wraps in a transaction unless we use isolation_level="AUTOCOMMIT".
        pass
    except Exception as e:
        pass
    
    # We will just run it in autocommit mode.
    # Actually, let's reopen the connection with AUTOCOMMIT for enums.
    
with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
    for query in alter_enum_queries:
        try:
            conn.execute(text(query))
            print(f"Executed: {query}")
        except Exception as e:
            print(f"Error executing {query} (might already exist): {e}")

with engine.connect() as conn:
    for query in alter_users_queries + alter_complaints_queries:
        try:
            conn.execute(text(query))
            print(f"Executed: {query}")
        except Exception as e:
            print(f"Error executing {query}: {e}")
    conn.commit()
    print("Database schema updated successfully.")
