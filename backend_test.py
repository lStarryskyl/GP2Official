#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Acorn Application - Phase 3 Features
Tests user registration, project creation, and complete AI generation analysis.
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any, Optional

# Backend API base URL from frontend/.env
BASE_URL = "http://localhost:8001/api"

class AcornBackendTester:
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.auth_token: Optional[str] = None
        self.user_data: Optional[Dict[str, Any]] = None
        self.project_data: Optional[Dict[str, Any]] = None
        self.generation_job_id: Optional[str] = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def test_health_check(self) -> bool:
        """Test backend health endpoint."""
        print("🔍 Testing backend health check...")
        try:
            async with self.session.get(f"{BASE_URL}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Health check passed: {data}")
                    return True
                else:
                    print(f"❌ Health check failed with status: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False
    
    async def test_user_registration(self) -> bool:
        """Test user registration with realistic data."""
        print("🔍 Testing user registration...")
        
        # Use realistic test data for Acorn application with timestamp to avoid conflicts
        import time
        timestamp = int(time.time())
        user_payload = {
            "email": f"sarah.johnson.{timestamp}@techcorp.com",
            "password": "SecurePass123!",
            "full_name": "Sarah Johnson",
            "organization": "TechCorp Solutions"
        }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/auth/register",
                json=user_payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("access_token")
                    self.user_data = data.get("user")
                    print(f"✅ User registration successful: {self.user_data['email']}")
                    print(f"   Organization: {self.user_data.get('organization')}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Registration failed with status {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Registration error: {e}")
            return False
    
    async def test_project_creation(self) -> bool:
        """Test project creation with comprehensive brief."""
        print("🔍 Testing project creation with comprehensive brief...")
        
        if not self.auth_token:
            print("❌ No auth token available for project creation")
            return False
        
        # Comprehensive project brief for testing Phase 3 features
        project_payload = {
            "name": "E-Commerce Platform Modernization",
            "description": "Complete modernization of legacy e-commerce platform with microservices architecture",
            "template_type": "web_app",
            "brief_text": """
            Project Overview:
            We need to modernize our legacy e-commerce platform to handle 10x traffic growth and improve user experience.
            
            Key Requirements:
            - Microservices architecture with API gateway
            - Real-time inventory management system
            - Advanced search and recommendation engine
            - Multi-tenant support for B2B customers
            - Payment processing with multiple gateways
            - Order management and fulfillment tracking
            - Customer analytics and reporting dashboard
            - Mobile-responsive design with PWA capabilities
            - Integration with existing ERP and CRM systems
            - High availability with 99.9% uptime requirement
            
            Technical Constraints:
            - Must support 100,000 concurrent users
            - Response time under 200ms for critical operations
            - PCI DSS compliance for payment processing
            - GDPR compliance for customer data
            - Multi-region deployment capability
            
            Business Goals:
            - Increase conversion rate by 25%
            - Reduce cart abandonment by 40%
            - Improve customer satisfaction scores
            - Enable rapid feature deployment
            - Reduce operational costs by 30%
            
            Timeline: 12 months with phased rollout
            Budget: $2.5M total project cost
            Team: 15 developers, 3 architects, 2 DevOps engineers
            """
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            async with self.session.post(
                f"{BASE_URL}/projects/",
                json=project_payload,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    self.project_data = await response.json()
                    print(f"✅ Project created successfully: {self.project_data['name']}")
                    print(f"   Project ID: {self.project_data['id']}")
                    print(f"   Template Type: {self.project_data['template_type']}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Project creation failed with status {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Project creation error: {e}")
            return False
    
    async def test_generation_start(self) -> bool:
        """Test starting AI generation with all Phase 3 options enabled."""
        print("🔍 Testing AI generation start with all Phase 3 features...")
        
        if not self.auth_token or not self.project_data:
            print("❌ Missing auth token or project data for generation")
            return False
        
        # Enable all Phase 3 features
        generation_payload = {
            "project_id": self.project_data["id"],
            "include_uml": True,
            "include_tasks": True,
            "detail_level": "detailed"  # Maximum detail for comprehensive testing
        }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            async with self.session.post(
                f"{BASE_URL}/generation/start",
                json=generation_payload,
                headers=headers
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    self.generation_job_id = data.get("job_id")
                    print(f"✅ Generation started successfully")
                    print(f"   Job ID: {self.generation_job_id}")
                    print(f"   Status: {data.get('status')}")
                    print(f"   Progress: {data.get('progress', 0)}%")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Generation start failed with status {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Generation start error: {e}")
            return False
    
    async def test_generation_completion(self, max_wait_time: int = 300) -> bool:
        """Test generation completion and verify Phase 3 results."""
        print("🔍 Testing generation completion and Phase 3 results...")
        
        if not self.auth_token or not self.generation_job_id:
            print("❌ Missing auth token or job ID for generation status check")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            try:
                async with self.session.get(
                    f"{BASE_URL}/generation/job/{self.generation_job_id}",
                    headers=headers
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        status = data.get("status")
                        progress = data.get("progress", 0)
                        
                        print(f"   Generation status: {status} ({progress}%)")
                        
                        if status == "completed":
                            result_summary = data.get("result_summary", {})
                            print("✅ Generation completed successfully!")
                            
                            # Verify Phase 3 features in result_summary
                            return self.verify_phase3_results(result_summary)
                            
                        elif status == "failed":
                            error_msg = data.get("error_message", "Unknown error")
                            print(f"❌ Generation failed: {error_msg}")
                            return False
                            
                        elif status in ["pending", "running"]:
                            # Wait and continue polling
                            await asyncio.sleep(5)
                            continue
                            
                    else:
                        error_text = await response.text()
                        print(f"❌ Status check failed with status {response.status}: {error_text}")
                        return False
                        
            except Exception as e:
                print(f"❌ Generation status check error: {e}")
                return False
        
        print(f"❌ Generation did not complete within {max_wait_time} seconds")
        return False
    
    def verify_phase3_results(self, result_summary: Dict[str, Any]) -> bool:
        """Verify that all Phase 3 features are present in results."""
        print("🔍 Verifying Phase 3 features in generation results...")
        
        required_fields = [
            "requirements_count",
            "srs_generated", 
            "uml_diagrams_count",
            "tasks_generated",
            "total_estimated_hours",
            "estimated_cost",
            "risk_level"
        ]
        
        missing_fields = []
        present_fields = []
        
        for field in required_fields:
            if field in result_summary:
                present_fields.append(field)
                value = result_summary[field]
                print(f"   ✅ {field}: {value}")
            else:
                missing_fields.append(field)
                print(f"   ❌ {field}: MISSING")
        
        # Additional Phase 3 feature checks
        if "task_breakdown" in result_summary:
            tasks = result_summary["task_breakdown"]
            print(f"   ✅ Task breakdown: {len(tasks) if isinstance(tasks, list) else 'Present'}")
        
        if "project_schedule" in result_summary:
            schedule = result_summary["project_schedule"]
            print(f"   ✅ Project schedule: Present")
            if isinstance(schedule, dict):
                if "total_hours" in schedule:
                    print(f"      - Total hours: {schedule['total_hours']}")
                if "total_days" in schedule:
                    print(f"      - Total days: {schedule['total_days']}")
                if "total_weeks" in schedule:
                    print(f"      - Total weeks: {schedule['total_weeks']}")
        
        if "risk_analysis" in result_summary:
            risks = result_summary["risk_analysis"]
            print(f"   ✅ Risk analysis: Present")
            if isinstance(risks, list):
                print(f"      - Number of risks identified: {len(risks)}")
        
        if "cost_breakdown" in result_summary:
            costs = result_summary["cost_breakdown"]
            print(f"   ✅ Cost breakdown: Present")
            if isinstance(costs, dict):
                for role, cost in costs.items():
                    print(f"      - {role}: {cost}")
        
        if missing_fields:
            print(f"❌ Missing required Phase 3 fields: {missing_fields}")
            return False
        else:
            print("✅ All Phase 3 features verified successfully!")
            return True
    
    async def test_requirements_retrieval(self) -> bool:
        """Test retrieval of generated requirements."""
        print("🔍 Testing requirements retrieval...")
        
        if not self.auth_token or not self.project_data:
            print("❌ Missing auth token or project data for requirements retrieval")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.auth_token}",
                "Content-Type": "application/json"
            }
            
            async with self.session.get(
                f"{BASE_URL}/generation/requirements/{self.project_data['id']}",
                headers=headers
            ) as response:
                
                if response.status == 200:
                    requirements = await response.json()
                    print(f"✅ Requirements retrieved successfully: {len(requirements)} requirements")
                    
                    # Show sample requirements
                    for i, req in enumerate(requirements[:3]):  # Show first 3
                        print(f"   Requirement {i+1}: {req.get('title', 'No title')}")
                        print(f"      Type: {req.get('type', 'Unknown')}")
                        print(f"      Priority: {req.get('priority', 'Unknown')}")
                    
                    if len(requirements) > 3:
                        print(f"   ... and {len(requirements) - 3} more requirements")
                    
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Requirements retrieval failed with status {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Requirements retrieval error: {e}")
            return False

async def run_comprehensive_backend_tests():
    """Run all backend tests for Acorn Phase 3 features."""
    print("🌰 Starting Comprehensive Acorn Backend Testing - Phase 3 Features")
    print("=" * 70)
    
    test_results = {
        "health_check": False,
        "user_registration": False,
        "project_creation": False,
        "generation_start": False,
        "generation_completion": False,
        "requirements_retrieval": False
    }
    
    async with AcornBackendTester() as tester:
        # Test 1: Health Check
        test_results["health_check"] = await tester.test_health_check()
        print()
        
        # Test 2: User Registration
        test_results["user_registration"] = await tester.test_user_registration()
        print()
        
        # Test 3: Project Creation with Comprehensive Brief
        test_results["project_creation"] = await tester.test_project_creation()
        print()
        
        # Test 4: Start Generation with All Phase 3 Options
        test_results["generation_start"] = await tester.test_generation_start()
        print()
        
        # Test 5: Wait for Generation Completion and Verify Phase 3 Results
        if test_results["generation_start"]:
            test_results["generation_completion"] = await tester.test_generation_completion()
            print()
        
        # Test 6: Retrieve Generated Requirements
        if test_results["project_creation"]:
            test_results["requirements_retrieval"] = await tester.test_requirements_retrieval()
            print()
    
    # Final Results Summary
    print("=" * 70)
    print("🌰 ACORN BACKEND TESTING RESULTS - PHASE 3 FEATURES")
    print("=" * 70)
    
    passed_tests = 0
    total_tests = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
        if result:
            passed_tests += 1
    
    print(f"\nOverall Result: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 ALL TESTS PASSED! Acorn backend Phase 3 features working correctly.")
    else:
        print("⚠️  Some tests failed. Check the detailed output above for issues.")
    
    return test_results

if __name__ == "__main__":
    asyncio.run(run_comprehensive_backend_tests())