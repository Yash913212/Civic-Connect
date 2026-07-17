import os
import sys
import uuid
from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine
from app.database.models import User, Base
from app.core.security import get_password_hash

def seed_gamification_data():
    db = SessionLocal()
    try:
        # Create fake citizens
        fake_citizens = [
            {
                "full_name": "Aarav Sharma",
                "email": "aarav@example.com",
                "points": 3450,
                "level": 10,
                "badges": "first_complaint,complaint_warrior,civic_champion,city_guardian,verified_reporter",
                "streak_days": 12
            },
            {
                "full_name": "Priya Patel",
                "email": "priya@example.com",
                "points": 2800,
                "level": 9,
                "badges": "first_complaint,complaint_warrior,civic_champion,streak_master",
                "streak_days": 5
            },
            {
                "full_name": "Rahul Verma",
                "email": "rahul@example.com",
                "points": 1950,
                "level": 8,
                "badges": "first_complaint,complaint_warrior,department_expert",
                "streak_days": 2
            },
            {
                "full_name": "Ananya Singh",
                "email": "ananya@example.com",
                "points": 1200,
                "level": 7,
                "badges": "first_complaint,complaint_warrior",
                "streak_days": 1
            },
            {
                "full_name": "Vikram Gupta",
                "email": "vikram@example.com",
                "points": 650,
                "level": 5,
                "badges": "first_complaint,priority_hunter",
                "streak_days": 8
            }
        ]

        for citizen_data in fake_citizens:
            # Check if exists
            existing = db.query(User).filter(User.email == citizen_data["email"]).first()
            if existing:
                existing.points = citizen_data["points"]
                existing.level = citizen_data["level"]
                existing.badges = citizen_data["badges"]
                existing.streak_days = citizen_data["streak_days"]
                print(f"Updated {citizen_data['full_name']}")
            else:
                new_user = User(
                    id=str(uuid.uuid4()),
                    email=citizen_data["email"],
                    phone_number=f"555{str(uuid.uuid4().int)[:7]}",
                    password_hash=get_password_hash("password123"),
                    full_name=citizen_data["full_name"],
                    role="CITIZEN",
                    points=citizen_data["points"],
                    level=citizen_data["level"],
                    badges=citizen_data["badges"],
                    streak_days=citizen_data["streak_days"],
                    is_active=True
                )
                db.add(new_user)
                print(f"Created {citizen_data['full_name']}")
        
        # Give current user some points if they have 0
        me = db.query(User).filter(User.email == "yash@civicai.org").first()
        if me and me.points == 0:
            me.points = 420
            me.level = 4
            me.badges = "first_complaint,complaint_warrior,streak_master"
            me.streak_days = 3
            print(f"Updated your user (yash@civicai.org) with sample points!")

        db.commit()
        print("Successfully seeded gamification data!")

    except Exception as e:
        import traceback
        print(f"Error seeding database:")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_gamification_data()
