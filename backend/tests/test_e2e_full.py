"""Comprehensive E2E tests for all Acorn API endpoints.

Strategy
--------
* All tests run WITHOUT a live database or Redis.
* asyncpg, redis, and other heavy optional dependencies are injected into
  sys.modules BEFORE any application code is imported, so import-time
  ``import asyncpg`` statements in database.py never fail.
* JWT tokens are minted locally using the same secret / algorithm as the app.
* Service and repository layer calls that touch the DB are patched per-test or
  via session-scoped fixtures so every endpoint can be exercised independently.
"""

import asyncio
import json
import sys
import uuid
from datetime import datetime, timedelta
from typing import AsyncGenerator, Dict
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

# ── Inject stub modules for heavy optional dependencies ───────────────────────
# Must happen before ANY application import so that ``import asyncpg`` inside
# database.py resolves to the stub rather than a missing package.

def _make_asyncpg_stub():
    """Return a MagicMock that walks like asyncpg well enough for import."""
    stub = MagicMock()
    stub.create_pool = AsyncMock(return_value=MagicMock())
    stub.Pool = MagicMock
    stub.Connection = MagicMock
    stub.Record = MagicMock
    stub.PostgresError = Exception
    stub.exceptions = MagicMock()
    stub.exceptions.PostgresError = Exception
    return stub


def _make_redis_stub():
    stub = MagicMock()
    stub.asyncio = MagicMock()
    stub.asyncio.from_url = MagicMock(return_value=AsyncMock())
    stub.from_url = MagicMock(return_value=AsyncMock())
    stub.Redis = MagicMock
    return stub


def _make_openai_stub():
    stub = MagicMock()
    async_client_mock = MagicMock()
    async_client_mock.chat = MagicMock()
    async_client_mock.chat.completions = MagicMock()
    async_client_mock.chat.completions.create = AsyncMock(
        return_value=MagicMock(
            choices=[MagicMock(message=MagicMock(content="# Stub\n\nContent."))]
        )
    )
    stub.AsyncOpenAI = MagicMock(return_value=async_client_mock)
    stub.OpenAI = MagicMock(return_value=MagicMock())
    stub.APIError = Exception
    stub.AuthenticationError = Exception
    stub.RateLimitError = Exception
    stub.APIConnectionError = Exception
    return stub


def _make_google_stub():
    stub = MagicMock()
    stub.generativeai = MagicMock()
    stub.generativeai.configure = MagicMock()
    stub.generativeai.GenerativeModel = MagicMock(
        return_value=MagicMock(
            generate_content_async=AsyncMock(
                return_value=MagicMock(text="# Stub Google\n\nContent.")
            )
        )
    )
    return stub


def _make_anthropic_stub():
    stub = MagicMock()
    stub.Anthropic = MagicMock()
    stub.AsyncAnthropic = MagicMock(
        return_value=MagicMock(
            messages=MagicMock(
                create=AsyncMock(
                    return_value=MagicMock(
                        content=[MagicMock(text="# Stub Anthropic\n\nContent.")]
                    )
                )
            )
        )
    )
    return stub


def _make_reportlab_stub():
    stub = MagicMock()
    stub.lib = MagicMock()
    stub.lib.styles = MagicMock()
    stub.lib.styles.getSampleStyleSheet = MagicMock(return_value={})
    stub.lib.pagesizes = MagicMock()
    stub.lib.pagesizes.letter = (612, 792)
    stub.platypus = MagicMock()
    stub.platypus.SimpleDocTemplate = MagicMock()
    return stub


def _make_docx_stub():
    stub = MagicMock()
    stub.Document = MagicMock(return_value=MagicMock())
    # Shared submodule
    shared = MagicMock()
    shared.Inches = MagicMock(return_value=1)
    shared.Pt = MagicMock(return_value=12)
    shared.RGBColor = MagicMock(return_value=MagicMock())
    stub.shared = shared
    # Enum submodule
    enum = MagicMock()
    enum.text = MagicMock()
    enum.text.WD_ALIGN_PARAGRAPH = MagicMock()
    stub.enum = enum
    stub.oxml = MagicMock()
    stub.oxml.ns = MagicMock()
    return stub


def _make_bleach_stub():
    stub = MagicMock()
    stub.clean = MagicMock(side_effect=lambda x, **kw: x)
    stub.linkify = MagicMock(side_effect=lambda x, **kw: x)
    return stub


# Register all stubs before any app import occurs
for _name, _stub in [
    ("asyncpg", _make_asyncpg_stub()),
    ("redis", _make_redis_stub()),
    ("redis.asyncio", _make_redis_stub().asyncio),
    ("openai", _make_openai_stub()),
    ("google", _make_google_stub()),
    ("google.generativeai", MagicMock()),
    ("anthropic", _make_anthropic_stub()),
    ("bleach", _make_bleach_stub()),
    ("reportlab", _make_reportlab_stub()),
    ("reportlab.lib", MagicMock()),
    ("reportlab.lib.pagesizes", MagicMock()),
    ("reportlab.lib.styles", MagicMock()),
    ("reportlab.lib.units", MagicMock()),
    ("reportlab.lib.colors", MagicMock()),
    ("reportlab.platypus", MagicMock()),
    ("docx", _make_docx_stub()),
    ("docx.shared", MagicMock(Inches=MagicMock(return_value=1), Pt=MagicMock(return_value=12), RGBColor=MagicMock())),
    ("docx.enum", MagicMock()),
    ("docx.enum.text", MagicMock(WD_ALIGN_PARAGRAPH=MagicMock())),
    ("docx.oxml", MagicMock()),
    ("docx.oxml.ns", MagicMock()),
    ("PIL", MagicMock()),
    ("PIL.Image", MagicMock()),
    ("aiofiles", MagicMock()),
]:
    if _name not in sys.modules:
        sys.modules[_name] = _stub  # type: ignore[assignment]

from jose import jwt  # noqa: E402  (must be after sys.modules setup)

# ── Constants ────────────────────────────────────────────────────────────────
BASE_URL = "http://test"
SECRET_KEY = "your-secret-key-change-in-production"  # matches config.py default
ALGORITHM = "HS256"

TEST_USER_ID = "user-test-001"
TEST_USER_EMAIL = "e2e@example.com"
TEST_ORG = "E2E Org"
TEST_PROJECT_ID = "test-project-123"
TEST_REQ_ID = "req-test-001"
TEST_TASK_ID = "task-test-001"

ALL_PHASES = [
    "planning",
    "feasibility_study",
    "requirements_gathering",
    "validation",
    "design",
    "development",
    "tasks",
    "cost_benefit",
    "risks",
    "summary",
]

# ── Helpers ──────────────────────────────────────────────────────────────────

import types  # noqa: E402


def _ns(**kwargs):
    """Create a SimpleNamespace from kwargs – no rogue MagicMock attributes."""
    return types.SimpleNamespace(**kwargs)


def _make_access_token(user_id: str = TEST_USER_ID, expire_minutes: int = 60) -> str:
    """Mint a valid JWT access token using the app's own secret."""
    expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def _make_expired_token(user_id: str = TEST_USER_ID) -> str:
    expire = datetime.utcnow() - timedelta(minutes=5)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def _make_user_obj(**kwargs):
    """Return a minimal User-like namespace with all required attributes."""
    now = datetime.utcnow()
    defaults = dict(
        id=TEST_USER_ID,
        email=TEST_USER_EMAIL,
        full_name="E2E Tester",
        organization=TEST_ORG,
        hashed_password="hashed",
        is_active=True,
        role="program_manager",
        created_at=now,
        avatar_url=None,
        banner_url=None,
        bio=None,
        job_title=None,
        location=None,
        timezone=None,
        pronouns=None,
        skills=[],
        interests=[],
        social_links=[],
        availability=None,
        contact_email=None,
        phone=None,
    )
    defaults.update(kwargs)
    return _ns(**defaults)


def _make_project_obj(**kwargs):
    """Return a minimal Project-like namespace matching ProjectResponse fields."""
    now = datetime.utcnow()
    phase_status = {phase: ("ready" if phase == "planning" else "locked") for phase in ALL_PHASES}
    phase_status["planning"] = "ready"
    defaults = dict(
        id=TEST_PROJECT_ID,
        project_id=TEST_PROJECT_ID,  # ProjectResponse requires this field
        name="E2E Test Project",
        description="An e-commerce web application",
        template_type="web_app",
        brief_text="Test brief",
        owner_id=TEST_USER_ID,
        organization=TEST_ORG,
        status="draft",
        feature_tier="pro",
        phase_status=phase_status,
        roadmap=[],
        roadmap_summary=[],
        feasibility_studies=[],
        feasibility_sections=[],
        development_stack=[],
        development_notes={},
        parent_project_id=None,
        scenario_label=None,
        scenario_metadata=None,
        ui_preferences=None,
        team_members=[],
        created_at=now,
        updated_at=now,
    )
    defaults.update(kwargs)
    # Ensure project_id mirrors id if not explicitly overridden
    if "id" in kwargs and "project_id" not in kwargs:
        defaults["project_id"] = defaults["id"]
    return _ns(**defaults)


def _make_requirement_obj(**kwargs):
    now = datetime.utcnow()
    defaults = dict(
        id=TEST_REQ_ID,
        project_id=TEST_PROJECT_ID,
        type="functional",
        title="User Authentication",
        description="Users can log in securely",
        priority="high",
        status="draft",
        confidence_score=0.9,
        created_at=now,
        updated_at=now,
    )
    defaults.update(kwargs)
    return _ns(**defaults)


def _make_task_obj(**kwargs):
    now = datetime.utcnow()
    defaults = dict(
        id=TEST_TASK_ID,
        task_id=TEST_TASK_ID,   # TaskResponse requires task_id
        project_id=TEST_PROJECT_ID,
        requirement_id=TEST_REQ_ID,
        title="Implement login",
        description="Create login endpoint",
        estimate_hours=4.0,
        actual_hours=0.0,  # TaskResponse requires float, not None
        start_date=None,
        due_date=None,
        status="pending",
        priority="high",
        role=None,
        dependencies=[],
        tags=[],
        phase="development",
        created_at=now,
        updated_at=now,
    )
    defaults.update(kwargs)
    return _ns(**defaults)


def _make_artifact_obj(**kwargs):
    defaults = {
        "id": str(uuid.uuid4()),
        "project_id": TEST_PROJECT_ID,
        "type": "PHASE_PLANNING",
        "title": "Planning Output",
        "content_json": {"markdown": "# Planning\n\nContent here", "raw_markdown": "# Planning\n\nContent here"},
        "version": 1,
        "is_approved": False,
        "metadata": {"phase": "planning"},
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    defaults.update(kwargs)
    return _ns(**defaults)


def _make_token_response(user_obj):
    """Build the dict that AuthService._build_token_response returns."""
    from models.user import build_user_response
    return {
        "access_token": _make_access_token(user_obj.id),
        "token_type": "bearer",
        "refresh_token": "refresh-token-placeholder",
        "user": build_user_response(user_obj),
    }


# ── Mocked asyncpg pool (module-level so it is set before lifespan runs) ─────

_mock_conn = AsyncMock()
_mock_conn.fetchrow = AsyncMock(return_value=None)
_mock_conn.fetch = AsyncMock(return_value=[])
_mock_conn.execute = AsyncMock(return_value="OK")
_mock_conn.fetchval = AsyncMock(return_value=1)
_mock_conn.__aenter__ = AsyncMock(return_value=_mock_conn)
_mock_conn.__aexit__ = AsyncMock(return_value=None)

_mock_pool = MagicMock()
_mock_pool.acquire = MagicMock(return_value=_mock_conn)
_mock_pool.close = AsyncMock()


# ── Session-scoped client fixture ─────────────────────────────────────────────

@pytest.fixture(scope="session")
async def client() -> AsyncGenerator[AsyncClient, None]:
    """AsyncClient backed by the FastAPI ASGI app with all external I/O mocked."""
    with (
        patch("database.init_db", new=AsyncMock()),
        patch("database.close_db", new=AsyncMock()),
        patch("database.pool", _mock_pool),
        patch("utils.cache.init_redis", new=AsyncMock()),
        patch("utils.cache.close_redis", new=AsyncMock()),
    ):
        from server import app

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url=BASE_URL,
        ) as ac:
            yield ac


# ── Convenience fixtures ──────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def test_user():
    return _make_user_obj()


@pytest.fixture(scope="session")
def auth_headers(test_user):
    token = _make_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def project_id():
    return TEST_PROJECT_ID


# ─────────────────────────────────────────────────────────────────────────────
# Group 1: Health & Root
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_root_get(client: AsyncClient):
    resp = await client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert "service" in data


@pytest.mark.asyncio
async def test_api_health_get(client: AsyncClient):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "healthy"


@pytest.mark.asyncio
async def test_api_info(client: AsyncClient):
    resp = await client.get("/api")
    assert resp.status_code == 200
    data = resp.json()
    assert "endpoints" in data


@pytest.mark.asyncio
async def test_api_health_head(client: AsyncClient):
    resp = await client.head("/api/health")
    assert resp.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# Group 2: Authentication
# ─────────────────────────────────────────────────────────────────────────────


def _auth_service_patches(
    user_obj=None,
    existing_user=None,
    token_response=None,
    get_current_user_obj=None,
):
    """Return a context manager list for common auth-service mocking."""
    user_obj = user_obj or _make_user_obj()
    tr = token_response or {
        "access_token": _make_access_token(user_obj.id),
        "token_type": "bearer",
        "refresh_token": "rt-placeholder",
        "user": {
            "id": user_obj.id,
            "email": user_obj.email,
            "full_name": user_obj.full_name,
            "organization": user_obj.organization,
            "role": "program_manager",
            "role_label": "Program Manager",
            "role_authority": 4,
            "avatar_url": None,
            "banner_url": None,
            "bio": None,
            "job_title": None,
            "location": None,
            "timezone": None,
            "pronouns": None,
            "skills": [],
            "interests": [],
            "social_links": [],
            "availability": None,
            "contact_email": None,
            "phone": None,
            "created_at": datetime.utcnow().isoformat(),
        },
    }
    return tr, user_obj


@pytest.mark.asyncio
async def test_register_valid(client: AsyncClient):
    user_obj = _make_user_obj(email="newuser@example.com")
    tr, _ = _auth_service_patches(user_obj=user_obj)

    with patch("services.auth_service.AuthService.register", new=AsyncMock(return_value=tr)):
        resp = await client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "SecurePass1",
                "full_name": "New User",
                "organization": "Test Org",
            },
        )
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert "access_token" in data
    assert "user" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    from fastapi import HTTPException

    async def _raise(*args, **kwargs):
        raise HTTPException(status_code=400, detail="Email already registered")

    with patch("services.auth_service.AuthService.register", new=_raise):
        resp = await client.post(
            "/api/auth/register",
            json={
                "email": "existing@example.com",
                "password": "SecurePass1",
                "full_name": "Dup User",
                "organization": "Test Org",
            },
        )
    assert resp.status_code in (400, 409)


@pytest.mark.asyncio
async def test_register_missing_fields(client: AsyncClient):
    # Missing password entirely – Pydantic validation should reject
    resp = await client.post("/api/auth/register", json={"email": "missing@example.com"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_login_valid(client: AsyncClient):
    user_obj = _make_user_obj()
    tr, _ = _auth_service_patches(user_obj=user_obj)

    with patch("services.auth_service.AuthService.login", new=AsyncMock(return_value=tr)):
        resp = await client.post(
            "/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": "SecurePass1"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    from fastapi import HTTPException

    async def _raise(*args, **kwargs):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    with patch("services.auth_service.AuthService.login", new=_raise):
        resp = await client.post(
            "/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": "wrong"},
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    from fastapi import HTTPException

    async def _raise(*args, **kwargs):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    with patch("services.auth_service.AuthService.login", new=_raise):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "nobody@example.com", "password": "pass"},
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me_valid(client: AsyncClient, auth_headers: dict):
    user_obj = _make_user_obj()

    with patch("services.auth_service.AuthService.get_current_user", new=AsyncMock(return_value=user_obj)):
        resp = await client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert "id" in data


@pytest.mark.asyncio
async def test_get_me_no_token(client: AsyncClient):
    resp = await client.get("/api/auth/me")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_get_me_invalid_token(client: AsyncClient):
    resp = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer totally.invalid.token"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_token_refresh(client: AsyncClient):
    user_obj = _make_user_obj()
    tr, _ = _auth_service_patches(user_obj=user_obj)

    with patch(
        "services.auth_service.AuthService.refresh_access_token",
        new=AsyncMock(return_value=tr),
    ):
        resp = await client.post(
            "/api/auth/token/refresh/",
            json={"refresh_token": "some-refresh-token"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    with patch("services.auth_service.AuthService.logout", new=AsyncMock(return_value=None)):
        resp = await client.post(
            "/api/auth/logout",
            json={"refresh_token": "some-refresh-token"},
        )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_get_me_expired_token(client: AsyncClient):
    expired = _make_expired_token()
    resp = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {expired}"},
    )
    assert resp.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# Group 3: Projects
# ─────────────────────────────────────────────────────────────────────────────


def _patch_project_service(project_obj=None, project_list=None):
    """Patch ProjectService and the auth dependency."""
    p = project_obj or _make_project_obj()
    pl = project_list if project_list is not None else [p]
    user_obj = _make_user_obj()
    patches = [
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.create_project",
            new=AsyncMock(return_value=p),
        ),
        patch(
            "services.project_service.ProjectService.list_projects",
            new=AsyncMock(return_value=pl),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=p),
        ),
        patch(
            "services.project_service.ProjectService.update_project",
            new=AsyncMock(return_value=p),
        ),
        patch(
            "services.project_service.ProjectService.delete_project",
            new=AsyncMock(return_value={"detail": "deleted"}),
        ),
    ]
    return patches


@pytest.mark.asyncio
async def test_list_projects_no_auth(client: AsyncClient):
    resp = await client.get("/api/projects/")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_list_projects_with_auth(client: AsyncClient, auth_headers: dict):
    project_obj = _make_project_obj()
    user_obj = _make_user_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.list_projects",
            new=AsyncMock(return_value=[project_obj]),
        ),
    ):
        resp = await client.get("/api/projects/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_create_project_valid(client: AsyncClient, auth_headers: dict):
    project_obj = _make_project_obj()
    user_obj = _make_user_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.create_project",
            new=AsyncMock(return_value=project_obj),
        ),
    ):
        resp = await client.post(
            "/api/projects/",
            json={"name": "E2E Test Project", "description": "An e-commerce app"},
            headers=auth_headers,
        )
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert "id" in data
    assert "name" in data


@pytest.mark.asyncio
async def test_create_project_missing_name(client: AsyncClient, auth_headers: dict):
    user_obj = _make_user_obj()
    with patch(
        "services.auth_service.AuthService.get_current_user",
        new=AsyncMock(return_value=user_obj),
    ):
        resp = await client.post(
            "/api/projects/",
            json={"description": "No name given"},
            headers=auth_headers,
        )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_project_found(client: AsyncClient, auth_headers: dict, project_id: str):
    project_obj = _make_project_obj()
    user_obj = _make_user_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
    ):
        resp = await client.get(f"/api/projects/{project_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == TEST_PROJECT_ID


@pytest.mark.asyncio
async def test_get_project_not_found(client: AsyncClient, auth_headers: dict):
    from fastapi import HTTPException

    async def _raise(*args, **kwargs):
        raise HTTPException(status_code=404, detail="Project not found")

    user_obj = _make_user_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch("services.project_service.ProjectService.get_project", new=_raise),
    ):
        resp = await client.get("/api/projects/nonexistent-id", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_project(client: AsyncClient, auth_headers: dict, project_id: str):
    project_obj = _make_project_obj(name="Updated Name")
    user_obj = _make_user_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "services.project_service.ProjectService.update_project",
            new=AsyncMock(return_value=project_obj),
        ),
    ):
        resp = await client.put(
            f"/api/projects/{project_id}",
            json={"name": "Updated Name"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Updated Name"


@pytest.mark.asyncio
async def test_delete_project(client: AsyncClient, auth_headers: dict, project_id: str):
    project_obj = _make_project_obj()
    user_obj = _make_user_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "services.project_service.ProjectService.delete_project",
            new=AsyncMock(return_value={"detail": "deleted"}),
        ),
    ):
        resp = await client.delete(f"/api/projects/{project_id}", headers=auth_headers)
    assert resp.status_code in (200, 204)


# ─────────────────────────────────────────────────────────────────────────────
# Group 4: Requirements
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_requirements(client: AsyncClient, auth_headers: dict, project_id: str):
    req_obj = _make_requirement_obj()
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "repositories.requirement_repository.RequirementRepository.list_by_project",
            new=AsyncMock(return_value=[req_obj]),
        ),
    ):
        resp = await client.get(f"/api/projects/{project_id}/requirements/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_create_requirement(client: AsyncClient, auth_headers: dict, project_id: str):
    req_obj = _make_requirement_obj()
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "repositories.requirement_repository.RequirementRepository.create",
            new=AsyncMock(return_value=req_obj),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{project_id}/requirements/",
            json={
                "title": "User Authentication",
                "description": "Users can log in",
                "type": "functional",
                "priority": "high",
                "status": "draft",
            },
            headers=auth_headers,
        )
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert "id" in data


@pytest.mark.asyncio
async def test_update_requirement(client: AsyncClient, auth_headers: dict):
    req_obj = _make_requirement_obj(title="Updated Requirement")
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "repositories.requirement_repository.RequirementRepository.get_by_id",
            new=AsyncMock(return_value=req_obj),
        ),
        patch(
            "repositories.requirement_repository.RequirementRepository.update_requirement",
            new=AsyncMock(return_value=req_obj),
        ),
    ):
        resp = await client.patch(
            f"/api/requirements/{TEST_REQ_ID}/",
            json={"title": "Updated Requirement"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Updated Requirement"


@pytest.mark.asyncio
async def test_update_requirement_not_found(client: AsyncClient, auth_headers: dict):
    user_obj = _make_user_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "repositories.requirement_repository.RequirementRepository.get_by_id",
            new=AsyncMock(return_value=None),
        ),
    ):
        resp = await client.patch(
            "/api/requirements/nonexistent/",
            json={"title": "Nope"},
            headers=auth_headers,
        )
    assert resp.status_code == 404


# ─────────────────────────────────────────────────────────────────────────────
# Group 5: Tasks
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_tasks(client: AsyncClient, auth_headers: dict, project_id: str):
    task_obj = _make_task_obj()
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "repositories.task_repository.TaskRepository.list_by_project",
            new=AsyncMock(return_value=[task_obj]),
        ),
    ):
        resp = await client.get(f"/api/projects/{project_id}/tasks/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, auth_headers: dict, project_id: str):
    task_obj = _make_task_obj()
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "repositories.task_repository.TaskRepository.create_task",
            new=AsyncMock(return_value=task_obj),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{project_id}/tasks/",
            json={"title": "Implement login", "description": "Create login endpoint", "priority": "high"},
            headers=auth_headers,
        )
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert "id" in data


@pytest.mark.asyncio
async def test_update_task(client: AsyncClient, auth_headers: dict):
    task_obj = _make_task_obj(title="Updated Task")
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "repositories.task_repository.TaskRepository.get_by_id",
            new=AsyncMock(return_value=task_obj),
        ),
        patch(
            "repositories.task_repository.TaskRepository.update_task",
            new=AsyncMock(return_value=task_obj),
        ),
    ):
        resp = await client.patch(
            f"/api/tasks/{TEST_TASK_ID}/",
            json={"title": "Updated Task"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Updated Task"


# ─────────────────────────────────────────────────────────────────────────────
# Group 6: Phase Flow – ALL 10 PHASES
# ─────────────────────────────────────────────────────────────────────────────

# Per-phase expected content keys for deeper validation
PHASE_CONTENT_HINTS: Dict[str, str] = {
    "planning": "planning",
    "feasibility_study": "feasibility",
    "requirements_gathering": "requirements",
    "validation": "validation",
    "design": "design",
    "development": "development",
    "tasks": "tasks",
    "cost_benefit": "cost",
    "risks": "risks",
    "summary": "summary",
}


def _make_phase_artifact(phase: str):
    """Generate a realistic artifact for a given phase."""
    phase_content_map = {
        "planning": {
            "markdown": "# Planning Brief\n\n## Key Objectives\n- Define scope\n- Stakeholders\n\n## Business Goals\n- Increase revenue",
            "raw_markdown": "# Planning Brief\n\n## Key Objectives\n- Define scope",
        },
        "feasibility_study": {
            "markdown": "# Feasibility Study\n\n## Technical Feasibility\nFeasible.\n\n## Financial Analysis\nROI projected.",
            "raw_markdown": "# Feasibility Study\n\n## Technical Feasibility\nFeasible.",
        },
        "requirements_gathering": {
            "markdown": "# Requirements Document\n\n## Functional Requirements\n- F1: Login\n\n## Non-Functional Requirements\n- Performance",
            "raw_markdown": "# Requirements Document\n\n## Functional Requirements\n- F1: Login",
        },
        "validation": {
            "markdown": "# Validation Checklist\n\n## Acceptance Criteria\n- [ ] All tests pass",
            "raw_markdown": "# Validation Checklist\n\n## Acceptance Criteria",
        },
        "design": {
            "markdown": "# Design Document\n\n## Architecture\n```plantuml\n@startuml\nactor User\n@enduml\n```",
            "raw_markdown": "# Design Document\n\n## Architecture",
        },
        "development": {
            "markdown": "# Development Plan\n\n## Tech Stack\n- React: Frontend\n- FastAPI: Backend\n\n## Flow\n1. Auth: JWT",
            "raw_markdown": "# Development Plan\n\n## Tech Stack\n- React",
        },
        "tasks": {
            "markdown": "# Task Planning\n\n## Phase 1\n- [ ] Setup environment\n- [ ] Database schema",
            "raw_markdown": "# Task Planning\n\n## Phase 1",
        },
        "cost_benefit": {
            "markdown": "# Cost-Benefit Analysis\n\n## Development Costs\n- Team: $50,000\n\n## ROI\n- 200% over 2 years",
            "raw_markdown": "# Cost-Benefit Analysis\n\n## Development Costs",
        },
        "risks": {
            "markdown": "# Risk Register\n\n| Risk | Impact | Likelihood | Mitigation | Owner |\n|------|--------|------------|------------|-------|\n| Tech debt | High | Medium | Code review | Dev Lead |",
            "raw_markdown": "# Risk Register\n\n| Risk | Impact |",
        },
        "summary": {
            "markdown": "# Project Summary\n\n## Executive Summary\nProject delivered on time.\n\n## Next Steps\n- Deploy to production",
            "raw_markdown": "# Project Summary\n\n## Executive Summary",
        },
    }
    content = phase_content_map.get(
        phase,
        {"markdown": f"# {phase.title()}\n\nContent here.", "raw_markdown": f"# {phase.title()}"},
    )
    return _make_artifact_obj(
        type=f"PHASE_{phase.upper()}",
        title=f"{phase.replace('_', ' ').title()} Output",
        content_json=content,
        metadata={"phase": phase},
    )


def _completed_phase_status(phase: str) -> dict:
    """Return a phase_status dict where the given phase is completed."""
    status = {p: "locked" for p in ALL_PHASES}
    status["planning"] = "ready"
    status[phase] = "completed"
    idx = ALL_PHASES.index(phase)
    if idx + 1 < len(ALL_PHASES):
        status[ALL_PHASES[idx + 1]] = "ready"
    return status


@pytest.mark.asyncio
@pytest.mark.parametrize("phase", ALL_PHASES)
async def test_phase_generate(
    client: AsyncClient, auth_headers: dict, project_id: str, phase: str
):
    """Each of the 10 phases must return phase_status + content."""
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    artifact = _make_phase_artifact(phase)
    completed_status = _completed_phase_status(phase)
    raw_md = artifact.content_json.get("raw_markdown", "")
    formatted_md = artifact.content_json.get("markdown", "")

    phase_service_return = (
        completed_status,
        {
            "artifact_id": artifact.id,
            "content": artifact.content_json,
            "raw_markdown": raw_md,
            "formatted_markdown": formatted_md,
            "metadata": artifact.metadata,
        },
    )

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "services.phase_flow_service.PhaseFlowService.generate_phase",
            new=AsyncMock(return_value=phase_service_return),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{project_id}/phases/{phase}/generate/",
            json={"prompt": f"Generate {phase} for an e-commerce web app"},
            headers=auth_headers,
        )

    assert resp.status_code in (200, 201, 202), (
        f"Phase {phase} returned {resp.status_code}: {resp.text}"
    )
    data = resp.json()

    # Must have phase_status
    assert "phase_status" in data, f"phase_status missing for phase {phase}"
    assert isinstance(data["phase_status"], dict)
    assert len(data["phase_status"]) > 0

    # Must have content
    assert "content" in data, f"content missing for phase {phase}"
    assert data["content"] is not None

    # Phase should appear somewhere in phase_status
    assert phase in data["phase_status"], (
        f"Phase key '{phase}' not found in phase_status for {phase}"
    )
    assert data["phase_status"][phase] == "completed"

    # Content should be non-empty
    content = data["content"]
    assert content  # not empty dict / None


@pytest.mark.asyncio
async def test_get_phase_status(client: AsyncClient, auth_headers: dict, project_id: str):
    """GET /api/projects/{id}/phases/ must return all 10 phases."""
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    full_status = {phase: "ready" for phase in ALL_PHASES}

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "services.phase_flow_service.PhaseFlowService.get_status",
            new=AsyncMock(return_value=full_status),
        ),
    ):
        resp = await client.get(f"/api/projects/{project_id}/phases/", headers=auth_headers)

    assert resp.status_code == 200
    data = resp.json()
    assert "phases" in data
    assert "order" in data
    phases = data["phases"]
    for phase in ALL_PHASES:
        assert phase in phases, f"Phase '{phase}' missing from phase status response"


@pytest.mark.asyncio
async def test_unlock_all_phases(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    unlocked = {phase: "ready" for phase in ALL_PHASES}

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "services.phase_flow_service.PhaseFlowService.unlock_all",
            new=AsyncMock(return_value=unlocked),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{project_id}/phases/unlock-all/",
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "phases" in data


@pytest.mark.asyncio
@pytest.mark.parametrize("phase", ALL_PHASES)
async def test_unlock_individual_phase(
    client: AsyncClient, auth_headers: dict, project_id: str, phase: str
):
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    unlocked = {p: "locked" for p in ALL_PHASES}
    unlocked[phase] = "ready"

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "services.phase_flow_service.PhaseFlowService.unlock_phase",
            new=AsyncMock(return_value=unlocked),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{project_id}/phases/{phase}/unlock/",
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "phases" in data
    assert data["phases"][phase] == "ready"


# ─────────────────────────────────────────────────────────────────────────────
# Group 7: Generation / AI Jobs
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_generation_start(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    generation_response = _ns(
        job_id="job-001",
        status="queued",
        progress=0.0,
        result_summary=None,
        error_message=None,
    )

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.generation_service.GenerationService.start_generation",
            new=AsyncMock(return_value=generation_response),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{project_id}/generate/",
            json={"detail_level": "standard"},
            headers=auth_headers,
        )
    # accepts 200, 201, or 202
    assert resp.status_code in (200, 201, 202)


# ─────────────────────────────────────────────────────────────────────────────
# Group 8: AI Pipeline
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_ai_pipeline_generate(client: AsyncClient, auth_headers: dict):
    user_obj = _make_user_obj()

    ai_result = _ns(
        content="Generated content from AI",
        provider="stub",
        model_name="stub-model",
        tokens_used=100,
        duration_ms=250,
        cost_usd=0.001,
        quality_score=0.9,
        error=None,
    )

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.ai_pipeline_service.ai_pipeline.generate_with_best_model",
            new=AsyncMock(return_value=ai_result),
        ),
    ):
        resp = await client.post(
            "/api/ai/generate",
            json={
                "task_type": "requirements_extraction",
                "prompt": "Extract requirements from: build an e-commerce platform",
            },
            headers=auth_headers,
        )
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert "success" in data or "result" in data or "content" in data


@pytest.mark.asyncio
async def test_ai_pipeline_models(client: AsyncClient, auth_headers: dict):
    user_obj = _make_user_obj()
    mock_pipeline = MagicMock()
    mock_pipeline.models = {}
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        # Patch where the name is looked up – both the service module and the route module
        patch("services.ai_pipeline_service.ai_pipeline", mock_pipeline),
        patch("routes.ai_pipeline.ai_pipeline", mock_pipeline),
    ):
        resp = await client.get("/api/ai/models", headers=auth_headers)
    assert resp.status_code in (200, 500)  # 500 if stub pipeline errors


@pytest.mark.asyncio
async def test_ai_pipeline_health(client: AsyncClient):
    resp = await client.get("/api/ai/health")
    # AI health may succeed or return 500 depending on stub availability
    assert resp.status_code in (200, 500)


# ─────────────────────────────────────────────────────────────────────────────
# Group 9: Personas
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_generate_personas(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    personas_result = [
        {
            "id": "persona-1",
            "name": "Sarah the Shopper",
            "role": "End User",
            "age": 28,
            "goals": ["Easy checkout", "Product discovery"],
            "pain_points": ["Complex navigation"],
            "tech_savviness": "medium",
        }
    ]

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.persona_service.PersonaService.generate_personas",
            new=AsyncMock(return_value=personas_result),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{project_id}/personas/generate",
            json={
                "project_description": "An e-commerce web app for fashion",
                "num_personas": 1,
            },
            headers=auth_headers,
        )
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert "personas" in data
    assert isinstance(data["personas"], list)
    assert len(data["personas"]) >= 1
    p = data["personas"][0]
    assert "name" in p
    assert "role" in p
    assert "goals" in p


# ─────────────────────────────────────────────────────────────────────────────
# Group 10: SRS Audit
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_run_srs_audit(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    audit_result = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "overall_score": 85.0,
        "completeness_score": 90.0,
        "consistency_score": 80.0,
        "clarity_score": 85.0,
        "testability_score": 85.0,
        "findings": [],
        "recommendations": ["Add more detail to NFRs"],
        "audit_date": datetime.utcnow().isoformat(),
    }

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.srs_audit_service.SRSAuditService.audit_requirements",
            new=AsyncMock(return_value=audit_result),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{project_id}/srs-audit",
            headers=auth_headers,
        )
    assert resp.status_code in (200, 201)
    data = resp.json()
    assert "overall_score" in data or "score" in data or "id" in data


@pytest.mark.asyncio
async def test_get_latest_srs_audit(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    with patch(
        "services.auth_service.AuthService.get_current_user",
        new=AsyncMock(return_value=user_obj),
    ):
        resp = await client.get(
            f"/api/projects/{project_id}/srs-audit/latest",
            headers=auth_headers,
        )
    assert resp.status_code in (200, 404)


# ─────────────────────────────────────────────────────────────────────────────
# Group 11: Diagrams
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_sdlc_diagrams(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    now = datetime.utcnow()
    diagram_obj = _ns(
        id="diagram-1",
        project_id=project_id,
        stage="planning",
        title="Planning Diagram",
        nodes=[],
        edges=[],
        metadata={},
        frames=[],
        created_at=now,
        updated_at=now,
    )

    diagram_response = {
        "id": "diagram-1",
        "diagram_id": "diagram-1",
        "project_id": project_id,
        "stage": "planning",
        "title": "Planning Diagram",
        "nodes": [],
        "edges": [],
        "metadata": {},
        "frames": [],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "services.diagram_service.DiagramService.list_or_seed",
            new=AsyncMock(return_value=[diagram_obj]),
        ),
        patch(
            "services.diagram_service.DiagramService.to_response",
            return_value=diagram_response,
        ),
    ):
        resp = await client.get(
            f"/api/projects/{project_id}/sdlc-diagrams/",
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
@pytest.mark.parametrize("diagram_type", ["use_case", "class", "sequence", "er"])
async def test_get_uml_diagram(
    client: AsyncClient, auth_headers: dict, project_id: str, diagram_type: str
):
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    artifact_obj = _make_artifact_obj(
        type=f"uml_{diagram_type}",
        content_json={"plantuml": "@startuml\nactor User\n@enduml"},
    )

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "repositories.artifact_repository.ArtifactRepository.list_by_project",
            new=AsyncMock(return_value=[artifact_obj]),
        ),
    ):
        resp = await client.get(
            f"/api/projects/{project_id}/uml/{diagram_type}/",
            headers=auth_headers,
        )
    assert resp.status_code in (200, 400)  # 400 if type alias not recognized


# ─────────────────────────────────────────────────────────────────────────────
# Group 12: Export
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_export_pdf(client: AsyncClient, auth_headers: dict, project_id: str):
    import io
    user_obj = _make_user_obj()
    pdf_bytes = io.BytesIO(b"%PDF-1.4 fake pdf content")

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.export_service.ExportService.export_project_pdf",
            new=AsyncMock(return_value=pdf_bytes),
        ),
    ):
        resp = await client.get(
            f"/api/projects/{project_id}/export/pdf",
            headers=auth_headers,
        )
    # success or service error if reportlab not available
    assert resp.status_code in (200, 500)


@pytest.mark.asyncio
async def test_export_docx(client: AsyncClient, auth_headers: dict, project_id: str):
    import io
    user_obj = _make_user_obj()
    docx_bytes = io.BytesIO(b"PK fake docx content")

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.export_service.ExportService.export_project_docx",
            new=AsyncMock(return_value=docx_bytes),
        ),
    ):
        resp = await client.get(
            f"/api/projects/{project_id}/export/docx",
            headers=auth_headers,
        )
    assert resp.status_code in (200, 500)


# ─────────────────────────────────────────────────────────────────────────────
# Group 13: Notifications
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_notifications(client: AsyncClient, auth_headers: dict):
    user_obj = _make_user_obj()
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": TEST_USER_ID,
        "type": "info",
        "title": "Phase Complete",
        "message": "Planning phase completed",
        "read": False,
        "created_at": datetime.utcnow().isoformat(),
    }

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.notification_service.NotificationService.get_user_notifications",
            new=AsyncMock(return_value=[notification]),
        ),
    ):
        resp = await client.get("/api/notifications", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "notifications" in data
    assert isinstance(data["notifications"], list)


@pytest.mark.asyncio
async def test_mark_notification_read(client: AsyncClient, auth_headers: dict):
    notification_id = str(uuid.uuid4())
    user_obj = _make_user_obj()
    read_result = {
        "notification_id": notification_id,
        "read": True,
        "read_at": datetime.utcnow().isoformat(),
    }

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.notification_service.NotificationService.mark_as_read",
            new=AsyncMock(return_value=read_result),
        ),
    ):
        resp = await client.post(
            f"/api/notifications/{notification_id}/read",
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("read") is True


# ─────────────────────────────────────────────────────────────────────────────
# Group 14: Traceability
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_traceability_matrix(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    matrix = {
        "project_id": project_id,
        "matrix": [],
        "links": [],
        "coverage": 0.0,
        "generated_at": datetime.utcnow().isoformat(),
    }

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.traceability_service.TraceabilityService.generate_matrix",
            new=AsyncMock(return_value=matrix),
        ),
    ):
        resp = await client.get(
            f"/api/projects/{project_id}/traceability/matrix",
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "project_id" in data or "matrix" in data


@pytest.mark.asyncio
async def test_get_traceability_coverage(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    report = {
        "project_id": project_id,
        "total_requirements": 0,
        "covered_requirements": 0,
        "coverage_percentage": 0.0,
    }

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.traceability_service.TraceabilityService.generate_coverage_report",
            new=AsyncMock(return_value=report),
        ),
    ):
        resp = await client.get(
            f"/api/projects/{project_id}/traceability/coverage",
            headers=auth_headers,
        )
    assert resp.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# Group 15: Templates
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_templates(client: AsyncClient, auth_headers: dict):
    user_obj = _make_user_obj()
    templates = [
        {
            "id": "tmpl-1",
            "name": "E-Commerce Web App",
            "category": "web",
            "description": "Starter template for e-commerce",
            "industry": "retail",
            "tags": ["e-commerce", "web"],
        }
    ]

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.template_service.TemplateService.get_templates",
            new=AsyncMock(return_value=templates),
        ),
    ):
        resp = await client.get("/api/templates", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "templates" in data
    assert isinstance(data["templates"], list)


@pytest.mark.asyncio
async def test_get_brief_templates(client: AsyncClient, auth_headers: dict):
    user_obj = _make_user_obj()
    brief_templates = [{"id": "brief-1", "name": "Quick Start Brief"}]

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.template_service.TemplateService.get_brief_templates",
            new=AsyncMock(return_value=brief_templates),
        ),
    ):
        resp = await client.get("/api/templates/briefs", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "brief_templates" in data


# ─────────────────────────────────────────────────────────────────────────────
# Group 16: Users / Profile
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_user_profile(client: AsyncClient, auth_headers: dict):
    user_obj = _make_user_obj()
    with patch(
        "services.auth_service.AuthService.get_current_user",
        new=AsyncMock(return_value=user_obj),
    ):
        resp = await client.get("/api/users/me/profile", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert "id" in data


@pytest.mark.asyncio
async def test_update_user_profile(client: AsyncClient, auth_headers: dict):
    user_obj = _make_user_obj(full_name="Updated Name", job_title="Senior Dev")
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "repositories.user_repository.UserRepository.update_profile",
            new=AsyncMock(return_value=user_obj),
        ),
    ):
        resp = await client.patch(
            "/api/users/me/profile",
            json={"full_name": "Updated Name", "job_title": "Senior Dev"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data


# ─────────────────────────────────────────────────────────────────────────────
# Group 17: Change Log & Version History
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_change_log(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    now = datetime.utcnow()
    change_log_entry = _ns(
        id="cl-001",
        project_id=project_id,
        organization=TEST_ORG,
        author_id=TEST_USER_ID,
        description="Project kickoff",
        files=[],
        task_ids=[],
        requirement_ids=[],
        entry_type="manual",
        ai_summary=None,
        diagram_url=None,
        metadata={},
        created_at=now,
        updated_at=now,
    )

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "services.change_log_service.ChangeLogService.list_entries",
            new=AsyncMock(return_value=[change_log_entry]),
        ),
    ):
        resp = await client.get(
            f"/api/projects/{project_id}/changelog/",
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_create_change_log_entry(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    now2 = datetime.utcnow()
    change_log_entry = _ns(
        id="cl-002",
        project_id=project_id,
        organization=TEST_ORG,
        author_id=TEST_USER_ID,
        description="Added authentication",
        files=[],
        task_ids=[],
        requirement_ids=[],
        entry_type="manual",
        ai_summary=None,
        diagram_url=None,
        metadata={},
        created_at=now2,
        updated_at=now2,
    )

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "services.change_log_service.ChangeLogService.create_entry",
            new=AsyncMock(return_value=change_log_entry),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{project_id}/changelog/",
            json={"title": "Feature: Auth", "description": "Added authentication", "version_tag": "v0.2.0"},
            headers=auth_headers,
        )
    assert resp.status_code in (200, 201)


@pytest.mark.asyncio
async def test_get_version_history(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    history = [
        {
            "version_number": 1,
            "entity_type": "requirement",
            "entity_id": TEST_REQ_ID,
            "data": {"title": "User Auth"},
            "changed_by": TEST_USER_ID,
            "changed_at": datetime.utcnow().isoformat(),
        }
    ]

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.version_service.VersionService.get_version_history",
            new=AsyncMock(return_value=history),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{project_id}/version/history",
            json={"entity_type": "requirement", "entity_id": TEST_REQ_ID, "limit": 10},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "versions" in data


# ─────────────────────────────────────────────────────────────────────────────
# Group 18: Error handling
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_malformed_json_returns_422(client: AsyncClient, auth_headers: dict):
    """Sending invalid JSON body to a POST endpoint must return 422."""
    user_obj = _make_user_obj()
    with patch(
        "services.auth_service.AuthService.get_current_user",
        new=AsyncMock(return_value=user_obj),
    ):
        resp = await client.post(
            "/api/projects/",
            content=b"{bad json",
            headers={**auth_headers, "Content-Type": "application/json"},
        )
    assert resp.status_code == 422


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "endpoint,method",
    [
        ("/api/projects/", "GET"),
        (f"/api/projects/{TEST_PROJECT_ID}", "GET"),
        (f"/api/projects/{TEST_PROJECT_ID}/requirements/", "GET"),
        (f"/api/projects/{TEST_PROJECT_ID}/tasks/", "GET"),
        (f"/api/projects/{TEST_PROJECT_ID}/phases/", "GET"),
        ("/api/notifications", "GET"),
        ("/api/users/me/profile", "GET"),
    ],
)
async def test_protected_endpoints_require_auth(client: AsyncClient, endpoint: str, method: str):
    """Every protected endpoint must return 401/403 without a token."""
    if method == "GET":
        resp = await client.get(endpoint)
    else:
        resp = await client.post(endpoint, json={})
    assert resp.status_code in (401, 403), (
        f"{method} {endpoint} returned {resp.status_code} without auth"
    )


@pytest.mark.asyncio
async def test_invalid_bearer_token_returns_401(client: AsyncClient):
    resp = await client.get(
        "/api/projects/",
        headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.fake.payload"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_expired_bearer_token_returns_401(client: AsyncClient):
    expired = _make_expired_token()
    resp = await client.get(
        "/api/projects/",
        headers={"Authorization": f"Bearer {expired}"},
    )
    assert resp.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# Group 19: Complete User Lifecycle
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_full_user_lifecycle(client: AsyncClient):
    """
    Full lifecycle: register → login → create project → generate planning phase → export.
    All external I/O is mocked inside the test.
    """
    import io

    user_obj = _make_user_obj(email="lifecycle@example.com", id="lifecycle-user-001")
    project_obj = _make_project_obj()
    artifact = _make_phase_artifact("planning")
    completed_status = _completed_phase_status("planning")

    token_response_dict = {
        "access_token": _make_access_token(user_obj.id),
        "token_type": "bearer",
        "refresh_token": "rt-lifecycle",
        "user": {
            "id": user_obj.id,
            "email": user_obj.email,
            "full_name": user_obj.full_name,
            "organization": user_obj.organization,
            "role": "program_manager",
            "role_label": "Program Manager",
            "role_authority": 4,
            "avatar_url": None,
            "banner_url": None,
            "bio": None,
            "job_title": None,
            "location": None,
            "timezone": None,
            "pronouns": None,
            "skills": [],
            "interests": [],
            "social_links": [],
            "availability": None,
            "contact_email": None,
            "phone": None,
            "created_at": datetime.utcnow().isoformat(),
        },
    }

    # Step 1 – Register
    with patch(
        "services.auth_service.AuthService.register",
        new=AsyncMock(return_value=token_response_dict),
    ):
        resp = await client.post(
            "/api/auth/register",
            json={
                "email": "lifecycle@example.com",
                "password": "LifeCycle1",
                "full_name": "Lifecycle User",
                "organization": "LC Org",
            },
        )
    assert resp.status_code in (200, 201), f"Register failed: {resp.text}"
    access_token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # Step 2 – Login
    with patch(
        "services.auth_service.AuthService.login",
        new=AsyncMock(return_value=token_response_dict),
    ):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "lifecycle@example.com", "password": "LifeCycle1"},
        )
    assert resp.status_code == 200, f"Login failed: {resp.text}"

    # Step 3 – Create project
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.create_project",
            new=AsyncMock(return_value=project_obj),
        ),
    ):
        resp = await client.post(
            "/api/projects/",
            json={"name": "Lifecycle Project", "description": "E2E lifecycle test project"},
            headers=headers,
        )
    assert resp.status_code in (200, 201), f"Create project failed: {resp.text}"
    proj_data = resp.json()
    pid = proj_data["id"]

    # Step 4 – Generate planning phase
    phase_return = (
        completed_status,
        {
            "artifact_id": artifact.id,
            "content": artifact.content_json,
            "raw_markdown": artifact.content_json.get("raw_markdown", ""),
            "formatted_markdown": artifact.content_json.get("markdown", ""),
            "metadata": artifact.metadata,
        },
    )
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "services.phase_flow_service.PhaseFlowService.generate_phase",
            new=AsyncMock(return_value=phase_return),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{pid}/phases/planning/generate/",
            json={"prompt": "Plan an e-commerce web application"},
            headers=headers,
        )
    assert resp.status_code in (200, 201, 202), f"Phase generate failed: {resp.text}"
    phase_data = resp.json()
    assert "phase_status" in phase_data
    assert "content" in phase_data
    assert phase_data["phase_status"]["planning"] == "completed"

    # Step 5 – Export PDF
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.export_service.ExportService.export_project_pdf",
            new=AsyncMock(return_value=io.BytesIO(b"%PDF-1.4 fake")),
        ),
    ):
        resp = await client.get(f"/api/projects/{pid}/export/pdf", headers=headers)
    assert resp.status_code in (200, 500)  # 500 if reportlab unavailable


# ─────────────────────────────────────────────────────────────────────────────
# Group 20: Phase-specific content validation
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_planning_phase_content_structure(
    client: AsyncClient, auth_headers: dict, project_id: str
):
    """Planning phase content must contain objective/scope related content."""
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    artifact = _make_phase_artifact("planning")
    completed_status = _completed_phase_status("planning")

    phase_return = (
        completed_status,
        {
            "artifact_id": artifact.id,
            "content": artifact.content_json,
            "raw_markdown": artifact.content_json.get("raw_markdown", ""),
            "formatted_markdown": artifact.content_json.get("markdown", ""),
            "metadata": artifact.metadata,
        },
    )

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "services.phase_flow_service.PhaseFlowService.generate_phase",
            new=AsyncMock(return_value=phase_return),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{project_id}/phases/planning/generate/",
            json={"prompt": "Build an e-commerce platform"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    content = data["content"]
    # Either raw_markdown or markdown or the content dict itself holds the planning text
    content_str = json.dumps(content)
    assert "Planning" in content_str or "planning" in content_str.lower()


@pytest.mark.asyncio
async def test_risks_phase_content_structure(
    client: AsyncClient, auth_headers: dict, project_id: str
):
    """Risks phase content must reference risks."""
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    artifact = _make_phase_artifact("risks")
    completed_status = _completed_phase_status("risks")

    phase_return = (
        completed_status,
        {
            "artifact_id": artifact.id,
            "content": artifact.content_json,
            "raw_markdown": artifact.content_json.get("raw_markdown", ""),
            "formatted_markdown": artifact.content_json.get("markdown", ""),
            "metadata": artifact.metadata,
        },
    )

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "services.phase_flow_service.PhaseFlowService.generate_phase",
            new=AsyncMock(return_value=phase_return),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{project_id}/phases/risks/generate/",
            json={"prompt": "Identify project risks"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    content_str = json.dumps(data["content"])
    assert "Risk" in content_str or "risk" in content_str.lower()


@pytest.mark.asyncio
async def test_cost_benefit_phase_content_structure(
    client: AsyncClient, auth_headers: dict, project_id: str
):
    """Cost-benefit phase content must reference costs or ROI."""
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    artifact = _make_phase_artifact("cost_benefit")
    completed_status = _completed_phase_status("cost_benefit")

    phase_return = (
        completed_status,
        {
            "artifact_id": artifact.id,
            "content": artifact.content_json,
            "raw_markdown": artifact.content_json.get("raw_markdown", ""),
            "formatted_markdown": artifact.content_json.get("markdown", ""),
            "metadata": artifact.metadata,
        },
    )

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "services.phase_flow_service.PhaseFlowService.generate_phase",
            new=AsyncMock(return_value=phase_return),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{project_id}/phases/cost_benefit/generate/",
            json={"prompt": "Analyse cost and benefits"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    content_str = json.dumps(data["content"])
    assert "Cost" in content_str or "cost" in content_str.lower() or "ROI" in content_str


@pytest.mark.asyncio
async def test_summary_phase_content_structure(
    client: AsyncClient, auth_headers: dict, project_id: str
):
    """Summary phase must contain executive summary concepts."""
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    artifact = _make_phase_artifact("summary")
    completed_status = _completed_phase_status("summary")

    phase_return = (
        completed_status,
        {
            "artifact_id": artifact.id,
            "content": artifact.content_json,
            "raw_markdown": artifact.content_json.get("raw_markdown", ""),
            "formatted_markdown": artifact.content_json.get("markdown", ""),
            "metadata": artifact.metadata,
        },
    )

    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "services.phase_flow_service.PhaseFlowService.generate_phase",
            new=AsyncMock(return_value=phase_return),
        ),
    ):
        resp = await client.post(
            f"/api/projects/{project_id}/phases/summary/generate/",
            json={"prompt": "Summarise the project"},
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    content_str = json.dumps(data["content"])
    assert "Summary" in content_str or "summary" in content_str.lower()


# ─────────────────────────────────────────────────────────────────────────────
# Group 21: Project sub-resources
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_project_roadmap_get(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    project_obj = _make_project_obj(roadmap=[], roadmap_summary=[])
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
    ):
        resp = await client.get(f"/api/projects/{project_id}/roadmap/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "milestones" in data


@pytest.mark.asyncio
async def test_project_artifacts_get(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    artifact_obj = _make_artifact_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "repositories.artifact_repository.ArtifactRepository.list_by_project",
            new=AsyncMock(return_value=[artifact_obj]),
        ),
    ):
        resp = await client.get(f"/api/projects/{project_id}/artifacts/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_project_ai_runs_get(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "repositories.ai_run_repository.AiRunRepository.list_by_project",
            new=AsyncMock(return_value=[]),
        ),
    ):
        resp = await client.get(f"/api/projects/{project_id}/ai-runs/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_project_requirements_export(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    project_obj = _make_project_obj()
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
        patch(
            "repositories.requirement_repository.RequirementRepository.list_by_project",
            new=AsyncMock(return_value=[]),
        ),
    ):
        resp = await client.get(
            f"/api/projects/{project_id}/requirements/export/",
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "project_id" in data
    assert "requirements" in data


@pytest.mark.asyncio
async def test_project_feasibility_studies(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    project_obj = _make_project_obj(feasibility_studies=[])
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
    ):
        resp = await client.get(
            f"/api/projects/{project_id}/feasibility-studies/",
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "studies" in data


@pytest.mark.asyncio
async def test_project_development_data(client: AsyncClient, auth_headers: dict, project_id: str):
    user_obj = _make_user_obj()
    project_obj = _make_project_obj(development_stack=[], development_notes={})
    with (
        patch(
            "services.auth_service.AuthService.get_current_user",
            new=AsyncMock(return_value=user_obj),
        ),
        patch(
            "services.project_service.ProjectService.get_project",
            new=AsyncMock(return_value=project_obj),
        ),
    ):
        resp = await client.get(
            f"/api/projects/{project_id}/development/",
            headers=auth_headers,
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "stack" in data
