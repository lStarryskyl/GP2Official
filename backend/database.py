"""PostgreSQL database connection using AsyncPG."""

import asyncio
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
import asyncpg
from config import settings

logger = logging.getLogger(__name__)

# Global database pool
pool: Optional[asyncpg.Pool] = None


async def init_db():
    """Initialize PostgreSQL connection pool."""
    global pool

    db_url = settings.database_url
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is not set. Please configure Railway PostgreSQL.")

    # Normalize postgres:// to postgresql:// (Railway uses postgres://)
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)

    print(f"[DB] Connecting to PostgreSQL...")

    pool = await asyncpg.create_pool(
        db_url,
        min_size=settings.db_min_connections,
        max_size=settings.db_max_connections,
        command_timeout=settings.db_connect_timeout,
        server_settings={
            'application_name': 'acorn',
            'search_path': 'public'
        }
    )

    async with pool.acquire() as conn:
        result = await conn.fetchval('SELECT 1')
        print(f"[DB] Connection test: OK")

    print("[DB] Connected to PostgreSQL successfully!")
    await ensure_tables_exist()


async def ensure_tables_exist():
    """Create tables if they don't exist or fix column types."""
    global pool
    if not pool:
        return

    print("[DB] Checking/creating database tables...")

    async with pool.acquire() as conn:
        # Check if tables have correct column types
        tables_ok = True
        try:
            # Check if project_id column in tasks table is TEXT or UUID
            result = await conn.fetchrow("""
                SELECT data_type
                FROM information_schema.columns
                WHERE table_name = 'tasks' AND column_name = 'project_id'
            """)

            if result:
                data_type = result['data_type'].lower()
                print(f"[DB] tasks.project_id column type: {data_type}")
                if data_type == 'uuid':
                    print("[DB] Detected UUID column type - need to recreate tables with TEXT columns")
                    tables_ok = False
                elif data_type == 'text' or data_type == 'character varying':
                    print("[DB] Column types are correct (TEXT)")
                    tables_ok = True
            else:
                # Table doesn't exist
                print("[DB] Tasks table doesn't exist - will create")
                tables_ok = False

        except Exception as e:
            print(f"[DB] Error checking column types: {e}")
            tables_ok = False

        # Create users table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT,
                organization TEXT DEFAULT 'Private Workspace',
                hashed_password TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                role TEXT DEFAULT 'viewer',
                avatar_url TEXT,
                banner_url TEXT,
                bio TEXT,
                job_title TEXT,
                location TEXT,
                timezone TEXT,
                pronouns TEXT,
                skills JSONB DEFAULT '[]',
                interests JSONB DEFAULT '[]',
                social_links JSONB DEFAULT '[]',
                availability TEXT,
                contact_email TEXT,
                phone TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')

        # Create refresh_tokens table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token_hash TEXT UNIQUE NOT NULL,
                user_agent TEXT,
                ip_address TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                expires_at TIMESTAMPTZ NOT NULL,
                revoked BOOLEAN DEFAULT false,
                revoked_at TIMESTAMPTZ
            )
        ''')

        if not tables_ok:
            # Drop and recreate project-related tables to fix UUID column types
            await conn.execute('DROP TABLE IF EXISTS artifacts CASCADE')
            await conn.execute('DROP TABLE IF EXISTS requirements CASCADE')
            await conn.execute('DROP TABLE IF EXISTS tasks CASCADE')
            await conn.execute('DROP TABLE IF EXISTS ai_runs CASCADE')
            await conn.execute('DROP TABLE IF EXISTS projects CASCADE')

            await conn.execute('''
                CREATE TABLE projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    template_type TEXT,
                    brief_text TEXT,
                    questionnaire_data JSONB DEFAULT '{}',
                    owner_id TEXT NOT NULL,
                    organization TEXT NOT NULL,
                    status TEXT DEFAULT 'draft',
                    feature_tier TEXT DEFAULT 'pro',
                    phase_status JSONB DEFAULT '{}',
                    roadmap JSONB,
                    roadmap_summary JSONB,
                    feasibility_studies JSONB,
                    feasibility_sections JSONB,
                    development_stack JSONB,
                    development_notes JSONB,
                    parent_project_id TEXT,
                    scenario_label TEXT,
                    scenario_metadata JSONB,
                    ui_preferences JSONB,
                    team_members JSONB DEFAULT '[]',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            ''')

            # Create artifacts table
            await conn.execute('''
                CREATE TABLE artifacts (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    type TEXT NOT NULL,
                    title TEXT,
                    content_json JSONB,
                    version INTEGER DEFAULT 1,
                    is_approved BOOLEAN DEFAULT false,
                    metadata JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            ''')

            # Create requirements table
            await conn.execute('''
                CREATE TABLE requirements (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    type TEXT,
                    title TEXT NOT NULL,
                    description TEXT,
                    priority TEXT DEFAULT 'medium',
                    status TEXT DEFAULT 'draft',
                    confidence_score FLOAT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            ''')

            # Create tasks table
            await conn.execute('''
                CREATE TABLE tasks (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    requirement_id TEXT,
                    title TEXT NOT NULL,
                    description TEXT,
                    estimate_hours FLOAT,
                    actual_hours FLOAT,
                    start_date TIMESTAMPTZ,
                    due_date TIMESTAMPTZ,
                    status TEXT DEFAULT 'pending',
                    priority TEXT DEFAULT 'medium',
                    role TEXT,
                    dependencies JSONB DEFAULT '[]',
                    tags JSONB DEFAULT '[]',
                    phase TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            ''')

            # Create ai_runs table
            await conn.execute('''
                CREATE TABLE ai_runs (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    user_id TEXT,
                    job_type TEXT,
                    phase TEXT,
                    provider TEXT,
                    model TEXT,
                    status TEXT DEFAULT 'pending',
                    prompt TEXT,
                    response_excerpt TEXT,
                    duration_ms INTEGER,
                    error_message TEXT,
                    metadata JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    completed_at TIMESTAMPTZ
                )
            ''')

            print("[DB] Creating indexes...")
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_projects_organization ON projects(organization)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_artifacts_project ON artifacts(project_id)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_artifacts_project_type ON artifacts(project_id, type)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_requirements_project ON requirements(project_id)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_ai_runs_project ON ai_runs(project_id)')

        # Always create workspace_invites (safe with IF NOT EXISTS)
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS workspace_invites (
                id TEXT PRIMARY KEY,
                organization TEXT NOT NULL,
                email TEXT NOT NULL,
                role TEXT DEFAULT 'viewer',
                status TEXT DEFAULT 'pending',
                invited_by TEXT NOT NULL,
                message TEXT,
                token TEXT UNIQUE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                accepted_at TIMESTAMPTZ,
                accepted_by TEXT
            )
        ''')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_invites_org ON workspace_invites(organization)')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_invites_email ON workspace_invites(email)')

        # Change logs
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS change_logs (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                organization TEXT,
                author_id TEXT NOT NULL,
                description TEXT NOT NULL,
                files JSONB DEFAULT '[]',
                task_ids JSONB DEFAULT '[]',
                requirement_ids JSONB DEFAULT '[]',
                entry_type TEXT DEFAULT 'manual',
                ai_summary TEXT,
                diagram_url TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_change_logs_project ON change_logs(project_id)')

        # Activity logs (project timeline)
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS activity_logs (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                user_id TEXT,
                event_type TEXT NOT NULL,
                details_json JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_activity_logs_project ON activity_logs(project_id)')

        # Generation jobs
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS generation_jobs (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                user_id TEXT,
                status TEXT DEFAULT 'pending',
                progress FLOAT DEFAULT 0.0,
                result_summary JSONB,
                error_message TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                completed_at TIMESTAMPTZ
            )
        ''')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_generation_jobs_project ON generation_jobs(project_id)')

        # Version history
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS version_history (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                version_number INTEGER NOT NULL,
                changes JSONB DEFAULT '{}',
                change_summary TEXT,
                changed_by TEXT,
                changed_by_name TEXT,
                previous_version_id TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_version_history_entity ON version_history(entity_type, entity_id)')

        # Notifications
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                project_id TEXT,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                priority TEXT DEFAULT 'normal',
                entity_type TEXT,
                entity_id TEXT,
                action_url TEXT,
                metadata JSONB DEFAULT '{}',
                read BOOLEAN DEFAULT false,
                read_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)')

        await conn.execute('''
            CREATE TABLE IF NOT EXISTS notification_preferences (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                email_notifications BOOLEAN DEFAULT true,
                push_notifications BOOLEAN DEFAULT true,
                comment_mentions BOOLEAN DEFAULT true,
                requirement_changes BOOLEAN DEFAULT true,
                task_assignments BOOLEAN DEFAULT true,
                project_updates BOOLEAN DEFAULT true,
                weekly_digest BOOLEAN DEFAULT true
            )
        ''')

        # Activity feed items (richer than simple logs)
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS activity_feed (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                user_name TEXT,
                action TEXT,
                entity_type TEXT,
                entity_id TEXT,
                entity_name TEXT,
                description TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_activity_feed_project ON activity_feed(project_id)')

        # Traceability links
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS traceability_links (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                source_type TEXT NOT NULL,
                source_id TEXT NOT NULL,
                source_name TEXT,
                target_type TEXT NOT NULL,
                target_id TEXT NOT NULL,
                target_name TEXT,
                link_type TEXT,
                rationale TEXT,
                created_by TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_traceability_project ON traceability_links(project_id)')

        # Negotiation threads and comments
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS negotiation_threads (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                requirement_id TEXT,
                title TEXT,
                description TEXT,
                status TEXT DEFAULT 'open',
                priority TEXT DEFAULT 'medium',
                stakeholder_ids JSONB DEFAULT '[]',
                created_by TEXT,
                resolution TEXT,
                resolved_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_negotiation_threads_project ON negotiation_threads(project_id)')

        await conn.execute('''
            CREATE TABLE IF NOT EXISTS negotiation_comments (
                id TEXT PRIMARY KEY,
                thread_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                requirement_id TEXT,
                parent_id TEXT,
                content TEXT,
                author_id TEXT,
                author_name TEXT,
                mentions JSONB DEFAULT '[]',
                reactions JSONB DEFAULT '{}',
                edited BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        ''')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_negotiation_comments_thread ON negotiation_comments(thread_id)')

    print("[DB] Database tables verified/created successfully!")


async def close_db():
    """Close PostgreSQL database connection pool."""
    global pool
    if pool:
        await pool.close()
        pool = None
        logger.info("Closed PostgreSQL database connection")


def get_pool():
    """Get the database pool."""
    global pool
    return pool


# Kept for backwards compatibility with any code that calls get_db()
def get_db():
    """Get the database pool (alias for get_pool)."""
    return get_pool()


class BaseRepository:
    """Base repository class for PostgreSQL operations."""

    def __init__(self, table_name: str):
        self.table_name = table_name

    def _get_pool(self):
        global pool
        if pool is None:
            raise Exception("Database pool not initialized. Is DATABASE_URL set?")
        return pool

    async def _execute_query(self, query: str, *args):
        """Execute a query and return results."""
        async with self._get_pool().acquire() as conn:
            return await conn.fetch(query, *args)

    async def _execute_single(self, query: str, *args):
        """Execute a query and return single result."""
        async with self._get_pool().acquire() as conn:
            return await conn.fetchrow(query, *args)

    async def _execute_command(self, query: str, *args):
        """Execute a command (INSERT/UPDATE/DELETE)."""
        async with self._get_pool().acquire() as conn:
            return await conn.execute(query, *args)

    async def find_by_id(self, id: str, organization: str = None) -> Optional[Dict]:
        """Find record by ID."""
        if organization:
            query = f"SELECT * FROM {self.table_name} WHERE id = $1 AND organization = $2"
            row = await self._execute_single(query, id, organization)
        else:
            query = f"SELECT * FROM {self.table_name} WHERE id = $1"
            row = await self._execute_single(query, id)

        return dict(row) if row else None

    async def find_all(self, organization: str = None) -> List[Dict]:
        """Find all records for organization."""
        if organization:
            query = f"SELECT * FROM {self.table_name} WHERE organization = $1 ORDER BY created_at DESC"
            rows = await self._execute_query(query, organization)
        else:
            query = f"SELECT * FROM {self.table_name} ORDER BY created_at DESC"
            rows = await self._execute_query(query)

        return [dict(row) for row in rows]

    async def create(self, data: Dict) -> Dict:
        """Create a new record."""
        now = datetime.utcnow()
        data['created_at'] = now
        data['updated_at'] = now

        columns = list(data.keys())
        placeholders = [f"${i+1}" for i in range(len(columns))]

        query = f"""
            INSERT INTO {self.table_name} ({', '.join(columns)})
            VALUES ({', '.join(placeholders)})
            RETURNING *
        """

        row = await self._execute_single(query, *data.values())
        return dict(row)

    async def update(self, id: str, data: Dict, organization: str = None) -> Optional[Dict]:
        """Update a record by ID."""
        data['updated_at'] = datetime.utcnow()

        set_clauses = [f"{key} = ${i+2}" for i, key in enumerate(data.keys())]

        if organization:
            query = f"""
                UPDATE {self.table_name}
                SET {', '.join(set_clauses)}
                WHERE id = $1 AND organization = ${len(data)+2}
                RETURNING *
            """
            row = await self._execute_single(query, id, *data.values(), organization)
        else:
            query = f"""
                UPDATE {self.table_name}
                SET {', '.join(set_clauses)}
                WHERE id = $1
                RETURNING *
            """
            row = await self._execute_single(query, id, *data.values())

        return dict(row) if row else None

    async def delete(self, id: str, organization: str = None) -> bool:
        """Delete a record by ID."""
        if organization:
            query = f"DELETE FROM {self.table_name} WHERE id = $1 AND organization = $2"
            result = await self._execute_command(query, id, organization)
        else:
            query = f"DELETE FROM {self.table_name} WHERE id = $1"
            result = await self._execute_command(query, id)

        return result == "DELETE 1"


class UserRepository(BaseRepository):
    """User repository."""

    def __init__(self):
        super().__init__("users")

    async def find_by_email(self, email: str) -> Optional[Dict]:
        """Find user by email."""
        query = "SELECT * FROM users WHERE email = $1"
        row = await self._execute_single(query, email)
        return dict(row) if row else None


class ProjectRepository(BaseRepository):
    """Project repository."""

    def __init__(self):
        super().__init__("projects")

    async def find_by_owner(self, owner_id: str, organization: str) -> List[Dict]:
        """Find projects by owner."""
        query = "SELECT * FROM projects WHERE owner_id = $1 AND organization = $2 ORDER BY created_at DESC"
        rows = await self._execute_query(query, owner_id, organization)
        return [dict(row) for row in rows]


class RequirementRepository(BaseRepository):
    """Requirement repository."""

    def __init__(self):
        super().__init__("requirements")

    async def find_by_project(self, project_id: str) -> List[Dict]:
        """Find requirements by project."""
        query = "SELECT * FROM requirements WHERE project_id = $1 ORDER BY created_at"
        rows = await self._execute_query(query, project_id)
        return [dict(row) for row in rows]


class TaskRepository(BaseRepository):
    """Task repository."""

    def __init__(self):
        super().__init__("tasks")

    async def find_by_project(self, project_id: str) -> List[Dict]:
        """Find tasks by project."""
        query = "SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at"
        rows = await self._execute_query(query, project_id)
        return [dict(row) for row in rows]

    async def find_by_status(self, project_id: str, status: str) -> List[Dict]:
        """Find tasks by status."""
        query = "SELECT * FROM tasks WHERE project_id = $1 AND status = $2 ORDER BY created_at"
        rows = await self._execute_query(query, project_id, status)
        return [dict(row) for row in rows]


# Repository factory functions
def get_user_repository():
    return UserRepository()

def get_project_repository():
    return ProjectRepository()

def get_requirement_repository():
    return RequirementRepository()

def get_task_repository():
    return TaskRepository()
