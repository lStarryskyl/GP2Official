"""Test configuration and fixtures."""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from httpx import AsyncClient
import motor.motor_asyncio

from server import app
from database import get_db
from config import settings
from models.user import User
from models.project import Project
from repositories.user_repository import UserRepository
from repositories.project_repository import ProjectRepository
from services.auth_service import AuthService


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_db():
    """Create test database connection."""
    # Use in-memory database for tests
    from database import MemoryClient, init_db
    
    # Override settings for testing
    settings.use_in_memory_db = True
    settings.debug = True
    
    await init_db()
    yield get_db()


@pytest.fixture
def client() -> TestClient:
    """Create test client."""
    return TestClient(app)


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create async test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def test_user(test_db) -> User:
    """Create a test user."""
    user_repo = UserRepository()
    auth_service = AuthService()
    
    user_data = {
        "email": "test@example.com",
        "password": "TestPassword123!",
        "full_name": "Test User",
        "organization": "Test Org"
    }
    
    user = await auth_service.create_user(**user_data)
    return user


@pytest.fixture
async def admin_user(test_db) -> User:
    """Create a test admin user."""
    user_repo = UserRepository()
    auth_service = AuthService()
    
    user_data = {
        "email": "admin@example.com", 
        "password": "AdminPassword123!",
        "full_name": "Admin User",
        "organization": "Test Org",
        "role": "portfolio_admin"
    }
    
    user = await auth_service.create_user(**user_data)
    return user


@pytest.fixture
async def auth_headers(test_user: User) -> dict:
    """Get authentication headers for test user."""
    auth_service = AuthService()
    token_data = await auth_service.create_access_token(test_user)
    return {"Authorization": f"Bearer {token_data['access_token']}"}


@pytest.fixture
async def admin_headers(admin_user: User) -> dict:
    """Get authentication headers for admin user."""
    auth_service = AuthService()
    token_data = await auth_service.create_access_token(admin_user)
    return {"Authorization": f"Bearer {token_data['access_token']}"}


@pytest.fixture
async def test_project(test_user: User, test_db) -> Project:
    """Create a test project."""
    project_repo = ProjectRepository()
    
    project_data = {
        "name": "Test Project",
        "description": "A test project",
        "template_type": "web_app",
        "owner_id": test_user.id,
        "organization": test_user.organization
    }
    
    project = await project_repo.create(project_data)
    return project


@pytest.fixture
def sample_project_data() -> dict:
    """Sample project data for testing."""
    return {
        "name": "Sample Project",
        "description": "A sample project for testing",
        "template_type": "web_app",
        "brief_text": "This is a brief description of the project"
    }


@pytest.fixture
def sample_requirement_data() -> dict:
    """Sample requirement data for testing."""
    return {
        "title": "User Authentication",
        "description": "Users should be able to login and logout securely",
        "type": "functional",
        "priority": "high",
        "confidence_score": 0.9
    }


@pytest.fixture
def sample_task_data() -> dict:
    """Sample task data for testing."""
    return {
        "title": "Implement login endpoint",
        "description": "Create FastAPI endpoint for user login",
        "priority": "high",
        "estimated_hours": 4.0
    }


@pytest.fixture
def mock_llm_response():
    """Mock LLM response for testing."""
    return {
        "requirements": [
            {
                "type": "functional",
                "title": "User Registration",
                "description": "Users can create accounts",
                "priority": "high",
                "confidence_score": 0.8
            },
            {
                "type": "non_functional", 
                "title": "System Performance",
                "description": "System should respond within 2 seconds",
                "priority": "medium",
                "confidence_score": 0.7
            }
        ]
    }


class MockLLMClient:
    """Mock LLM client for testing."""
    
    async def extract_requirements(self, prompt: str):
        return [
            {
                "type": "functional",
                "title": "Mock Requirement",
                "description": f"Generated from: {prompt[:50]}...",
                "priority": "medium",
                "confidence_score": 0.75
            }
        ]
    
    async def generate_srs(self, prompt: str, requirements, detail_level: str):
        return {
            "title": "Mock SRS Document",
            "sections": {"content": "Mock SRS content"},
            "metadata": {"detail_level": detail_level}
        }


@pytest.fixture
def mock_llm_client():
    """Provide mock LLM client."""
    return MockLLMClient()


# Test utilities
def assert_response_success(response, expected_status=200):
    """Assert response is successful."""
    assert response.status_code == expected_status
    assert response.headers["content-type"] == "application/json"


def assert_response_error(response, expected_status=400):
    """Assert response is an error."""
    assert response.status_code == expected_status
    data = response.json()
    assert "detail" in data or "error" in data


def assert_valid_timestamp(timestamp_str: str):
    """Assert timestamp is valid ISO format."""
    from datetime import datetime
    try:
        datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        return True
    except ValueError:
        return False


def assert_valid_uuid(uuid_str: str):
    """Assert string is valid UUID."""
    import uuid
    try:
        uuid.UUID(uuid_str)
        return True
    except ValueError:
        return False
