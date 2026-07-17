import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.database import Base, engine, SessionLocal
from app.database.models import User, RoleEnum
from app.core.security import get_password_hash


@pytest.fixture(scope="module")
def test_db():
    Base.metadata.create_all(bind=engine)
    yield SessionLocal()


@pytest.fixture
def client(test_db):
    app.dependency_overrides[get_db] = lambda: test_db
    with TestClient(app) as c:
        yield c


@pytest.fixture
def test_user(test_db):
    user = User(
        full_name="Test User",
        email="test@example.com",
        phone_number="1234567890",
        password_hash=get_password_hash("password123"),
        role=RoleEnum.CITIZEN
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


class TestAuthRoutes:
    def test_register_user(self, client):
        response = client.post("/api/auth/register", json={
            "full_name": "New User",
            "email": "newuser@example.com",
            "phone_number": "0987654321",
            "password": "password123"
        })
        assert response.status_code == 200
        assert response.json()["message"] == "User registered successfully"

    def test_login_user(self, client, test_user):
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == "test@example.com"

    def test_login_invalid_password(self, client, test_user):
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    def test_forgot_password(self, client, test_user):
        response = client.post("/api/auth/forgot-password", json={
            "email": "test@example.com"
        })
        assert response.status_code == 200
        assert "reset_token" in response.json()


class TestComplaintRoutes:
    def test_create_complaint(self, client, test_user):
        token = "test-token"
        response = client.post("/api/complaints", json={
            "title": "Broken Street Light",
            "description": "There is a broken street light at the main intersection",
            "location": "Main Street & 1st Ave",
            "latitude": "40.7128",
            "longitude": "-74.0060",
            "department": "STREETLIGHT",
            "priority": "HIGH"
        }, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code in [200, 201]

    def test_get_my_complaints(self, client, test_user):
        response = client.get("/api/complaints/my", headers={
            "Authorization": "Bearer test-token"
        })
        assert response.status_code in [200, 401]


class TestGamificationRoutes:
    def test_get_badges(self, client):
        response = client.get("/api/gamification/badges")
        assert response.status_code == 200
        badges = response.json()
        assert isinstance(badges, list)
        assert len(badges) > 0

    def test_get_leaderboard(self, client):
        response = client.get("/api/gamification/leaderboard?limit=5")
        assert response.status_code == 200
        leaderboard = response.json()
        assert isinstance(leaderboard, list)