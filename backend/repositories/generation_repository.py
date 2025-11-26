"""Generation job repository."""

from typing import Optional, List
from database import get_db
from models.generation import GenerationJob, JobStatus
from datetime import datetime


class GenerationRepository:
    """Repository for generation job data access."""
    
    def __init__(self):
        self.collection_name = "generation_jobs"
    
    async def create(self, project_id: str, user_id: str) -> GenerationJob:
        """Create a new generation job."""
        db = get_db()
        
        job_doc = {
            "_id": f"job_{str(datetime.utcnow().timestamp()).replace('.', '')}",
            "project_id": project_id,
            "user_id": user_id,
            "status": JobStatus.PENDING,
            "progress": 0.0,
            "result_summary": None,
            "error_message": None,
            "created_at": datetime.utcnow(),
            "completed_at": None,
        }
        
        await db[self.collection_name].insert_one(job_doc)
        return GenerationJob(**job_doc)
    
    async def get_by_id(self, job_id: str) -> Optional[GenerationJob]:
        """Get job by ID."""
        db = get_db()
        job_doc = await db[self.collection_name].find_one({"_id": job_id})
        if job_doc:
            return GenerationJob(**job_doc)
        return None
    
    async def update_status(self, job_id: str, status: JobStatus, progress: float = None, 
                          error_message: str = None, result_summary: dict = None) -> Optional[GenerationJob]:
        """Update job status."""
        db = get_db()
        
        update_doc = {"status": status}
        if progress is not None:
            update_doc["progress"] = progress
        if error_message is not None:
            update_doc["error_message"] = error_message
        if result_summary is not None:
            update_doc["result_summary"] = result_summary
        if status in [JobStatus.COMPLETED, JobStatus.FAILED]:
            update_doc["completed_at"] = datetime.utcnow()
        
        result = await db[self.collection_name].find_one_and_update(
            {"_id": job_id},
            {"$set": update_doc},
            return_document=True
        )
        
        if result:
            return GenerationJob(**result)
        return None
    
    async def list_by_project(self, project_id: str) -> List[GenerationJob]:
        """List jobs by project."""
        db = get_db()
        cursor = db[self.collection_name].find({"project_id": project_id}).sort("created_at", -1)
        
        jobs = []
        async for doc in cursor:
            jobs.append(GenerationJob(**doc))
        return jobs
