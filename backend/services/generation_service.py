"""AI generation service."""

import asyncio
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, status

from models.generation import GenerationRequest, GenerationResponse, JobStatus
from models.user import User
from models.requirement import RequirementType, RequirementPriority
from repositories.project_repository import ProjectRepository
from repositories.generation_repository import GenerationRepository
from repositories.requirement_repository import RequirementRepository
from repositories.task_repository import TaskRepository
from repositories.artifact_repository import ArtifactRepository
from services.llm_client import LLMClient
from services.srs_generator import SRSGenerator
from services.uml_generator import UMLGenerator
from services.task_planner import TaskPlanner
from services.risk_analyzer import RiskAnalyzer
from services.cost_estimator import CostEstimator
from services.plantuml_service import build_plantuml_image_url


class GenerationService:
    """Service for AI generation logic."""
    
    def __init__(self):
        self.project_repo = ProjectRepository()
        self.generation_repo = GenerationRepository()
        self.requirement_repo = RequirementRepository()
        self.task_repo = TaskRepository()
        self.artifact_repo = ArtifactRepository()
        self.llm_client = LLMClient()
        self.srs_generator = SRSGenerator()
        self.uml_generator = UMLGenerator()
        self.task_planner = TaskPlanner()
        self.risk_analyzer = RiskAnalyzer()
        self.cost_estimator = CostEstimator()
    
    async def start_generation(self, request: GenerationRequest, current_user: User) -> GenerationResponse:
        """Start AI generation process."""
        # Verify project exists
        project = await self.project_repo.get_by_id(request.project_id, current_user.organization)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Create generation job
        job = await self.generation_repo.create(request.project_id, current_user.id)
        
        # Start generation in background
        asyncio.create_task(self._execute_generation(job.id, project, request))
        
        return GenerationResponse(
            job_id=job.id,
            status=job.status,
            progress=job.progress,
            result_summary=job.result_summary,
            error_message=job.error_message,
        )
    
    async def get_job_status(self, job_id: str, current_user: User) -> GenerationResponse:
        """Get generation job status."""
        job = await self.generation_repo.get_by_id(job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        return GenerationResponse(
            job_id=job.id,
            status=job.status,
            progress=job.progress,
            result_summary=job.result_summary,
            error_message=job.error_message,
        )
    
    async def _execute_generation(self, job_id: str, project, request: GenerationRequest):
        """Execute the generation workflow."""
        try:
            # Update status to running
            await self.generation_repo.update_status(job_id, JobStatus.RUNNING, progress=0.1)
            
            regenerate_requirements = request.regenerate_requirements
            include_uml = request.include_uml
            include_tasks = request.include_tasks
            generate_srs = request.generate_srs
            generate_risks = request.generate_risks
            generate_costs = request.generate_costs
            requested_uml_types = [t for t in (request.uml_types or []) if t in {"use_case", "class_diagram", "sequence"}]

            # Step 1: Extract or reuse requirements
            await self.generation_repo.update_status(job_id, JobStatus.RUNNING, progress=0.3)
            if regenerate_requirements:
                requirements = await self._extract_requirements(project)
            else:
                requirements = await self.requirement_repo.list_by_project(project.id)
                if not requirements:
                    requirements = await self._extract_requirements(project)
            saved_tasks: List[Dict[str, Any]] = []
            
            # Step 2: Generate SRS (if needed)
            srs_generated = None
            if generate_srs and requirements:
                await self.generation_repo.update_status(job_id, JobStatus.RUNNING, progress=0.5)
                project_dict = {
                    'name': project.name,
                    'description': project.description,
                    'template_type': project.template_type,
                    'brief_text': project.brief_text
                }
                requirements_dict = [self._serialize_requirement(r) for r in requirements]
                srs_generated = await self.srs_generator.generate_complete_srs(project_dict, requirements_dict)
                if srs_generated:
                    await self._save_artifact(
                        project.id,
                        "SRS",
                        f"SRS - {project.name}",
                        srs_generated
                    )
            
            # Step 3: Generate UML (if requested)
            uml_diagrams = {}
            if include_uml and requirements:
                await self.generation_repo.update_status(job_id, JobStatus.RUNNING, progress=0.6)
                project_dict = {'name': project.name}
                requirements_dict = [
                    {
                        'title': r.title,
                        'description': r.description,
                        'type': self._requirement_type_str(r),
                    }
                    for r in requirements
                ]
                uml_types = requested_uml_types or ["use_case", "class_diagram"]
                if "use_case" in uml_types:
                    uml_diagrams['use_case'] = await self.uml_generator.generate_use_case_diagram(requirements_dict, project.name)
                if "class_diagram" in uml_types:
                    uml_diagrams['class_diagram'] = await self.uml_generator.generate_class_diagram(requirements_dict, project.name)
                if "sequence" in uml_types:
                    uml_diagrams['sequence'] = await self.uml_generator.generate_sequence_diagram(requirements_dict, project.name)
                for diagram_type, content in uml_diagrams.items():
                    await self._save_artifact(
                        project.id,
                        f"uml_{diagram_type}",
                        f"{diagram_type.replace('_', ' ').title()} Diagram",
                        {"plantuml": content}
                    )
            
            # Step 4: Generate Task Plan (if requested)
            task_plan = None
            if include_tasks and requirements:
                await self.generation_repo.update_status(job_id, JobStatus.RUNNING, progress=0.75)
                project_dict = {
                    'name': project.name,
                    'template_type': project.template_type,
                    'description': project.description
                }
                requirements_dict = [self._serialize_requirement(r) for r in requirements]
                tasks = await self.task_planner.generate_task_breakdown(requirements_dict, project_dict)
                schedule = await self.task_planner.generate_project_schedule(tasks)
                task_plan = {
                    'tasks': tasks,
                    'schedule': schedule
                }
                saved_tasks = await self._persist_tasks(project.id, tasks, requirements)
            
            # Step 5: Risk Analysis
            risk_analysis = {}
            if generate_risks and requirements:
                await self.generation_repo.update_status(job_id, JobStatus.RUNNING, progress=0.85)
                project_dict = {
                    'name': project.name,
                    'template_type': project.template_type,
                    'description': project.description
                }
                requirements_dict = [self._serialize_requirement(r) for r in requirements]
                risk_analysis = await self.risk_analyzer.analyze_project_risks(project_dict, requirements_dict)
            
            # Step 6: Cost Estimation
            cost_estimate = None
            if generate_costs and task_plan:
                await self.generation_repo.update_status(job_id, JobStatus.RUNNING, progress=0.95)
                cost_estimate = self.cost_estimator.estimate_project_cost(
                    task_plan['tasks'],
                    task_plan['schedule']
                )
            
            # Complete
            result_summary = {
                "requirements_count": len(requirements),
                "srs_generated": srs_generated is not None,
                "uml_diagrams_count": len(uml_diagrams),
                "tasks_generated": len(saved_tasks),
                "total_estimated_hours": task_plan['schedule']['total_hours'] if task_plan and task_plan.get('schedule') else 0,
                "estimated_cost": cost_estimate['total_estimated_cost'] if cost_estimate else 0,
                "risk_level": risk_analysis.get('overall_risk_level', 'not_run') if risk_analysis else "not_run",
                "status": "completed"
            }
            await self.generation_repo.update_status(
                job_id,
                JobStatus.COMPLETED,
                progress=1.0,
                result_summary=result_summary
            )
            
        except Exception as e:
            await self.generation_repo.update_status(
                job_id,
                JobStatus.FAILED,
                error_message=str(e)
            )
    
    async def _extract_requirements(self, project) -> list:
        """Extract requirements using LLM."""
        # Build prompt
        prompt = f"""Extract software requirements from the following project brief:

Project: {project.name}
Description: {project.description}
Brief: {project.brief_text or 'No detailed brief provided'}

Generate a list of functional and non-functional requirements."""
        
        # Call LLM
        llm_response = await self.llm_client.extract_requirements(prompt)
        
        # Parse and save requirements
        requirements_data = []
        for req in llm_response:
            requirements_data.append({
                "project_id": project.id,
                "type": req.get("type", RequirementType.FUNCTIONAL),
                "title": req["title"],
                "description": req["description"],
                "priority": req.get("priority", RequirementPriority.MEDIUM),
                "status": "proposed",
                "confidence_score": req.get("confidence_score"),
                "source_metadata": {},
            })
        
        # Bulk create requirements
        if requirements_data:
            requirements = await self.requirement_repo.replace_project_requirements(project.id, requirements_data)
            return requirements
        
        return []

    async def _persist_tasks(self, project_id: str, tasks: list, requirements: list):
        """Store generated tasks and associate them to requirements."""
        if not tasks:
            return []

        requirement_lookup = {req.title.lower(): req.id for req in requirements}
        prepared_tasks = []
        for task in tasks:
            req_title = (task.get("requirement_title") or "").lower()
            prepared_tasks.append({
                "requirement_id": requirement_lookup.get(req_title),
                "title": task.get("title", "Task"),
                "description": task.get("description", ""),
                "estimate_hours": task.get("estimate_hours", 0),
                "actual_hours": task.get("actual_hours", 0),
                "status": task.get("status", "planned"),
                "priority": task.get("priority", "medium"),
                "dependencies": task.get("dependencies", []) or [],
                "tags": task.get("tags", []) or [],
                "phase": task.get("phase"),
            })

        return await self.task_repo.replace_project_tasks(project_id, prepared_tasks)

    async def _save_artifact(
        self,
        project_id: str,
        artifact_type: str,
        title: str,
        content_json: dict,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """Store or update a project artifact."""
        payload = content_json if isinstance(content_json, dict) else {"content": content_json}
        metadata = metadata.copy() if metadata else {}
        plantuml_code = payload.get("plantuml")
        if plantuml_code:
            metadata.setdefault("plantuml_svg_url", build_plantuml_image_url(plantuml_code))
        await self.artifact_repo.upsert_artifact(
            project_id,
            artifact_type,
            title,
            payload,
            metadata=metadata,
        )

    def _serialize_requirement(self, requirement) -> Dict[str, Any]:
        return {
            "title": requirement.title,
            "description": requirement.description,
            "type": self._requirement_type_str(requirement),
            "priority": self._requirement_priority_str(requirement),
        }

    def _requirement_type_str(self, requirement) -> str:
        req_type = getattr(requirement, "type", RequirementType.FUNCTIONAL)
        return req_type.value if hasattr(req_type, "value") else str(req_type)

    def _requirement_priority_str(self, requirement) -> str:
        priority = getattr(requirement, "priority", RequirementPriority.MEDIUM)
        return priority.value if hasattr(priority, "value") else str(priority)
