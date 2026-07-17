import os
import sys
from sqlalchemy import create_engine, text
from app.core.config import Settings

settings = Settings()
engine = create_engine(settings.DATABASE_URL)

alter_users_queries = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS badges VARCHAR DEFAULT '';",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS complaints_submitted INTEGER DEFAULT 0;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS complaints_verified INTEGER DEFAULT 0;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_date TIMESTAMP WITH TIME ZONE;"
]

alter_complaints_queries = [
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP WITH TIME ZONE;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS sla_status VARCHAR DEFAULT 'ON_TRACK';",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS last_escalated_at TIMESTAMP WITH TIME ZONE;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolution_image_url VARCHAR;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolution_notes VARCHAR;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS verification_status VARCHAR;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS verification_score INTEGER;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS verified_by VARCHAR(36) REFERENCES users(id);",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;"
]

with engine.connect() as conn:
    for query in alter_users_queries + alter_complaints_queries:
        try:
            conn.execute(text(query))
            print(f"Executed: {query}")
        except Exception as e:
            print(f"Error executing {query}: {e}")
    conn.commit()
    print("Database schema updated successfully.")
