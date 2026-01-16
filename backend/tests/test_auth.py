"""Authentication tests."""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient

from conftest import assert_response_success, assert_response_error, assert_valid_uuid


class TestAuthEndpoints:
    """Test authentication endpoints."""

    def test_register_success(self, client: TestClient):
        """Test successful user registration."""
        user_data = {
            "email": "newuser@example.com",
            "password": "NewPassword123!",
            "full_name": "New User",
            "organization": "New Org"
        }
        
        response = client.post("/api/auth/register/", json=user_data)
        assert_response_success(response, 201)
        
        data = response.json()
        assert data["user"]["email"] == user_data["email"]
        assert data["user"]["full_name"] == user_data["full_name"]
        assert data["user"]["organization"] == user_data["organization"]
        assert "access_token" in data
        assert "refresh_token" in data
        assert assert_valid_uuid(data["user"]["id"])

    def test_register_invalid_email(self, client: TestClient):
        """Test registration with invalid email."""
        user_data = {
            "email": "invalid-email",
            "password": "Password123!",
            "full_name": "Test User"
        }
        
        response = client.post("/api/auth/register/", json=user_data)
        assert_response_error(response, 422)

    def test_register_weak_password(self, client: TestClient):
        """Test registration with weak password."""
        user_data = {
            "email": "test@example.com",
            "password": "weak",
            "full_name": "Test User"
        }
        
        response = client.post("/api/auth/register/", json=user_data)
        assert_response_error(response, 400)

    def test_register_duplicate_email(self, client: TestClient, test_user):
        """Test registration with existing email."""
        user_data = {
            "email": test_user.email,
            "password": "Password123!",
            "full_name": "Test User"
        }
        
        response = client.post("/api/auth/register/", json=user_data)
        assert_response_error(response, 400)

    def test_login_success(self, client: TestClient, test_user):
        """Test successful login."""
        login_data = {
            "email": test_user.email,
            "password": "TestPassword123!"
        }
        
        response = client.post("/api/auth/login/", json=login_data)
        assert_response_success(response)
        
        data = response.json()
        assert data["user"]["email"] == test_user.email
        assert "access_token" in data
        assert "refresh_token" in data

    def test_login_invalid_credentials(self, client: TestClient):
        """Test login with invalid credentials."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        response = client.post("/api/auth/login/", json=login_data)
        assert_response_error(response, 401)

    def test_get_me_authenticated(self, client: TestClient, auth_headers):
        """Test getting current user info when authenticated."""
        response = client.get("/api/auth/me/", headers=auth_headers)
        assert_response_success(response)
        
        data = response.json()
        assert "email" in data
        assert "full_name" in data
        assert "id" in data

    def test_get_me_unauthenticated(self, client: TestClient):
        """Test getting current user info when not authenticated."""
        response = client.get("/api/auth/me/")
        assert_response_error(response, 401)

    def test_get_me_invalid_token(self, client: TestClient):
        """Test getting current user info with invalid token."""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/api/auth/me/", headers=headers)
        assert_response_error(response, 401)


@pytest.mark.asyncio
class TestAuthService:
    """Test authentication service."""

    async def test_password_hashing(self):
        """Test password hashing and verification."""
        from services.auth_service import AuthService
        
        auth_service = AuthService()
        password = "TestPassword123!"
        
        # Test hashing
        hashed = auth_service.hash_password(password)
        assert hashed != password
        assert len(hashed) > 50  # bcrypt hashes are long
        
        # Test verification
        assert auth_service.verify_password(password, hashed)
        assert not auth_service.verify_password("wrongpassword", hashed)

    async def test_jwt_token_creation_and_validation(self, test_user):
        """Test JWT token creation and validation."""
        from services.auth_service import AuthService
        
        auth_service = AuthService()
        
        # Create token
        token_data = await auth_service.create_access_token(test_user)
        assert "access_token" in token_data
        assert "token_type" in token_data
        
        # Validate token
        payload = auth_service.decode_token(token_data["access_token"])
        assert payload["user_id"] == test_user.id
        assert payload["email"] == test_user.email

    async def test_invalid_jwt_token(self):
        """Test validation of invalid JWT token."""
        from services.auth_service import AuthService
        from fastapi import HTTPException
        
        auth_service = AuthService()
        
        with pytest.raises(HTTPException):
            auth_service.decode_token("invalid.jwt.token")

    async def test_expired_jwt_token(self, test_user):
        """Test validation of expired JWT token."""
        from services.auth_service import AuthService
        from fastapi import HTTPException
        from config import settings
        
        auth_service = AuthService()
        
        # Create token with very short expiration
        original_expire = settings.access_token_expire_minutes
        settings.access_token_expire_minutes = -1  # Already expired
        
        token_data = await auth_service.create_access_token(test_user)
        
        # Reset original expiration
        settings.access_token_expire_minutes = original_expire
        
        with pytest.raises(HTTPException):
            auth_service.decode_token(token_data["access_token"])


class TestUserValidation:
    """Test user input validation."""

    def test_email_validation(self):
        """Test email validation."""
        from utils.validation import validate_email
        
        # Valid emails
        assert validate_email("test@example.com")
        assert validate_email("user.name+tag@domain.co.uk")
        
        # Invalid emails
        assert not validate_email("invalid-email")
        assert not validate_email("@domain.com")
        assert not validate_email("user@")
        assert not validate_email("")

    def test_password_strength_validation(self):
        """Test password strength validation."""
        from utils.validation import validate_password_strength
        
        # Strong password
        result = validate_password_strength("StrongPassword123!")
        assert result["is_valid"]
        assert len(result["errors"]) == 0
        
        # Weak passwords
        weak_passwords = [
            "short",
            "nouppercase123!",
            "NOLOWERCASE123!",
            "NoDigits!",
            "NoSpecialChars123",
            "password123!"  # Common password
        ]
        
        for password in weak_passwords:
            result = validate_password_strength(password)
            assert not result["is_valid"]
            assert len(result["errors"]) > 0

    def test_user_input_sanitization(self):
        """Test user input sanitization."""
        from utils.validation import validate_user_input
        
        # Test HTML sanitization
        input_data = {
            "name": "<script>alert('xss')</script>John Doe",
            "description": "Normal text with <b>bold</b> and <script>bad</script>",
            "email": "  test@example.com  "
        }
        
        sanitized = validate_user_input(input_data)
        
        assert "<script>" not in sanitized["name"]
        assert sanitized["name"] == "John Doe"
        assert "<b>bold</b>" in sanitized["description"]  # Allowed tag
        assert "<script>" not in sanitized["description"]  # Blocked tag
        assert sanitized["email"] == "test@example.com"  # Trimmed
