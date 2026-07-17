import os
import sys
import uuid
from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine, Base
from app.database.models import User, Badge, UserBadge
from app.core.security import get_password_hash
from app.core.gamification import BADGES


def seed_badges_table():
    db = SessionLocal()
    try:
        for badge_id, badge_info in BADGES.items():
            existing = db.query(Badge).filter(Badge.id == badge_id).first()
            if not existing:
                db.add(Badge(
                    id=badge_id,
                    name=badge_info["name"],
                    description=badge_info["description"],
                    icon=badge_info.get("icon"),
                    points=badge_info["points"]
                ))
        db.commit()
        print("Badges table seeded")
    finally:
        db.close()


def seed_gamification_data():
    db = SessionLocal()
    try:
        seed_badges_table()
        
        fake_citizens = [
            {
                "full_name": "Aarav Sharma",
                "email": "aarav@example.com",
                "points": 3450,
                "level": 10,
                "badge_ids": ["first_complaint", "complaint_warrior", "civic_champion", "city_guardian", "verified_reporter"],
                "streak_days": 12
            },
            {
                "full_name": "Priya Patel",
                "email": "priya@example.com",
                "points": 2800,
                "level": 9,
                "badge_ids": ["first_complaint", "complaint_warrior", "civic_champion", "streak_master"],
                "streak_days": 5
            },
            {
                "full_name": "Rahul Verma",
                "email": "rahul@example.com",
                "points": 1950,
                "level": 8,
                "badge_ids": ["first_complaint", "complaint_warrior", "department_expert"],
                "streak_days": 2
            },
            {
                "full_name": "Ananya Singh",
                "email": "ananya@example.com",
                "points": 1200,
                "level": 7,
                "badge_ids": ["first_complaint", "complaint_warrior"],
                "streak_days": 1
            },
            {
                "full_name": "Vikram Gupta",
                "email": "vikram@example.com",
                "points": 650,
                "level": 5,
                "badge_ids": ["first_complaint", "priority_hunter"],
                "streak_days": 8
            }
        ]

        for citizen_data in fake_citizens:
            existing = db.query(User).filter(User.email == citizen_data["email"]).first()
            if existing:
                existing.points = citizen_data["points"]
                existing.level = citizen_data["level"]
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
                    streak_days=citizen_data["streak_days"],
                    is_active=True
                )
                db.add(new_user)
                db.flush()
                
                for badge_id in citizen_data["badge_ids"]:
                    db.add(UserBadge(user_id=new_user.id, badge_id=badge_id))
                
                print(f"Created {citizen_data['full_name']}")
        
        me = db.query(User).filter(User.email == "yash@civicai.org").first()
        if me and me.points == 0:
            me.points = 420
            me.level = 4
            me.streak_days = 3
            for badge_id in ["first_complaint", "complaint_warrior", "streak_master"]:
                db.add(UserBadge(user_id=me.id, badge_id=badge_id))
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
