from app.database.database import SessionLocal, engine, Base
from app.database.models import User, RoleEnum
from app.core.security import get_password_hash
def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        admin = db.query(User).filter(
            User.email == "admin@civicconnect.com"
        ).first()

        if not admin:
            admin = User(
                full_name="System Admin",
                email="admin@civicconnect.com",
                phone_number="1234567890",
                password_hash=get_password_hash("Admin@123"),
                role=RoleEnum.ADMIN
            )
            db.add(admin)
            print("Admin created.")

        officer = db.query(User).filter(
            User.email == "officer@civicconnect.com"
        ).first()

        if not officer:
            officer = User(
                full_name="Default Officer",
                email="officer@civicconnect.com",
                phone_number="0987654321",
                password_hash=get_password_hash("Officer@123"),
                role=RoleEnum.OFFICER
            )
            db.add(officer)
            print("Officer created.")

        db.commit()
        print("Database seeding completed.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
if __name__ == "__main__":
    seed_db()