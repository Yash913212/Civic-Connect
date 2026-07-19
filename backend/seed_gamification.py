import os
import sys
import uuid
from sqlalchemy.orm import Session
from app.database.database import SessionLocal, engine, Base
from app.database.models import User, Badge, UserBadge, RoleEnum
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
                if not existing.phone_number:
                    existing.phone_number = f"555{str(uuid.uuid4().int)[:7]}"
                print(f"Updated {citizen_data['full_name']}")
            else:
                new_user = User(
                    id=uuid.uuid4(),
                    email=citizen_data["email"],
                    phone_number=f"555{str(uuid.uuid4().int)[:7]}",
                    password_hash=get_password_hash("password123"),
                    full_name=citizen_data["full_name"],
                    role=RoleEnum.CITIZEN,
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

        fake_officers = [
            {
                "full_name": "Officer Sarah",
                "email": "sarah.officer@civicconnect.com",
                "points": 4250,
                "level": 10,
                "streak_days": 15
            },
            {
                "full_name": "Officer Marcus",
                "email": "marcus.officer@civicconnect.com",
                "points": 3890,
                "level": 9,
                "streak_days": 8
            },
            {
                "full_name": "Officer David",
                "email": "david.officer@civicconnect.com",
                "points": 3100,
                "level": 7,
                "streak_days": 3
            }
        ]

        for officer_data in fake_officers:
            existing = db.query(User).filter(User.email == officer_data["email"]).first()
            if existing:
                existing.points = officer_data["points"]
                existing.level = officer_data["level"]
                existing.streak_days = officer_data["streak_days"]
                print(f"Updated {officer_data['full_name']}")
            else:
                new_officer = User(
                    id=uuid.uuid4(),
                    email=officer_data["email"],
                    phone_number=f"555{str(uuid.uuid4().int)[:7]}",
                    password_hash=get_password_hash("password123"),
                    full_name=officer_data["full_name"],
                    role=RoleEnum.OFFICER,
                    points=officer_data["points"],
                    level=officer_data["level"],
                    streak_days=officer_data["streak_days"],
                    is_active=True
                )
                db.add(new_officer)
                print(f"Created {officer_data['full_name']}")

        default_off = db.query(User).filter(User.email == "officer@civicconnect.com").first()
        if default_off:
            default_off.points = 3450
            default_off.level = 8
            default_off.streak_days = 4
            print("Updated default officer with sample points!")
        
        for email in ["yash@civicai.org", "yaswanthamjuri@gmail.com"]:
            me = db.query(User).filter(User.email == email).first()
            if me and me.points == 0:
                me.points = 1420
                me.level = 8
                me.streak_days = 4
                for badge_id in ["first_complaint", "complaint_warrior", "streak_master"]:
                    badge_exists = db.query(UserBadge).filter(UserBadge.user_id == me.id, UserBadge.badge_id == badge_id).first()
                    if not badge_exists:
                        db.add(UserBadge(user_id=me.id, badge_id=badge_id))
                print(f"Updated user ({email}) with sample points!")

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
