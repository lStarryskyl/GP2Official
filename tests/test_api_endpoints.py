"""
Backend API Tests for Acorn Platform
Tests for:
- Authentication endpoints
- Project CRUD operations (including PUT fix)
- Requirements creation (POST fix)
- Phase navigation endpoints
"""

import pytest
import requests
import os
import time

BASE_URL = "http://localhost:8001"

# Test credentials
TEST_EMAIL = "testuser@example.com"
TEST_PASSWORD = "TestPass123!"
EXISTING_PROJECT_ID = "proj_1768865010111388"


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test health check returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print(f"✓ Login successful for {TEST_EMAIL}")
        return data["access_token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpass"}
        )
        assert response.status_code in [401, 404], f"Expected 401/404, got {response.status_code}"
        print("✓ Invalid login correctly rejected")


class TestProjectCRUD:
    """Project CRUD tests including PUT endpoint fix verification"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_get_projects_list(self):
        """Test listing projects"""
        response = requests.get(f"{BASE_URL}/api/projects/", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Projects list retrieved: {len(data)} projects")
    
    def test_get_project_by_id(self):
        """Test getting a specific project"""
        response = requests.get(
            f"{BASE_URL}/api/projects/{EXISTING_PROJECT_ID}/",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data or "project_id" in data
        print(f"✓ Project retrieved: {data.get('name', 'Unknown')}")
    
    def test_put_project_update_with_trailing_slash(self):
        """Test PUT /api/projects/{id}/ - FIXED endpoint with trailing slash"""
        update_data = {
            "name": f"Updated Project {int(time.time())}",
            "description": "Updated via PUT endpoint test"
        }
        response = requests.put(
            f"{BASE_URL}/api/projects/{EXISTING_PROJECT_ID}/",
            json=update_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"PUT with trailing slash failed: {response.status_code} - {response.text}"
        data = response.json()
        print(f"✓ PUT /api/projects/{{id}}/ works - Project updated: {data.get('name', 'Unknown')}")
    
    def test_put_project_update_without_trailing_slash(self):
        """Test PUT /api/projects/{id} - FIXED endpoint without trailing slash"""
        update_data = {
            "name": f"Updated Project No Slash {int(time.time())}",
            "description": "Updated via PUT endpoint test (no trailing slash)"
        }
        response = requests.put(
            f"{BASE_URL}/api/projects/{EXISTING_PROJECT_ID}",
            json=update_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"PUT without trailing slash failed: {response.status_code} - {response.text}"
        data = response.json()
        print(f"✓ PUT /api/projects/{{id}} works - Project updated: {data.get('name', 'Unknown')}")


class TestRequirements:
    """Requirements endpoint tests including POST fix verification"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_get_requirements_list(self):
        """Test listing requirements for a project"""
        response = requests.get(
            f"{BASE_URL}/api/projects/{EXISTING_PROJECT_ID}/requirements/",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Requirements list retrieved: {len(data)} requirements")
    
    def test_post_create_requirement(self):
        """Test POST /api/projects/{id}/requirements/ - FIXED endpoint"""
        requirement_data = {
            "type": "functional",
            "title": f"Test Requirement {int(time.time())}",
            "description": "Created via POST endpoint test",
            "priority": "medium",
            "status": "proposed",
            "confidence_score": 0.8
        }
        response = requests.post(
            f"{BASE_URL}/api/projects/{EXISTING_PROJECT_ID}/requirements/",
            json=requirement_data,
            headers=self.headers
        )
        assert response.status_code in [200, 201], f"POST requirements failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "id" in data or "requirement_id" in data
        print(f"✓ POST /api/projects/{{id}}/requirements/ works - Requirement created: {data.get('title', 'Unknown')}")


class TestRoadmap:
    """Roadmap endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_get_roadmap(self):
        """Test getting project roadmap"""
        response = requests.get(
            f"{BASE_URL}/api/projects/{EXISTING_PROJECT_ID}/roadmap/",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "milestones" in data
        print(f"✓ Roadmap retrieved: {len(data.get('milestones', []))} milestones")


class TestFeasibilityStudy:
    """Feasibility study endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_get_feasibility_studies(self):
        """Test getting feasibility studies"""
        response = requests.get(
            f"{BASE_URL}/api/projects/{EXISTING_PROJECT_ID}/feasibility-studies/",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "studies" in data
        print(f"✓ Feasibility studies retrieved: {len(data.get('studies', []))} studies")
    
    def test_get_feasibility_sections(self):
        """Test getting feasibility sections"""
        response = requests.get(
            f"{BASE_URL}/api/projects/{EXISTING_PROJECT_ID}/feasibility-sections/",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "sections" in data
        print(f"✓ Feasibility sections retrieved: {len(data.get('sections', []))} sections")


class TestTasks:
    """Task endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_get_tasks_list(self):
        """Test listing tasks for a project"""
        response = requests.get(
            f"{BASE_URL}/api/projects/{EXISTING_PROJECT_ID}/tasks/",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Tasks list retrieved: {len(data)} tasks")
    
    def test_post_create_task(self):
        """Test creating a task"""
        task_data = {
            "title": f"Test Task {int(time.time())}",
            "description": "Created via POST endpoint test",
            "priority": "medium",
            "status": "planned"
        }
        response = requests.post(
            f"{BASE_URL}/api/projects/{EXISTING_PROJECT_ID}/tasks/",
            json=task_data,
            headers=self.headers
        )
        assert response.status_code in [200, 201], f"POST tasks failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "id" in data or "task_id" in data
        print(f"✓ Task created: {data.get('title', 'Unknown')}")


class TestArtifacts:
    """Artifact endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_get_artifacts_list(self):
        """Test listing artifacts for a project"""
        response = requests.get(
            f"{BASE_URL}/api/projects/{EXISTING_PROJECT_ID}/artifacts/",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Artifacts list retrieved: {len(data)} artifacts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
