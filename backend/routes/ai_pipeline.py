"""AI Pipeline routes for multi-model management."""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from services.ai_pipeline_service import ai_pipeline, TaskType, ModelProvider
from services.plan_limits import enforce_and_record_ai_run
from repositories.ai_run_repository import AiRunRepository
from routes.auth import get_current_user
from models.user import User

router = APIRouter()
ai_run_repo = AiRunRepository()


class GenerationRequest(BaseModel):
    """Request for AI generation."""
    task_type: TaskType
    prompt: str
    context: Optional[Dict[str, Any]] = None
    preferred_models: Optional[List[str]] = None


class ModelComparisonRequest(BaseModel):
    """Request for model comparison."""
    task_type: TaskType
    prompt: str
    context: Optional[Dict[str, Any]] = None
    models_to_compare: Optional[List[str]] = None


@router.post("/generate")
async def generate_content(
    request: GenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate content using the best available model."""
    await enforce_and_record_ai_run(
        current_user,
        ai_run_repo,
        project_id=None,
        job_type=f"pipeline_generate:{request.task_type}",
    )
    try:
        result = await ai_pipeline.generate_with_best_model(
            task_type=request.task_type,
            prompt=request.prompt,
            context=request.context or {}
        )
        
        return {
            "success": True,
            "result": {
                "content": result.content,
                "provider": result.provider,
                "model_name": result.model_name,
                "tokens_used": result.tokens_used,
                "duration_ms": result.duration_ms,
                "cost_usd": result.cost_usd,
                "quality_score": result.quality_score,
                "error": result.error
            },
            "metadata": {
                "task_type": request.task_type,
                "user_id": current_user.id
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.post("/compare-models")
async def compare_models(
    request: ModelComparisonRequest,
    current_user: User = Depends(get_current_user)
):
    """Compare multiple models on the same task."""
    await enforce_and_record_ai_run(
        current_user,
        ai_run_repo,
        project_id=None,
        job_type=f"pipeline_compare:{request.task_type}",
    )
    try:
        results = await ai_pipeline.compare_models(
            task_type=request.task_type,
            prompt=request.prompt,
            context=request.context or {},
            models_to_compare=request.models_to_compare
        )
        
        comparison_data = {}
        for model_key, result in results.items():
            comparison_data[model_key] = {
                "content": result.content,
                "provider": result.provider,
                "model_name": result.model_name,
                "tokens_used": result.tokens_used,
                "duration_ms": result.duration_ms,
                "cost_usd": result.cost_usd,
                "quality_score": result.quality_score,
                "error": result.error
            }
        
        return {
            "success": True,
            "comparison": comparison_data,
            "metadata": {
                "task_type": request.task_type,
                "models_compared": len(comparison_data),
                "user_id": current_user.id
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model comparison failed: {str(e)}")


@router.get("/models")
async def get_available_models(
    current_user: User = Depends(get_current_user)
):
    """Get list of available AI models and their configurations."""
    
    models_info = {}
    
    for model_key, config in ai_pipeline.models.items():
        models_info[model_key] = {
            "provider": config.provider,
            "model_name": config.model_name,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "cost_per_token": config.cost_per_token,
            "quality_score": config.quality_score,
            "specialties": [specialty.value for specialty in (config.specialties or [])],
            "is_available": config.api_key is not None or config.provider == ModelProvider.STUB
        }
    
    return {
        "models": models_info,
        "total_models": len(models_info),
        "available_models": len([m for m in models_info.values() if m["is_available"]])
    }


@router.get("/performance-stats")
async def get_performance_stats(
    current_user: User = Depends(get_current_user)
):
    """Get AI pipeline performance statistics."""
    
    try:
        stats = await ai_pipeline.get_model_performance_stats()
        
        # Calculate summary statistics
        total_requests = 0
        total_cost = 0.0
        
        for model_stats in stats.values():
            for task_stats in model_stats.get("tasks", {}).values():
                total_requests += task_stats.get("total_requests", 0)
                total_cost += (
                    task_stats.get("average_cost_usd", 0) * 
                    task_stats.get("total_requests", 0)
                )
        
        return {
            "detailed_stats": stats,
            "summary": {
                "total_requests": total_requests,
                "total_cost_usd": total_cost,
                "models_tracked": len(stats),
                "task_types": len(TaskType)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.get("/task-routing")
async def get_task_routing(
    current_user: User = Depends(get_current_user)
):
    """Get current task routing configuration."""
    
    routing_info = {}
    
    for task_type, models in ai_pipeline.task_routing.items():
        routing_info[task_type.value] = {
            "preferred_models": models,
            "model_details": [
                {
                    "model_key": model_key,
                    "provider": ai_pipeline.models[model_key].provider,
                    "quality_score": ai_pipeline.models[model_key].quality_score
                }
                for model_key in models if model_key in ai_pipeline.models
            ]
        }
    
    return {
        "routing": routing_info,
        "total_tasks": len(routing_info)
    }


@router.post("/tasks/{task_type}/generate")
async def generate_for_task(
    task_type: TaskType,
    prompt: str,
    context: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_user)
):
    """Generate content for a specific task type."""
    await enforce_and_record_ai_run(
        current_user,
        ai_run_repo,
        project_id=None,
        job_type=f"pipeline_task:{task_type}",
    )
    try:
        result = await ai_pipeline.generate_with_best_model(
            task_type=task_type,
            prompt=prompt,
            context=context or {}
        )
        
        return {
            "success": True,
            "task_type": task_type,
            "content": result.content,
            "model_info": {
                "provider": result.provider,
                "model_name": result.model_name,
                "tokens_used": result.tokens_used,
                "duration_ms": result.duration_ms,
                "cost_usd": result.cost_usd,
                "quality_score": result.quality_score
            },
            "error": result.error
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task generation failed: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check for AI pipeline."""
    
    try:
        # Test stub model (should always work)
        test_result = await ai_pipeline.generate_with_best_model(
            task_type=TaskType.REQUIREMENTS_EXTRACTION,
            prompt="Test prompt for health check",
            context={}
        )
        
        return {
            "status": "healthy",
            "models_available": len(ai_pipeline.models),
            "test_generation": {
                "success": test_result.error is None,
                "duration_ms": test_result.duration_ms,
                "model_used": test_result.model_name
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")
