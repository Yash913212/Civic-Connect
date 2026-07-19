from app.database.database import SessionLocal, engine, Base
from app.database.models import User, RoleEnum
from app.core.security import get_password_hash

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("Seeding database...")
            admin = User(
                full_name="System Admin",
                email="admin@civicconnect.com",
                phone_number="1234567890",
                password_hash=get_password_hash("Admin@123"),
                role=RoleEnum.ADMIN
            )
            officer = User(
                full_name="Default Officer",
                email="officer@civicconnect.com",
                phone_number="0987654321",
                password_hash=get_password_hash("Officer@123"),
                role=RoleEnum.OFFICER
            )
            db.add_all([admin, officer])
            db.commit()
            print("Database seeded successfully.")
        else:
            print("Database already contains data. Skipping seeding.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
