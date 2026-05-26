"""Service for parsing validated plans and generating code scaffolds."""

import time
import uuid
import json
import logging
from typing import List
from datetime import datetime, timezone

from fastapi import HTTPException

from models.scaffolding import ScaffoldRequest, ScaffoldResult, ScaffoldFile
from services.ai_pipeline_service import ai_pipeline, TaskType
from database import get_db

logger = logging.getLogger(__name__)


class ScaffoldingService:
    def __init__(self):
        pass

    def _get_pool(self):
        return get_db()

    async def _collect_project_data(self, project_id: str) -> str:
        """Collect all relevant architectural data for the project."""
        pool = self._get_pool()
        async with pool.acquire() as conn:
            project = await conn.fetchrow(
                "SELECT name, description FROM projects WHERE id = $1", project_id
            )
            if not project:
                raise ValueError("Project not found")

            context = f"# Project: {project['name']}\n"
            context += f"Description: {project['description'] or 'None'}\n\n"

            artifacts = await conn.fetch(
                "SELECT type, content_json FROM artifacts WHERE project_id = $1 AND type IN ('system_design','development','architecture')",
                project_id
            )
            for art in artifacts:
                if art['content_json']:
                    context += f"## {art['type'].replace('_', ' ').title()}\n"
                    context += json.dumps(art['content_json'], indent=2, default=str) + "\n\n"

        return context

    def _build_scaffold_prompt(self, context: str, request: ScaffoldRequest) -> str:
        prompt = """You are an EXPERT LEAD SOFTWARE ENGINEER.
Your task is to generate a comprehensive, production-ready code scaffold for the requested software project.
You must read the project context, define a professional folder structure, and write the core boilerplate files.

Project Context:
"""
        prompt += context

        target_stack = f" (Target: {request.target_stack})" if request.target_stack else ""

        prompt += f"""
Constraints and Requirements:
1. Target Stack: Based on the Technical Stack provided above{target_stack}.
2. Completeness: Include all standard configuration files (e.g., package.json, requirements.txt, tsconfig.json, docker-compose.yml).
3. Routing/Models: Create stub files for the primary routes, controllers, and data models mentioned in the project context.
4. Scale: Target an architecture suitable for a "{request.project_tier}" level application.
"""
        if request.include_tests:
            prompt += "5. Tests: Include boilerplate for testing (e.g., pytest, jest) covering at least one model or endpoint.\n"
        if request.include_docker:
            prompt += "6. Docker: Provide Dockerfile and docker-compose.yml for easy local development.\n"

        prompt += """
Respond with ONLY valid JSON in this exact structure (no markdown text outside the JSON):
{
  "setup_instructions": "<Markdown formatted detailed instructions on how to install and run the generated project>",
  "tree_visualization": "<ASCII breakdown of the directory structure generated>",
  "files": [
    {
      "path": "<Unix-style path, e.g., 'backend/src/main.py' or 'frontend/package.json'>",
      "language": "<language identifier, e.g., 'python', 'typescript', 'json', 'yaml'>",
      "description": "<What this file does>",
      "content": "<The full string content of the file>"
    }
  ]
}
"""
        return prompt

    async def generate_scaffold(self, project_id: str, user_id: str, request: ScaffoldRequest) -> ScaffoldResult:
        """Main orchestrator for generating project code."""
        start_time = time.time()

        try:
            context = await self._collect_project_data(project_id)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

        prompt = self._build_scaffold_prompt(context, request)

        logger.info(f"Generating code scaffold for project {project_id}")
        result = await ai_pipeline.generate_with_best_model(
            prompt=prompt,
            task_type=TaskType.CODE_SCAFFOLDING
        )

        try:
            if isinstance(result.content, dict):
                resp_json = result.content
            else:
                import re
                raw_text = str(result.content or "{}")
                clean_text = re.sub(r'```(?:json)?|```', '', raw_text).strip()
                resp_json = json.loads(clean_text)

            files = [
                ScaffoldFile(
                    path=f.get("path", "unnamed.txt"),
                    language=f.get("language", "text"),
                    description=f.get("description", ""),
                    content=f.get("content", "")
                )
                for f in resp_json.get("files", [])
            ]

            scaffold = ScaffoldResult(
                id=str(uuid.uuid4()),
                project_id=project_id,
                target_stack=request.target_stack or "Derived from Project Context",
                files=files,
                setup_instructions=resp_json.get("setup_instructions", "No instructions provided."),
                tree_visualization=resp_json.get("tree_visualization", "No tree provided."),
                created_by=user_id,
                duration_ms=int((time.time() - start_time) * 1000),
                tokens_used=result.tokens_used
            )

            scaffold_dict = scaffold.dict()
            if 'created_at' in scaffold_dict and isinstance(scaffold_dict['created_at'], datetime):
                scaffold_dict['created_at'] = scaffold_dict['created_at'].isoformat()

            pool = self._get_pool()
            async with pool.acquire() as conn:
                await conn.execute(
                    """INSERT INTO artifacts (id, project_id, type, title, content_json, created_at, updated_at)
                       VALUES ($1, $2, 'scaffold', $3, $4, NOW(), NOW())
                       ON CONFLICT (id) DO NOTHING""",
                    scaffold.id,
                    project_id,
                    f"{scaffold.target_stack} scaffold",
                    json.dumps(scaffold_dict)
                )

            return scaffold

        except Exception as e:
            logger.error(f"Failed to parse scaffolding result: {e}")
            raise HTTPException(status_code=500, detail="AI returned malformed scaffolding structure.")

    async def get_scaffolds(self, project_id: str) -> List[ScaffoldResult]:
        """Retrieve all past generated scaffolds for a project."""
        pool = self._get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT content_json FROM artifacts WHERE project_id = $1 AND type = 'scaffold' ORDER BY created_at DESC",
                project_id
            )

        results = []
        for row in rows:
            try:
                raw = row['content_json']
                if isinstance(raw, str):
                    s_dict = json.loads(raw)
                else:
                    s_dict = dict(raw)
                if 'created_at' in s_dict and isinstance(s_dict['created_at'], str):
                    try:
                        s_dict['created_at'] = datetime.fromisoformat(s_dict['created_at'].replace('Z', '+00:00'))
                    except ValueError:
                        pass
                results.append(ScaffoldResult(**s_dict))
            except Exception as e:
                logger.error(f"Parse error for scaffold row: {e}")

        return results
