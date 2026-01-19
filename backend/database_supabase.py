"""Supabase database connection adapter."""

import asyncio
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
import asyncpg
from config import settings

logger = logging.getLogger(__name__)

# Global database pool
pool: Optional[asyncpg.Pool] = None


async def init_supabase_db():
    """Initialize Supabase PostgreSQL connection pool."""
    global pool
    
    # Clean and get the URL
    raw_url = (settings.supabase_url or "").strip().strip('"').strip("'")
    
    print(f"[SUPABASE INIT] URL={'SET' if raw_url else 'NOT SET'}, SERVICE_KEY={'SET' if settings.supabase_service_key else 'NOT SET'}")
    
    if not raw_url:
        print("[SUPABASE ERROR] Missing Supabase URL!")
        logger.error("Supabase URL is required")
        raise ValueError("Missing Supabase configuration - SUPABASE_URL not set")
    
    try:
        # Check if SUPABASE_URL is already a PostgreSQL connection string
        if raw_url.startswith('postgresql://') or raw_url.startswith('postgres://'):
            # Direct PostgreSQL connection string provided - use it as-is
            database_url = raw_url
            print("[SUPABASE] Using direct PostgreSQL connection string")
            print(f"[SUPABASE] URL starts with: {database_url[:50]}...")
        else:
            # It's an API URL like https://xxx.supabase.co - need to construct DB URL
            import re
            url_match = re.search(r'https://([^.]+)\.supabase\.co', raw_url)
            if not url_match:
                raise ValueError(f"Invalid Supabase URL format: {raw_url}")
            
            project_id = url_match.group(1)
            
            # Use dedicated database password if provided, otherwise fall back to service key
            db_password = settings.supabase_db_password or settings.supabase_service_key
            
            if not db_password:
                raise ValueError("Either SUPABASE_DB_PASSWORD or SUPABASE_SERVICE_KEY must be set")
            
            database_url = f"postgresql://postgres.{project_id}:{db_password}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
            
            print(f"[SUPABASE] Using constructed connection string for project: {project_id}")
        
        # Create connection pool
        pool = await asyncpg.create_pool(
            database_url,
            min_size=settings.db_min_connections,
            max_size=settings.db_max_connections,
            command_timeout=settings.db_connect_timeout,
            server_settings={
                'application_name': 'gp2official',
                'search_path': 'public'
            }
        )
        
        # Test connection
        async with pool.acquire() as conn:
            result = await conn.fetchval('SELECT 1')
            print(f"[SUPABASE] Connection test successful: {result}")
            
        logger.info("Connected to Supabase PostgreSQL database")
        print("[SUPABASE] ✅ Database connection established successfully!")
        
        # Create tables if they don't exist
        await ensure_tables_exist()
        
    except Exception as e:
        logger.error(f"Failed to connect to Supabase: {e}")
        print(f"[SUPABASE ERROR] Connection failed: {e}")
        raise


async def ensure_tables_exist():
    """Create tables if they don't exist or fix column types."""
    global pool
    if not pool:
        return
    
    print("[SUPABASE] Checking/creating database tables...")
    
    async with pool.acquire() as conn:
        # Check if we should force recreate tables
        if settings.force_recreate_tables:
            print("[SUPABASE] FORCE_RECREATE_TABLES=True - dropping and recreating all tables")
            tables_ok = False
        else:
            # Check if tables have correct column types by checking the actual column data type
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
                    print(f"[SUPABASE] tasks.project_id column type: {data_type}")
                    if data_type == 'uuid':
                        print("[SUPABASE] Detected UUID column type - need to recreate tables with TEXT columns")
                        tables_ok = False
                    elif data_type == 'text' or data_type == 'character varying':
                        print("[SUPABASE] Column types are correct (TEXT)")
                        tables_ok = True
                else:
                    # Table doesn't exist
                    print("[SUPABASE] Tasks table doesn't exist - will create")
                    tables_ok = False
                    
            except Exception as e:
                print(f"[SUPABASE] Error checking column types: {e}")
                tables_ok = False
        
        # Create users table (this one should be fine with TEXT)
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
            # Create projects table - drop and recreate to fix UUID column type
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
            
            print("[SUPABASE] Creating indexes...")
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_projects_organization ON projects(organization)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_artifacts_project ON artifacts(project_id)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_artifacts_project_type ON artifacts(project_id, type)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_requirements_project ON requirements(project_id)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
            await conn.execute('CREATE INDEX IF NOT EXISTS idx_ai_runs_project ON ai_runs(project_id)')
        
    print("[SUPABASE] ✅ Database tables verified/created successfully!")


async def close_supabase_db():
    """Close Supabase database connection pool."""
    global pool
    if pool:
        await pool.close()
        pool = None
        logger.info("Closed Supabase database connection")


def get_pool():
    """Get the database pool."""
    global pool
    return pool


class SupabaseRepository:
    """Base repository class for Supabase operations."""
    
    def __init__(self, table_name: str):
        self.table_name = table_name
    
    def _get_pool(self):
        global pool
        if pool is None:
            raise Exception("Supabase database pool not initialized")
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
        # Add timestamps
        now = datetime.utcnow()
        data['created_at'] = now
        data['updated_at'] = now
        
        # Generate column names and placeholders
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
        # Add updated timestamp
        data['updated_at'] = datetime.utcnow()
        
        # Generate SET clause
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


class SupabaseUserRepository(SupabaseRepository):
    """User repository for Supabase."""
    
    def __init__(self):
        super().__init__("users")
    
    async def find_by_email(self, email: str) -> Optional[Dict]:
        """Find user by email."""
        query = "SELECT * FROM users WHERE email = $1"
        row = await self._execute_single(query, email)
        return dict(row) if row else None


class SupabaseProjectRepository(SupabaseRepository):
    """Project repository for Supabase."""
    
    def __init__(self):
        super().__init__("projects")
    
    async def find_by_owner(self, owner_id: str, organization: str) -> List[Dict]:
        """Find projects by owner."""
        query = "SELECT * FROM projects WHERE owner_id = $1 AND organization = $2 ORDER BY created_at DESC"
        rows = await self._execute_query(query, owner_id, organization)
        return [dict(row) for row in rows]


class SupabaseRequirementRepository(SupabaseRepository):
    """Requirement repository for Supabase."""
    
    def __init__(self):
        super().__init__("requirements")
    
    async def find_by_project(self, project_id: str) -> List[Dict]:
        """Find requirements by project."""
        query = "SELECT * FROM requirements WHERE project_id = $1 ORDER BY created_at"
        rows = await self._execute_query(query, project_id)
        return [dict(row) for row in rows]


class SupabaseTaskRepository(SupabaseRepository):
    """Task repository for Supabase."""
    
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


# Repository instances (will be used by services)
def get_user_repository():
    return SupabaseUserRepository()

def get_project_repository():
    return SupabaseProjectRepository()

def get_requirement_repository():
    return SupabaseRequirementRepository()

def get_task_repository():
    return SupabaseTaskRepository()
