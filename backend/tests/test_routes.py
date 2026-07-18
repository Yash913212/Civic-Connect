import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.database import get_db
from app.database.models import User, RoleEnum
from app.core.security import get_password_hash, create_access_token


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    user = User(
        full_name="Test User",
        email="test@example.com",
        phone_number="1234567890",
        password_hash=get_password_hash("password123"),
        role=RoleEnum.CITIZEN
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
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
        token = create_access_token(subject=str(test_user.id))
        response = client.post("/api/complaints", json={
            "title": "Broken Street Light",
            "description": "There is a broken street light at the main intersection",
            "location": "Main Street & 1st Ave",
            "latitude": "40.7128",
            "longitude": "-74.0060",
            "department": "Streetlight",
            "priority": "High"
        }, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code in [200, 201]

    def test_get_my_complaints(self, client, test_user, db_session):
        from app.database.models import Complaint, ComplaintStatus
        complaint = Complaint(
            title="Broken Street Light",
            description="There is a broken street light at the main intersection",
            location="Main Street & 1st Ave",
            user_id=test_user.id,
            status=ComplaintStatus.PENDING.value
        )
        db_session.add(complaint)
        db_session.commit()

        token = create_access_token(subject=str(test_user.id))
        response = client.get("/api/complaints/my", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["title"] == "Broken Street Light"


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

    def test_get_gamification_profile(self, client, test_user):
        token = create_access_token(subject=str(test_user.id))
        response = client.get("/api/gamification/profile", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "points" in data
        assert "level" in data
        assert "badges" in data

    def test_get_gamification_profile_unauthenticated(self, client):
        response = client.get("/api/gamification/profile")
        assert response.status_code == 401