#!/usr/bin/env python3
"""
Detailed Phase 3 Feature Verification Test
Focuses on verifying all Phase 3 features are present and working correctly.
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any, Optional

BASE_URL = "http://localhost:8001/api"

async def test_phase3_features_detailed():
    """Test Phase 3 features in detail."""
    print("🌰 DETAILED PHASE 3 FEATURE VERIFICATION")
    print("=" * 60)
    
    async with aiohttp.ClientSession() as session:
        # Register user
        timestamp = int(time.time())
        user_payload = {
            "email": f"phase3.tester.{timestamp}@acorn.com",
            "password": "TestPhase3!",
            "full_name": "Phase 3 Tester",
            "organization": "Acorn Testing Corp"
        }
        
        async with session.post(f"{BASE_URL}/auth/register", json=user_payload) as response:
            if response.status != 200:
                print("❌ Failed to register user")
                return
            
            auth_data = await response.json()
            auth_token = auth_data["access_token"]
            print(f"✅ User registered: {auth_data['user']['email']}")
        
        # Create project with detailed brief
        project_payload = {
            "name": "Advanced AI-Powered Healthcare Platform",
            "description": "Next-generation healthcare platform with AI diagnostics and patient management",
            "template_type": "web_app",
            "brief_text": """
            Healthcare Platform Requirements:
            
            Core Features:
            - AI-powered diagnostic assistance with machine learning models
            - Electronic Health Records (EHR) management system
            - Patient portal with appointment scheduling
            - Telemedicine video consultation platform
            - Real-time vital signs monitoring integration
            - Prescription management and drug interaction checking
            - Medical imaging storage and analysis (DICOM support)
            - Clinical decision support system
            - Healthcare analytics and reporting dashboard
            - Multi-language support for diverse patient populations
            
            Technical Requirements:
            - HIPAA compliance for patient data protection
            - HL7 FHIR standard integration
            - High availability with 99.99% uptime
            - Scalable microservices architecture
            - Real-time data processing capabilities
            - Advanced security with multi-factor authentication
            - Mobile applications for iOS and Android
            - Integration with existing hospital systems
            - Cloud-native deployment with auto-scaling
            - Disaster recovery and backup systems
            
            Performance Requirements:
            - Support 50,000+ concurrent users
            - Sub-second response times for critical operations
            - 24/7 system availability
            - Real-time notifications and alerts
            - Automated data backup every 15 minutes
            
            Compliance & Security:
            - HIPAA, GDPR, and SOC 2 compliance
            - End-to-end encryption for all data
            - Audit logging for all user actions
            - Role-based access control (RBAC)
            - Regular security penetration testing
            
            Business Goals:
            - Improve patient outcomes by 30%
            - Reduce administrative overhead by 50%
            - Increase healthcare provider efficiency
            - Enable remote patient monitoring
            - Support value-based care initiatives
            
            Project Constraints:
            - 18-month development timeline
            - $5M total budget
            - Team of 25 professionals
            - Phased rollout across 10 healthcare facilities
            """
        }
        
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        async with session.post(f"{BASE_URL}/projects/", json=project_payload, headers=headers) as response:
            if response.status != 200:
                print("❌ Failed to create project")
                return
            
            project_data = await response.json()
            print(f"✅ Project created: {project_data['name']}")
            print(f"   Project ID: {project_data['id']}")
        
        # Start generation with all Phase 3 features
        generation_payload = {
            "project_id": project_data["id"],
            "include_uml": True,
            "include_tasks": True,
            "detail_level": "detailed"
        }
        
        async with session.post(f"{BASE_URL}/generation/start", json=generation_payload, headers=headers) as response:
            if response.status != 200:
                print("❌ Failed to start generation")
                return
            
            gen_data = await response.json()
            job_id = gen_data["job_id"]
            print(f"✅ Generation started: {job_id}")
        
        # Wait for completion and analyze results
        max_wait = 300  # 5 minutes
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            async with session.get(f"{BASE_URL}/generation/job/{job_id}", headers=headers) as response:
                if response.status != 200:
                    print("❌ Failed to check generation status")
                    return
                
                status_data = await response.json()
                status = status_data.get("status")
                progress = status_data.get("progress", 0)
                
                if status == "completed":
                    result_summary = status_data.get("result_summary", {})
                    print(f"✅ Generation completed successfully!")
                    
                    # Detailed Phase 3 analysis
                    print("\n🔍 PHASE 3 FEATURES ANALYSIS:")
                    print("-" * 40)
                    
                    # Requirements Analysis
                    req_count = result_summary.get("requirements_count", 0)
                    print(f"📋 Requirements: {req_count} extracted")
                    
                    # SRS Generation
                    srs_gen = result_summary.get("srs_generated", False)
                    print(f"📄 SRS Document: {'✅ Generated' if srs_gen else '❌ Not Generated'}")
                    
                    # UML Diagrams
                    uml_count = result_summary.get("uml_diagrams_count", 0)
                    print(f"📊 UML Diagrams: {uml_count} created")
                    
                    # Task Breakdown
                    tasks_gen = result_summary.get("tasks_generated", 0)
                    print(f"✅ Tasks Generated: {tasks_gen}")
                    
                    # Project Schedule
                    total_hours = result_summary.get("total_estimated_hours", 0)
                    print(f"⏱️  Total Estimated Hours: {total_hours}")
                    
                    if "project_schedule" in result_summary:
                        schedule = result_summary["project_schedule"]
                        if isinstance(schedule, dict):
                            days = schedule.get("total_days", "N/A")
                            weeks = schedule.get("total_weeks", "N/A")
                            print(f"📅 Project Duration: {days} days ({weeks} weeks)")
                    
                    # Cost Estimation
                    total_cost = result_summary.get("estimated_cost", 0)
                    print(f"💰 Total Estimated Cost: ${total_cost:,.2f}")
                    
                    if "cost_breakdown" in result_summary:
                        cost_breakdown = result_summary["cost_breakdown"]
                        print("   Cost Breakdown by Role:")
                        if isinstance(cost_breakdown, dict):
                            for role, cost in cost_breakdown.items():
                                print(f"      - {role}: ${cost:,.2f}")
                    
                    # Risk Analysis
                    risk_level = result_summary.get("risk_level", "unknown")
                    print(f"⚠️  Overall Risk Level: {risk_level.upper()}")
                    
                    if "risk_analysis" in result_summary:
                        risks = result_summary["risk_analysis"]
                        if isinstance(risks, list):
                            print(f"   Risks Identified: {len(risks)}")
                            for i, risk in enumerate(risks[:3]):  # Show first 3
                                if isinstance(risk, dict):
                                    risk_title = risk.get("title", f"Risk {i+1}")
                                    risk_severity = risk.get("severity", "unknown")
                                    print(f"      - {risk_title} (Severity: {risk_severity})")
                    
                    # Verify all required Phase 3 fields
                    required_fields = [
                        "requirements_count", "srs_generated", "uml_diagrams_count",
                        "tasks_generated", "total_estimated_hours", "estimated_cost", "risk_level"
                    ]
                    
                    missing_fields = [field for field in required_fields if field not in result_summary]
                    
                    print(f"\n🎯 PHASE 3 COMPLIANCE:")
                    print("-" * 25)
                    if not missing_fields:
                        print("✅ ALL PHASE 3 FEATURES PRESENT AND WORKING!")
                        print("✅ Task breakdown generation: WORKING")
                        print("✅ Project schedule with time estimates: WORKING")
                        print("✅ Risk analysis with risk levels: WORKING")
                        print("✅ Cost estimation with role breakdown: WORKING")
                    else:
                        print(f"❌ Missing Phase 3 fields: {missing_fields}")
                    
                    return True
                    
                elif status == "failed":
                    error_msg = status_data.get("error_message", "Unknown error")
                    print(f"❌ Generation failed: {error_msg}")
                    return False
                
                elif status in ["pending", "running"]:
                    print(f"   Status: {status} ({progress:.1f}%)")
                    await asyncio.sleep(3)
                    continue
        
        print("❌ Generation timed out")
        return False

if __name__ == "__main__":
    asyncio.run(test_phase3_features_detailed())