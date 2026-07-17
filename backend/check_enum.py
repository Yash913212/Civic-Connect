import os
from sqlalchemy import create_engine, text
from app.core.config import Settings

settings = Settings()
engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'notificationtype';"))
    for row in result:
        print(row)
