"""Template library service."""

import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime

from models.template import Template, TemplateCreate, BriefTemplate, TemplateRating


class TemplateService:
    """Service for template library and brief builder."""
    
    async def create_template(
        self,
        template_data: TemplateCreate,
        created_by_name: str
    ) -> Dict[str, Any]:
        """Create a new template."""
        
        template = {
            "id": str(uuid.uuid4()),
            "name": template_data.name,
            "description": template_data.description,
            "category": template_data.category,
            "industry": template_data.industry,
            "tags": template_data.tags,
            "created_by": template_data.created_by,
            "created_by_name": created_by_name,
            "content": template_data.content,
            "is_public": template_data.is_public,
            "usage_count": 0,
            "rating": 0.0,
            "rating_count": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        return template
    
    async def get_templates(
        self,
        category: Optional[str] = None,
        industry: Optional[str] = None,
        tags: Optional[List[str]] = None,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get templates with filters."""
        
        # This would query the database
        # Return sample templates for now
        return self._get_sample_templates()
    
    def _get_sample_templates(self) -> List[Dict[str, Any]]:
        """Get sample templates."""
        
        return [
            {
                "id": str(uuid.uuid4()),
                "name": "E-commerce Platform SRS",
                "description": "Complete SRS template for e-commerce applications",
                "category": "srs",
                "industry": "retail",
                "tags": ["ecommerce", "retail", "web"],
                "created_by": "system",
                "created_by_name": "Acorn System",
                "content": {
                    "sections": [
                        "Introduction",
                        "User Requirements",
                        "System Requirements",
                        "Security Requirements",
                        "Performance Requirements"
                    ]
                },
                "is_public": True,
                "usage_count": 150,
                "rating": 4.5,
                "rating_count": 30,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Mobile App Requirements",
                "description": "Template for mobile application requirements",
                "category": "requirements",
                "industry": "technology",
                "tags": ["mobile", "ios", "android"],
                "created_by": "system",
                "created_by_name": "Acorn System",
                "content": {
                    "sections": [
                        "App Overview",
                        "User Stories",
                        "UI/UX Requirements",
                        "Technical Requirements",
                        "Platform Compatibility"
                    ]
                },
                "is_public": True,
                "usage_count": 200,
                "rating": 4.7,
                "rating_count": 45,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "SaaS Product Brief",
                "description": "Brief template for SaaS products",
                "category": "brief",
                "industry": "saas",
                "tags": ["saas", "cloud", "subscription"],
                "created_by": "system",
                "created_by_name": "Acorn System",
                "content": {
                    "sections": [
                        "Product Vision",
                        "Target Market",
                        "Key Features",
                        "Business Model",
                        "Success Metrics"
                    ]
                },
                "is_public": True,
                "usage_count": 180,
                "rating": 4.6,
                "rating_count": 38,
                "created_at": datetime.utcnow()
            }
        ]
    
    async def use_template(
        self,
        template_id: str,
        project_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Apply template to a project."""
        
        return {
            "template_id": template_id,
            "project_id": project_id,
            "applied_by": user_id,
            "applied_at": datetime.utcnow()
        }
    
    async def rate_template(
        self,
        template_id: str,
        user_id: str,
        rating: int,
        review: Optional[str] = None
    ) -> Dict[str, Any]:
        """Rate a template."""
        
        rating_record = {
            "template_id": template_id,
            "user_id": user_id,
            "rating": rating,
            "review": review,
            "created_at": datetime.utcnow()
        }
        
        return rating_record
    
    async def get_brief_templates(self) -> List[Dict[str, Any]]:
        """Get brief builder templates."""
        
        return [
            {
                "id": str(uuid.uuid4()),
                "name": "Standard Project Brief",
                "description": "General purpose project brief template",
                "sections": [
                    {
                        "title": "Project Overview",
                        "prompts": [
                            "What problem does this project solve?",
                            "Who are the primary users?",
                            "What are the key objectives?"
                        ]
                    },
                    {
                        "title": "Scope",
                        "prompts": [
                            "What features are in scope?",
                            "What features are out of scope?",
                            "What are the constraints?"
                        ]
                    },
                    {
                        "title": "Success Criteria",
                        "prompts": [
                            "How will success be measured?",
                            "What are the key metrics?",
                            "What are the acceptance criteria?"
                        ]
                    }
                ],
                "example_content": "Example: Build a task management app for remote teams...",
                "created_at": datetime.utcnow()
            }
        ]
