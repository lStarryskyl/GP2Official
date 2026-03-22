"""Task repository."""

import json
from typing import List, Optional
from datetime import datetime
from database import get_db
from models.task import Task


def _get_repository():
    """Get the appropriate repository based on pool availability."""
    try:
        from database import pool
        if pool is not None:
            return _SupabaseTaskRepository()
    except ImportError:
        pass
    return _MongoTaskRepository()


class TaskRepository:
    """Data access for task documents - delegates to appropriate backend."""

    def __init__(self):
        self._cached_repo = None

    @property
    def _repo(self):
        """Lazy repository getter - checks pool availability at call time."""
        if self._cached_repo is None:
            self._cached_repo = _get_repository()
        return self._cached_repo

    async def replace_project_tasks(self, project_id: str, tasks_data: List[dict]) -> List[Task]:
        return await self._repo.replace_project_tasks(project_id, tasks_data)

    async def list_by_project(self, project_id: str) -> List[Task]:
        return await self._repo.list_by_project(project_id)

    async def get_by_id(self, task_id: str) -> Optional[Task]:
        return await self._repo.get_by_id(task_id)

    async def update_task(self, task_id: str, updates: dict) -> Optional[Task]:
        return await self._repo.update_task(task_id, updates)

    async def create_task(self, project_id: str, data: dict) -> Task:
        return await self._repo.create_task(project_id, data)

    async def list_by_projects(self, project_ids: List[str]) -> List[Task]:
        return await self._repo.list_by_projects(project_ids)

    async def clone_project_tasks(self, source_project_id: str, target_project_id: str) -> List[Task]:
        return await self._repo.clone_project_tasks(source_project_id, target_project_id)


class _SupabaseTaskRepository:
    """PostgreSQL implementation."""

    def _get_pool(self):
        from database import pool
        if pool is None:
            raise Exception("Database pool not initialized. Is DATABASE_URL set?")
        return pool

    def _row_to_task(self, row) -> Task:
        """Convert database row to Task model."""
        data = dict(row)
        # Parse JSON fields
        for field in ['dependencies', 'tags']:
            if isinstance(data.get(field), str):
                try:
                    data[field] = json.loads(data[field])
                except (json.JSONDecodeError, TypeError):
                    data[field] = []
        return Task(**data)

    async def replace_project_tasks(self, project_id: str, tasks_data: List[dict]) -> List[Task]:
        """Replace all tasks for a project with generated tasks."""
        pool = self._get_pool()
        now = datetime.utcnow()
        
        async with pool.acquire() as conn:
            # Delete existing tasks
            await conn.execute('DELETE FROM tasks WHERE project_id = $1', project_id)
            
            created = []
            for idx, task in enumerate(tasks_data):
                task_id = task.get("_id") or task.get("id") or f"task_{str(now.timestamp()).replace('.', '')}_{idx}"
                
                row = await conn.fetchrow('''
                    INSERT INTO tasks (id, project_id, requirement_id, title, description, estimate_hours, actual_hours, 
                                      start_date, due_date, status, priority, role, dependencies, tags, phase, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16)
                    RETURNING *
                ''', task_id, project_id, task.get("requirement_id"), task.get("title", "Task"),
                   task.get("description", ""), float(task.get("estimate_hours", 0) or 0),
                   float(task.get("actual_hours", 0) or 0), task.get("start_date"),
                   task.get("due_date"), task.get("status", "planned"), task.get("priority", "medium"),
                   task.get("role"), json.dumps(task.get("dependencies", []) or []),
                   json.dumps(task.get("tags", []) or []), task.get("phase"), now)
                
                created.append(self._row_to_task(row))
        
        return created

    async def list_by_project(self, project_id: str) -> List[Task]:
        """List tasks for a project."""
        pool = self._get_pool()
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC',
                project_id
            )
        
        return [self._row_to_task(row) for row in rows]

    async def get_by_id(self, task_id: str) -> Optional[Task]:
        """Fetch a task by id."""
        pool = self._get_pool()
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow('SELECT * FROM tasks WHERE id = $1', task_id)
        
        if row:
            return self._row_to_task(row)
        return None

    async def update_task(self, task_id: str, updates: dict) -> Optional[Task]:
        """Update a specific task."""
        pool = self._get_pool()
        
        payload = {}
        for k, v in updates.items():
            if v is not None:
                if k in ('dependencies', 'tags'):
                    payload[k] = json.dumps(v)
                else:
                    payload[k] = v
        
        payload["updated_at"] = datetime.utcnow()
        
        set_clause = ", ".join([f"{k} = ${i+2}" for i, k in enumerate(payload.keys())])
        query = f"UPDATE tasks SET {set_clause} WHERE id = $1 RETURNING *"
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query, task_id, *payload.values())
        
        if row:
            return self._row_to_task(row)
        return None

    async def create_task(self, project_id: str, data: dict) -> Task:
        """Create a single task."""
        pool = self._get_pool()
        now = datetime.utcnow()
        task_id = data.get("_id") or data.get("id") or f"task_{str(now.timestamp()).replace('.', '')}"
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow('''
                INSERT INTO tasks (id, project_id, requirement_id, title, description, estimate_hours, actual_hours, 
                                  start_date, due_date, status, priority, role, dependencies, tags, phase, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16)
                RETURNING *
            ''', task_id, project_id, data.get("requirement_id"), data.get("title", "Task"),
               data.get("description", ""), float(data.get("estimate_hours", 0) or 0),
               float(data.get("actual_hours", 0) or 0), data.get("start_date"),
               data.get("due_date"), data.get("status", "planned"), data.get("priority", "medium"),
               data.get("role"), json.dumps(data.get("dependencies", []) or []),
               json.dumps(data.get("tags", []) or []), data.get("phase"), now)
        
        return self._row_to_task(row)

    async def list_by_projects(self, project_ids: List[str]) -> List[Task]:
        """Return tasks for multiple projects."""
        if not project_ids:
            return []
        
        pool = self._get_pool()
        
        # Build parameterized query for IN clause
        placeholders = ", ".join([f"${i+1}" for i in range(len(project_ids))])
        query = f"SELECT * FROM tasks WHERE project_id IN ({placeholders})"
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, *project_ids)
        
        return [self._row_to_task(row) for row in rows]

    async def clone_project_tasks(self, source_project_id: str, target_project_id: str) -> List[Task]:
        """Duplicate all tasks from one project to another."""
        pool = self._get_pool()
        now = datetime.utcnow()
        cloned = []
        
        async with pool.acquire() as conn:
            source_rows = await conn.fetch(
                'SELECT * FROM tasks WHERE project_id = $1',
                source_project_id
            )
            
            for idx, row in enumerate(source_rows):
                data = dict(row)
                new_id = f"task_{str(now.timestamp()).replace('.', '')}_{idx}"
                
                new_row = await conn.fetchrow('''
                    INSERT INTO tasks (id, project_id, requirement_id, title, description, estimate_hours, actual_hours, 
                                      start_date, due_date, status, priority, role, dependencies, tags, phase, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16)
                    RETURNING *
                ''', new_id, target_project_id, data.get("requirement_id"), data.get("title"),
                   data.get("description"), data.get("estimate_hours"), data.get("actual_hours"),
                   data.get("start_date"), data.get("due_date"), data.get("status"),
                   data.get("priority"), data.get("role"), data.get("dependencies"),
                   data.get("tags"), data.get("phase"), now)
                
                cloned.append(self._row_to_task(new_row))
        
        return cloned


class _MongoTaskRepository:
    """MongoDB/Memory implementation."""

    def __init__(self):
        self.collection_name = "tasks"

    async def replace_project_tasks(self, project_id: str, tasks_data: List[dict]) -> List[Task]:
        """Replace all tasks for a project with generated tasks."""
        db = get_db()
        await db[self.collection_name].delete_many({"project_id": project_id})

        docs = []
        for idx, task in enumerate(tasks_data):
            doc = {
                "_id": task.get("_id") or f"task_{str(datetime.utcnow().timestamp()).replace('.', '')}_{idx}",
                "project_id": project_id,
                "requirement_id": task.get("requirement_id"),
                "title": task.get("title", "Task"),
                "description": task.get("description", ""),
                "estimate_hours": float(task.get("estimate_hours", 0)),
                "actual_hours": float(task.get("actual_hours", 0)),
                "start_date": task.get("start_date"),
                "due_date": task.get("due_date"),
                "status": task.get("status", "planned"),
                "priority": task.get("priority", "medium"),
                "role": task.get("role"),
                "dependencies": task.get("dependencies", []) or [],
                "tags": task.get("tags", []) or [],
                "phase": task.get("phase"),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            docs.append(doc)

        if docs:
            await db[self.collection_name].insert_many(docs)

        return [Task(**doc) for doc in docs]

    async def list_by_project(self, project_id: str) -> List[Task]:
        """List tasks for a project."""
        db = get_db()
        cursor = db[self.collection_name].find({"project_id": project_id}).sort("created_at", -1)
        tasks: List[Task] = []
        async for doc in cursor:
            tasks.append(Task(**doc))
        return tasks

    async def get_by_id(self, task_id: str) -> Optional[Task]:
        """Fetch a task by id."""
        db = get_db()
        doc = await db[self.collection_name].find_one({"_id": task_id})
        if doc:
            return Task(**doc)
        return None

    async def update_task(self, task_id: str, updates: dict) -> Optional[Task]:
        """Update a specific task."""
        db = get_db()
        payload = {k: v for k, v in updates.items() if v is not None}
        payload["updated_at"] = datetime.utcnow()
        result = await db[self.collection_name].find_one_and_update(
            {"_id": task_id},
            {"$set": payload},
            return_document=True
        )
        if result:
            return Task(**result)
        return None

    async def create_task(self, project_id: str, data: dict) -> Task:
        """Create a single task."""
        db = get_db()
        task_id = data.get("_id") or f"task_{str(datetime.utcnow().timestamp()).replace('.', '')}"
        doc = {
            "_id": task_id,
            "project_id": project_id,
            "requirement_id": data.get("requirement_id"),
            "title": data.get("title", "Task"),
            "description": data.get("description", ""),
            "estimate_hours": float(data.get("estimate_hours", 0) or 0),
            "actual_hours": float(data.get("actual_hours", 0) or 0),
            "start_date": data.get("start_date"),
            "due_date": data.get("due_date"),
            "status": data.get("status", "planned"),
            "priority": data.get("priority", "medium"),
            "dependencies": data.get("dependencies", []) or [],
            "tags": data.get("tags", []) or [],
            "phase": data.get("phase"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await db[self.collection_name].insert_one(doc)
        return Task(**doc)

    async def list_by_projects(self, project_ids: List[str]) -> List[Task]:
        """Return tasks for multiple projects."""
        if not project_ids:
            return []
        db = get_db()
        cursor = db[self.collection_name].find({"project_id": {"$in": project_ids}})
        tasks: List[Task] = []
        async for doc in cursor:
            tasks.append(Task(**doc))
        return tasks

    async def clone_project_tasks(self, source_project_id: str, target_project_id: str) -> List[Task]:
        """Duplicate all tasks from one project to another."""
        db = get_db()
        cursor = db[self.collection_name].find({"project_id": source_project_id})
        docs: List[dict] = []
        async for doc in cursor:
            new_doc = doc.copy()
            new_doc["_id"] = f"task_{str(datetime.utcnow().timestamp()).replace('.', '')}"
            new_doc["project_id"] = target_project_id
            new_doc["created_at"] = datetime.utcnow()
            new_doc["updated_at"] = datetime.utcnow()
            docs.append(new_doc)
        if docs:
            await db[self.collection_name].insert_many(docs)
        return [Task(**doc) for doc in docs]
