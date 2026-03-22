"""Test configuration and shared fixtures.

This module provides the database-mocked fixtures used by test_e2e_full.py and
any other test modules in this suite.  A real database connection is NOT required.
"""

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock


# ---------------------------------------------------------------------------
# Event loop – session-scoped so all async tests share one loop
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def event_loop():
    """Single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ---------------------------------------------------------------------------
# Mock asyncpg connection / pool
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def mock_conn():
    """Reusable asyncpg connection mock."""
    conn = AsyncMock()
    conn.fetchrow = AsyncMock(return_value=None)
    conn.fetch = AsyncMock(return_value=[])
    conn.execute = AsyncMock(return_value="OK")
    conn.fetchval = AsyncMock(return_value=1)
    conn.__aenter__ = AsyncMock(return_value=conn)
    conn.__aexit__ = AsyncMock(return_value=None)
    return conn


@pytest.fixture(scope="session")
def mock_pool(mock_conn):
    """Reusable asyncpg pool mock."""
    pool = MagicMock()
    pool.acquire = MagicMock(return_value=mock_conn)
    pool.close = AsyncMock()
    return pool


# ---------------------------------------------------------------------------
# Lightweight data helpers kept for backward-compat with any old tests
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_project_data():
    return {
        "name": "Sample Project",
        "description": "A sample project for testing",
        "template_type": "web_app",
        "brief_text": "This is a brief description of the project",
    }


@pytest.fixture
def sample_requirement_data():
    return {
        "title": "User Authentication",
        "description": "Users should be able to login and logout securely",
        "type": "functional",
        "priority": "high",
        "confidence_score": 0.9,
    }


@pytest.fixture
def sample_task_data():
    return {
        "title": "Implement login endpoint",
        "description": "Create FastAPI endpoint for user login",
        "priority": "high",
        "estimated_hours": 4.0,
    }


@pytest.fixture
def mock_llm_response():
    return {
        "requirements": [
            {
                "type": "functional",
                "title": "User Registration",
                "description": "Users can create accounts",
                "priority": "high",
                "confidence_score": 0.8,
            },
            {
                "type": "non_functional",
                "title": "System Performance",
                "description": "System should respond within 2 seconds",
                "priority": "medium",
                "confidence_score": 0.7,
            },
        ]
    }


# ---------------------------------------------------------------------------
# Assertion helpers
# ---------------------------------------------------------------------------

def assert_response_success(response, expected_status=200):
    assert response.status_code == expected_status


def assert_response_error(response, expected_status=400):
    assert response.status_code == expected_status
    data = response.json()
    assert "detail" in data or "error" in data


def assert_valid_timestamp(timestamp_str: str):
    from datetime import datetime
    try:
        datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


def assert_valid_uuid(uuid_str: str):
    import uuid
    try:
        uuid.UUID(uuid_str)
        return True
    except ValueError:
        return False
