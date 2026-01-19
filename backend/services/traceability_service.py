"""Requirement traceability service."""

import uuid
from typing import List, Dict, Any
from datetime import datetime

from models.traceability import TraceabilityLink, TraceabilityMatrix, CoverageReport


class TraceabilityService:
    """Service for requirement traceability."""
    
    async def create_link(
        self,
        project_id: str,
        source_type: str,
        source_id: str,
        source_name: str,
        target_type: str,
        target_id: str,
        target_name: str,
        link_type: str,
        created_by: str,
        rationale: str = None
    ) -> Dict[str, Any]:
        """Create a traceability link."""
        
        link = {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "source_type": source_type,
            "source_id": source_id,
            "source_name": source_name,
            "target_type": target_type,
            "target_id": target_id,
            "target_name": target_name,
            "link_type": link_type,
            "rationale": rationale,
            "created_by": created_by,
            "created_at": datetime.utcnow()
        }
        
        return link
    
    async def generate_matrix(
        self,
        project_id: str,
        requirements: List[Dict[str, Any]],
        tasks: List[Dict[str, Any]],
        links: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate traceability matrix."""
        
        # Build link index
        req_to_tasks = {}
        task_to_reqs = {}
        
        for link in links:
            if link['source_type'] == 'requirement' and link['target_type'] == 'task':
                if link['source_id'] not in req_to_tasks:
                    req_to_tasks[link['source_id']] = []
                req_to_tasks[link['source_id']].append(link['target_id'])
                
                if link['target_id'] not in task_to_reqs:
                    task_to_reqs[link['target_id']] = []
                task_to_reqs[link['target_id']].append(link['source_id'])
        
        # Find orphaned items
        orphaned_requirements = [
            req['id'] for req in requirements 
            if req['id'] not in req_to_tasks
        ]
        
        orphaned_tasks = [
            task['id'] for task in tasks 
            if task['id'] not in task_to_reqs
        ]
        
        # Calculate coverage
        covered_reqs = len([r for r in requirements if r['id'] in req_to_tasks])
        total_reqs = len(requirements)
        coverage_percentage = (covered_reqs / total_reqs * 100) if total_reqs > 0 else 0
        
        matrix = {
            "project_id": project_id,
            "requirements": requirements,
            "tasks": tasks,
            "links": links,
            "coverage_percentage": round(coverage_percentage, 2),
            "orphaned_requirements": orphaned_requirements,
            "orphaned_tasks": orphaned_tasks,
            "generated_at": datetime.utcnow()
        }
        
        return matrix
    
    async def generate_coverage_report(
        self,
        project_id: str,
        requirements: List[Dict[str, Any]],
        tasks: List[Dict[str, Any]],
        links: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate coverage report."""
        
        # Build link index
        req_to_tasks = {}
        task_to_reqs = {}
        
        for link in links:
            if link['source_type'] == 'requirement' and link['target_type'] == 'task':
                if link['source_id'] not in req_to_tasks:
                    req_to_tasks[link['source_id']] = []
                req_to_tasks[link['source_id']].append(link['target_id'])
                
                if link['target_id'] not in task_to_reqs:
                    task_to_reqs[link['target_id']] = []
                task_to_reqs[link['target_id']].append(link['source_id'])
        
        # Calculate coverage
        covered_requirements = [r for r in requirements if r['id'] in req_to_tasks]
        uncovered_requirements = [r for r in requirements if r['id'] not in req_to_tasks]
        
        total_requirements = len(requirements)
        covered_count = len(covered_requirements)
        coverage_percentage = (covered_count / total_requirements * 100) if total_requirements > 0 else 0
        
        # Find requirements without tasks
        requirements_without_tasks = [
            {
                "id": req['id'],
                "title": req.get('title', 'Untitled'),
                "type": req.get('type', 'Unknown'),
                "priority": req.get('priority', 'medium')
            }
            for req in requirements if req['id'] not in req_to_tasks
        ]
        
        # Find tasks without requirements
        tasks_without_requirements = [
            {
                "id": task['id'],
                "title": task.get('title', 'Untitled'),
                "status": task.get('status', 'Unknown')
            }
            for task in tasks if task['id'] not in task_to_reqs
        ]
        
        report = {
            "project_id": project_id,
            "total_requirements": total_requirements,
            "covered_requirements": covered_count,
            "coverage_percentage": round(coverage_percentage, 2),
            "uncovered_requirements": [
                {
                    "id": req['id'],
                    "title": req.get('title', 'Untitled'),
                    "type": req.get('type', 'Unknown')
                }
                for req in uncovered_requirements
            ],
            "requirements_without_tasks": requirements_without_tasks,
            "tasks_without_requirements": tasks_without_requirements,
            "generated_at": datetime.utcnow()
        }
        
        return report
    
    async def auto_link_requirements_to_tasks(
        self,
        project_id: str,
        requirements: List[Dict[str, Any]],
        tasks: List[Dict[str, Any]],
        created_by: str
    ) -> List[Dict[str, Any]]:
        """Automatically suggest links between requirements and tasks."""
        
        suggested_links = []
        
        # Simple keyword matching
        for req in requirements:
            req_title = req.get('title', '').lower()
            req_desc = req.get('description', '').lower()
            
            for task in tasks:
                task_title = task.get('title', '').lower()
                task_desc = task.get('description', '').lower()
                
                # Check for keyword overlap
                req_words = set(req_title.split() + req_desc.split())
                task_words = set(task_title.split() + task_desc.split())
                
                overlap = req_words.intersection(task_words)
                
                # If significant overlap, suggest link
                if len(overlap) >= 3:
                    link = await self.create_link(
                        project_id=project_id,
                        source_type="requirement",
                        source_id=req['id'],
                        source_name=req.get('title', 'Untitled'),
                        target_type="task",
                        target_id=task['id'],
                        target_name=task.get('title', 'Untitled'),
                        link_type="implements",
                        created_by=created_by,
                        rationale="Auto-suggested based on keyword matching"
                    )
                    suggested_links.append(link)
        
        return suggested_links
