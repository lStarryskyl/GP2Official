#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Acorn Platform
Tests database connectivity, API endpoints, and core functionality
"""

import requests
import sys
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

class AcornAPITester:
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test session
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'AcornAPITester/1.0'
        })

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            'name': name,
            'success': success,
            'details': details,
            'response_data': response_data,
            'timestamp': datetime.now().isoformat()
        })

    def test_health_check(self) -> bool:
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        try:
            response = self.session.get(f"{self.base_url}/")
            success = response.status_code == 200
            data = response.json() if success else {}
            self.log_test("Root endpoint (/)", success, 
                         f"Status: {response.status_code}", data)
        except Exception as e:
            self.log_test("Root endpoint (/)", False, f"Error: {str(e)}")
            return False

        # Test API info endpoint
        try:
            response = self.session.get(f"{self.api_url}")
            success = response.status_code == 200
            data = response.json() if success else {}
            self.log_test("API info (/api)", success, 
                         f"Status: {response.status_code}", data)
        except Exception as e:
            self.log_test("API info (/api)", False, f"Error: {str(e)}")

        # Test health check endpoint
        try:
            response = self.session.get(f"{self.api_url}/health")
            success = response.status_code == 200
            data = response.json() if success else {}
            self.log_test("Health check (/api/health)", success, 
                         f"Status: {response.status_code}", data)
            return success
        except Exception as e:
            self.log_test("Health check (/api/health)", False, f"Error: {str(e)}")
            return False

    def test_user_registration_and_login(self) -> bool:
        """Test user registration and login flow"""
        print("\n🔍 Testing Authentication...")
        
        # Generate unique test user
        timestamp = str(int(time.time()))
        test_email = f"test_user_{timestamp}@example.com"
        test_password = "TestPassword123!"
        
        # Test user registration
        try:
            register_data = {
                "email": test_email,
                "password": test_password,
                "full_name": "Test User",
                "organization": "Test Organization"
            }
            
            response = self.session.post(f"{self.api_url}/auth/register", 
                                       json=register_data)
            success = response.status_code in [200, 201]
            data = response.json() if success else {}
            
            self.log_test("User registration", success, 
                         f"Status: {response.status_code}", data)
            
            if not success:
                print(f"Registration failed: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User registration", False, f"Error: {str(e)}")
            return False

        # Test user login
        try:
            login_data = {
                "email": test_email,
                "password": test_password
            }
            
            response = self.session.post(f"{self.api_url}/auth/login", 
                                       json=login_data)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            self.log_test("User login", success, 
                         f"Status: {response.status_code}", data)
            
            if success and 'access_token' in data:
                self.token = data['access_token']
                self.user_id = data.get('user', {}).get('id')
                self.session.headers.update({
                    'Authorization': f'Bearer {self.token}'
                })
                return True
            else:
                print(f"Login failed: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User login", False, f"Error: {str(e)}")
            return False

    def test_authenticated_endpoints(self) -> bool:
        """Test endpoints that require authentication"""
        print("\n🔍 Testing Authenticated Endpoints...")
        
        if not self.token:
            self.log_test("Authentication required", False, "No token available")
            return False

        # Test get user profile
        try:
            response = self.session.get(f"{self.api_url}/auth/me")
            success = response.status_code == 200
            data = response.json() if success else {}
            
            self.log_test("Get user profile (/auth/me)", success, 
                         f"Status: {response.status_code}", data)
        except Exception as e:
            self.log_test("Get user profile", False, f"Error: {str(e)}")

        return True

    def test_project_crud_operations(self) -> bool:
        """Test project CRUD operations"""
        print("\n🔍 Testing Project Operations...")
        
        if not self.token:
            self.log_test("Project operations", False, "Authentication required")
            return False

        project_id = None
        
        # Test create project
        try:
            project_data = {
                "name": f"Test Project {int(time.time())}",
                "description": "A test project for API testing",
                "template_type": "web_app",
                "status": "draft"
            }
            
            response = self.session.post(f"{self.api_url}/projects/", 
                                       json=project_data)
            success = response.status_code in [200, 201]
            data = response.json() if success else {}
            
            self.log_test("Create project", success, 
                         f"Status: {response.status_code}", data)
            
            if success:
                project_id = data.get('id') or data.get('project_id')
            else:
                print(f"Project creation failed: {response.text}")
                
        except Exception as e:
            self.log_test("Create project", False, f"Error: {str(e)}")

        # Test get projects list
        try:
            response = self.session.get(f"{self.api_url}/projects/")
            success = response.status_code == 200
            data = response.json() if success else {}
            
            self.log_test("Get projects list", success, 
                         f"Status: {response.status_code}, Count: {len(data) if isinstance(data, list) else 'N/A'}")
        except Exception as e:
            self.log_test("Get projects list", False, f"Error: {str(e)}")

        # Test get specific project (if we have project_id)
        if project_id:
            try:
                response = self.session.get(f"{self.api_url}/projects/{project_id}/")
                success = response.status_code == 200
                data = response.json() if success else {}
                
                self.log_test("Get specific project", success, 
                             f"Status: {response.status_code}", data)
            except Exception as e:
                self.log_test("Get specific project", False, f"Error: {str(e)}")

            # Test update project
            try:
                update_data = {
                    "description": "Updated test project description",
                    "status": "planning"
                }
                
                response = self.session.put(f"{self.api_url}/projects/{project_id}/", 
                                          json=update_data)
                success = response.status_code == 200
                data = response.json() if success else {}
                
                self.log_test("Update project", success, 
                             f"Status: {response.status_code}", data)
            except Exception as e:
                self.log_test("Update project", False, f"Error: {str(e)}")

        return project_id is not None

    def test_requirements_and_tasks(self, project_id: str) -> bool:
        """Test requirements and tasks endpoints"""
        print("\n🔍 Testing Requirements and Tasks...")
        
        if not project_id:
            self.log_test("Requirements/Tasks", False, "No project ID available")
            return False

        # Test create requirement
        try:
            req_data = {
                "title": "Test Requirement",
                "description": "A test requirement for API testing",
                "type": "functional",
                "priority": "high"
            }
            
            response = self.session.post(f"{self.api_url}/projects/{project_id}/requirements/", 
                                       json=req_data)
            success = response.status_code in [200, 201]
            data = response.json() if success else {}
            
            self.log_test("Create requirement", success, 
                         f"Status: {response.status_code}", data)
        except Exception as e:
            self.log_test("Create requirement", False, f"Error: {str(e)}")

        # Test get requirements
        try:
            response = self.session.get(f"{self.api_url}/projects/{project_id}/requirements/")
            success = response.status_code == 200
            data = response.json() if success else {}
            
            self.log_test("Get requirements", success, 
                         f"Status: {response.status_code}, Count: {len(data) if isinstance(data, list) else 'N/A'}")
        except Exception as e:
            self.log_test("Get requirements", False, f"Error: {str(e)}")

        # Test create task
        try:
            task_data = {
                "title": "Test Task",
                "description": "A test task for API testing",
                "status": "planned",
                "priority": "medium",
                "estimate_hours": 8.0
            }
            
            response = self.session.post(f"{self.api_url}/projects/{project_id}/tasks/", 
                                       json=task_data)
            success = response.status_code in [200, 201]
            data = response.json() if success else {}
            
            self.log_test("Create task", success, 
                         f"Status: {response.status_code}", data)
        except Exception as e:
            self.log_test("Create task", False, f"Error: {str(e)}")

        # Test get tasks
        try:
            response = self.session.get(f"{self.api_url}/projects/{project_id}/tasks/")
            success = response.status_code == 200
            data = response.json() if success else {}
            
            self.log_test("Get tasks", success, 
                         f"Status: {response.status_code}, Count: {len(data) if isinstance(data, list) else 'N/A'}")
        except Exception as e:
            self.log_test("Get tasks", False, f"Error: {str(e)}")

        return True

    def test_artifacts_endpoints(self, project_id: str) -> bool:
        """Test artifacts endpoints"""
        print("\n🔍 Testing Artifacts...")
        
        if not project_id:
            self.log_test("Artifacts", False, "No project ID available")
            return False

        # Test get artifacts
        try:
            response = self.session.get(f"{self.api_url}/projects/{project_id}/artifacts/")
            success = response.status_code == 200
            data = response.json() if success else {}
            
            self.log_test("Get artifacts", success, 
                         f"Status: {response.status_code}, Count: {len(data) if isinstance(data, list) else 'N/A'}")
        except Exception as e:
            self.log_test("Get artifacts", False, f"Error: {str(e)}")

        return True

    def test_database_connectivity(self) -> bool:
        """Test database connectivity through API operations"""
        print("\n🔍 Testing Database Connectivity...")
        
        # The database connectivity is tested implicitly through CRUD operations
        # If we can create, read, update projects/users, the database is working
        
        # Check if we have successful CRUD operations
        crud_tests = [result for result in self.test_results 
                     if any(keyword in result['name'].lower() 
                           for keyword in ['create', 'get', 'update', 'registration', 'login'])]
        
        successful_crud = sum(1 for test in crud_tests if test['success'])
        total_crud = len(crud_tests)
        
        if total_crud > 0:
            success_rate = successful_crud / total_crud
            success = success_rate >= 0.7  # At least 70% of CRUD operations should work
            
            self.log_test("Database connectivity (via CRUD)", success, 
                         f"CRUD success rate: {successful_crud}/{total_crud} ({success_rate:.1%})")
            return success
        else:
            self.log_test("Database connectivity", False, "No CRUD operations to test")
            return False

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all tests and return results"""
        print("🚀 Starting Acorn Backend API Tests...")
        print(f"Testing against: {self.base_url}")
        
        start_time = time.time()
        
        # Test sequence
        health_ok = self.test_health_check()
        
        if not health_ok:
            print("\n❌ Health check failed - stopping tests")
            return self.get_test_summary()
        
        auth_ok = self.test_user_registration_and_login()
        
        if auth_ok:
            self.test_authenticated_endpoints()
            project_id = None
            
            # Get project ID from project creation test
            for result in self.test_results:
                if result['name'] == 'Create project' and result['success']:
                    project_id = result['response_data'].get('id') or result['response_data'].get('project_id')
                    break
            
            if not project_id:
                # Try to create a project for testing
                project_created = self.test_project_crud_operations()
                if project_created:
                    for result in self.test_results:
                        if result['name'] == 'Create project' and result['success']:
                            project_id = result['response_data'].get('id') or result['response_data'].get('project_id')
                            break
            
            if project_id:
                self.test_requirements_and_tasks(project_id)
                self.test_artifacts_endpoints(project_id)
        
        self.test_database_connectivity()
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\n⏱️  Tests completed in {duration:.2f} seconds")
        
        return self.get_test_summary()

    def get_test_summary(self) -> Dict[str, Any]:
        """Get test summary"""
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        # Categorize issues
        critical_failures = []
        minor_failures = []
        
        for result in self.test_results:
            if not result['success']:
                if any(keyword in result['name'].lower() 
                      for keyword in ['health', 'login', 'registration', 'database']):
                    critical_failures.append(result)
                else:
                    minor_failures.append(result)
        
        summary = {
            'total_tests': self.tests_run,
            'passed_tests': self.tests_passed,
            'failed_tests': self.tests_run - self.tests_passed,
            'success_rate': success_rate,
            'critical_failures': critical_failures,
            'minor_failures': minor_failures,
            'all_results': self.test_results
        }
        
        print(f"\n📊 Test Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        if critical_failures:
            print(f"\n🚨 Critical Issues ({len(critical_failures)}):")
            for failure in critical_failures:
                print(f"   - {failure['name']}: {failure['details']}")
        
        if minor_failures:
            print(f"\n⚠️  Minor Issues ({len(minor_failures)}):")
            for failure in minor_failures:
                print(f"   - {failure['name']}: {failure['details']}")
        
        return summary


def main():
    """Main test execution"""
    # Try to determine the correct backend URL
    backend_url = "http://localhost:8001"
    
    # Check if we can reach the backend
    try:
        response = requests.get(f"{backend_url}/", timeout=5)
        if response.status_code != 200:
            print(f"⚠️  Backend at {backend_url} returned status {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot reach backend at {backend_url}: {e}")
        print("Make sure the backend server is running on port 8001")
        return 1
    
    # Run tests
    tester = AcornAPITester(backend_url)
    results = tester.run_all_tests()
    
    # Determine exit code
    if results['success_rate'] >= 70:
        print(f"\n✅ Backend tests PASSED (Success rate: {results['success_rate']:.1f}%)")
        return 0
    else:
        print(f"\n❌ Backend tests FAILED (Success rate: {results['success_rate']:.1f}%)")
        return 1


if __name__ == "__main__":
    sys.exit(main())