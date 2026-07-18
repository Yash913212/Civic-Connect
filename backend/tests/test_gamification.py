import pytest
from datetime import datetime, timezone, timedelta
from app.core.gamification import (
    calculate_level,
    get_points_to_next_level,
    award_points,
    check_badge_eligibility,
    LEVEL_THRESHOLDS,
    POINTS,
)
from app.database.models import User, Complaint, ComplaintStatus


class TestLevelCalculation:
    def test_calculate_level_starts_at_1(self):
        assert calculate_level(0) == 1
        assert calculate_level(10) == 1
        assert calculate_level(49) == 1

    def test_calculate_level_increases(self):
        assert calculate_level(50) == 2
        assert calculate_level(149) == 2
        assert calculate_level(150) == 3
        assert calculate_level(299) == 3
        assert calculate_level(300) == 4

    def test_calculate_level_max_level(self):
        assert calculate_level(5000) == 10
        assert calculate_level(10000) == 10


class TestPointsToNextLevel:
    def test_points_to_next_level(self):
        assert get_points_to_next_level(0) == 50
        assert get_points_to_next_level(50) == 100
        assert get_points_to_next_level(100) == 50
        assert get_points_to_next_level(5000) == 0


class TestAwardPoints:
    @pytest.fixture
    def user(self):
        return User(id="test-user-id", full_name="Test User", email="test@test.com", phone_number="1234567890")

    def test_award_points_increases_total(self, user, db_session):
        user.points = 0
        result = award_points(user, "complaint_submitted", db_session)
        assert result["points_added"] == 10
        assert result["total_points"] == 10

    def test_award_points_updates_level(self, user, db_session):
        user.points = 45
        result = award_points(user, "complaint_submitted", db_session)
        assert result["level"] == 2
        assert result["level_up"] == True

    def test_award_points_invalid_action(self, user, db_session):
        user.points = 0
        result = award_points(user, "invalid_action", db_session)
        assert result["points_added"] == 0
        assert result["total_points"] == 0

    def test_award_points_updates_streak(self, user, db_session):
        user.points = 0
        user.streak_days = 5
        user.last_active_date = datetime.now(timezone.utc) - timedelta(days=1)
        result = award_points(user, "complaint_submitted", db_session)
        assert result["streak_days"] == 6


class TestBadgeEligibility:
    @pytest.fixture
    def user(self):
        return User(id="test-user-id", full_name="Test User", email="test@test.com", phone_number="1234567890")

    def test_first_complaint_badge(self, user, db_session):
        complaint = Complaint(
            id="c1",
            title="Test Complaint",
            description="Test description",
            location="Test Location",
            user_id=str(user.id),
            status=ComplaintStatus.PENDING.value
        )
        db_session.add(complaint)
        db_session.commit()
        
        new_badges = check_badge_eligibility(user, db_session)
        badge_ids = [b["id"] for b in new_badges]
        assert "first_complaint" in badge_ids

    def test_no_duplicate_badges(self, user, db_session):
        complaint = Complaint(
            id="c1",
            title="Test Complaint",
            description="Test description",
            location="Test Location",
            user_id=str(user.id),
            status=ComplaintStatus.PENDING.value
        )
        db_session.add(complaint)
        db_session.commit()
        
        first_check = check_badge_eligibility(user, db_session)
        second_check = check_badge_eligibility(user, db_session)
        
        assert len(second_check) == 0