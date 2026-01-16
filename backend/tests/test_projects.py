"""Project management tests."""

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient

from conftest import assert_response_success, assert_response_error, assert_valid_uuid


class TestProjectEndpoints:
    """Test project management endpoints."""

    def test_create_project_success(self, client: TestClient, auth_headers, sample_project_data):
        """Test successful project creation."""
        response = client.post("/api/projects/", json=sample_project_data, headers=auth_headers)
        assert_response_success(response, 201)
        
        data = response.json()
        assert data["name"] == sample_project_data["name"]
        assert data["description"] == sample_project_data["description"]
        assert data["template_type"] == sample_project_data["template_type"]
        assert data["status"] == "draft"
        assert assert_valid_uuid(data["id"])

    def test_create_project_unauthenticated(self, client: TestClient, sample_project_data):
        """Test project creation without authentication."""
        response = client.post("/api/projects/", json=sample_project_data)
        assert_response_error(response, 401)

    def test_create_project_invalid_data(self, client: TestClient, auth_headers):
        """Test project creation with invalid data."""
        invalid_data = {
            "name": "",  # Empty name
            "template_type": "invalid_type"
        }
        
        response = client.post("/api/projects/", json=invalid_data, headers=auth_headers)
        assert_response_error(response, 422)

    def test_get_projects_list(self, client: TestClient, auth_headers, test_project):
        """Test getting user's projects list."""
        response = client.get("/api/projects/", headers=auth_headers)
        assert_response_success(response)
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Check if test project is in the list
        project_ids = [p["id"] for p in data]
        assert test_project.id in project_ids

    def test_get_project_by_id(self, client: TestClient, auth_headers, test_project):
        """Test getting specific project by ID."""
        response = client.get(f"/api/projects/{test_project.id}/", headers=auth_headers)
        assert_response_success(response)
        
        data = response.json()
        assert data["id"] == test_project.id
        assert data["name"] == test_project.name

    def test_get_nonexistent_project(self, client: TestClient, auth_headers):
        """Test getting non-existent project."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/projects/{fake_id}/", headers=auth_headers)
        assert_response_error(response, 404)

    def test_update_project(self, client: TestClient, auth_headers, test_project):
        """Test updating project."""
        update_data = {
            "name": "Updated Project Name",
            "description": "Updated description"
        }
        
        response = client.patch(f"/api/projects/{test_project.id}/", json=update_data, headers=auth_headers)
        assert_response_success(response)
        
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]

    def test_delete_project(self, client: TestClient, auth_headers, test_project):
        """Test deleting project."""
        response = client.delete(f"/api/projects/{test_project.id}/", headers=auth_headers)
        assert_response_success(response, 204)
        
        # Verify project is deleted
        get_response = client.get(f"/api/projects/{test_project.id}/", headers=auth_headers)
        assert_response_error(get_response, 404)

    def test_project_access_control(self, client: TestClient, auth_headers, admin_headers, test_project):
        """Test project access control between users."""
        # Different user should not access project
        other_user_data = {
            "email": "other@example.com",
            "password": "OtherPassword123!",
            "full_name": "Other User",
            "organization": "Other Org"
        }
        
        # Register different user
        client.post("/api/auth/register/", json=other_user_data)
        
        # Login as different user
        login_response = client.post("/api/auth/login/", json={
            "email": other_user_data["email"],
            "password": other_user_data["password"]
        })
        other_headers = {
            "Authorization": f"Bearer {login_response.json()['access_token']}"
        }
        
        # Should not be able to access project from different organization
        response = client.get(f"/api/projects/{test_project.id}/", headers=other_headers)
        assert_response_error(response, 404)


@pytest.mark.asyncio
class TestProjectService:
    """Test project service logic."""

    async def test_create_project_with_phases(self, test_user, test_db):
        """Test project creation initializes phase status."""
        from services.project_service import ProjectService
        
        service = ProjectService()
        project_data = {
            "name": "Phase Test Project",
            "description": "Testing phase initialization",
            "template_type": "web_app",
            "owner_id": test_user.id,
            "organization": test_user.organization
        }
        
        project = await service.create_project(project_data, test_user)
        
        assert project.phase_status is not None
        assert "planning" in project.phase_status
        assert project.phase_status["planning"] == "ready"
        assert project.phase_status["requirements_gathering"] == "locked"

    async def test_unlock_next_phase(self, test_project, test_user):
        """Test unlocking next phase in project workflow."""
        from services.project_service import ProjectService
        
        service = ProjectService()
        
        # Complete planning phase
        await service.complete_phase(test_project.id, "planning", test_user)
        
        # Check that feasibility study is now unlocked
        updated_project = await service.get_project(test_project.id, test_user.organization)
        assert updated_project.phase_status["planning"] == "completed"
        assert updated_project.phase_status["feasibility_study"] == "ready"

    async def test_generate_project_requirements(self, test_project, test_user, mock_llm_client):
        """Test AI-powered requirements generation."""
        from services.project_service import ProjectService
        from services.generation_service import GenerationService
        
        # Mock the LLM client
        gen_service = GenerationService()
        gen_service.llm_client = mock_llm_client
        
        project_service = ProjectService()
        
        brief = "Build a social media platform for developers"
        requirements = await project_service.generate_requirements(
            test_project.id, brief, test_user
        )
        
        assert len(requirements) > 0
        assert requirements[0]["title"] == "Mock Requirement"
        assert requirements[0]["type"] == "functional"


class TestProjectValidation:
    """Test project input validation."""

    def test_project_name_validation(self):
        """Test project name validation."""
        from utils.validation import validate_project_name, ValidationError
        
        # Valid names
        assert validate_project_name("Valid Project Name") == "Valid Project Name"
        assert validate_project_name("Project-123") == "Project-123"
        assert validate_project_name("My_Project") == "My_Project"
        
        # Invalid names
        with pytest.raises(ValidationError):
            validate_project_name("")  # Empty
        
        with pytest.raises(ValidationError):
            validate_project_name("  ")  # Only whitespace
        
        with pytest.raises(ValidationError):
            validate_project_name("AB")  # Too short
        
        with pytest.raises(ValidationError):
            validate_project_name("Project<script>")  # Invalid characters

    def test_project_data_sanitization(self):
        """Test project data sanitization."""
        from utils.validation import validate_user_input
        
        project_data = {
            "name": "<script>alert('xss')</script>Malicious Project",
            "description": "Normal description with <b>bold</b> text",
            "brief_text": "Brief with <img src=x onerror=alert(1)> injection"
        }
        
        sanitized = validate_user_input(project_data)
        
        assert "<script>" not in sanitized["name"]
        assert sanitized["name"] == "Malicious Project"
        assert "<b>bold</b>" in sanitized["description"]  # Allowed HTML
        assert "onerror" not in sanitized["brief_text"]  # Malicious attributes removed


@pytest.mark.asyncio 
class TestProjectCaching:
    """Test project caching functionality."""

    async def test_project_cache_operations(self, test_project, test_user):
        """Test project caching operations."""
        from utils.cache import get_cached, set_cached, generate_cache_key, invalidate_project_cache
        
        # Test cache key generation
        cache_key = generate_cache_key("project", test_project.id)
        assert cache_key == f"project:{test_project.id}"
        
        # Test cache set/get
        project_data = test_project.dict()
        await set_cached(cache_key, project_data, ttl=60)
        
        cached_data = await get_cached(cache_key)
        if cached_data:  # Only test if Redis is available
            assert cached_data["id"] == test_project.id
            assert cached_data["name"] == test_project.name
        
        # Test cache invalidation
        deleted_count = await invalidate_project_cache(test_project.id)
        # Should work even if Redis is not available (returns 0)
        assert deleted_count >= 0
