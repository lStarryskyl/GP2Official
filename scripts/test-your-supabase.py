#!/usr/bin/env python3
"""Test script for YOUR actual Supabase project: qscbybwxuybptijwdyvc"""

import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / "backend"))

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(message):
    print(f"\n{Colors.HEADER}{Colors.BOLD}=== {message} ==={Colors.ENDC}")

def print_success(message):
    print(f"{Colors.OKGREEN}✓ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.WARNING}⚠ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.FAIL}✗ {message}{Colors.ENDC}")

def setup_environment():
    """Set up environment with your actual Supabase project details."""
    print_header("Setting Up Your Supabase Project Environment")
    
    # Your actual project details
    project_ref = "qscbybwxuybptijwdyvc"
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzY2J5Ynd4dXlicHRpandkeXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NzIwOTEsImV4cCI6MjA1MzA0ODA5MX0.sb_publishable_chtjIdb6HNQWEwk4IdkpDQ_-Li47eY8"
    
    print_success(f"Project Reference: {project_ref}")
    print_success(f"Project URL: https://{project_ref}.supabase.co")
    print_success("Anon Key: ey...9X0.sb_publishable... (configured)")
    
    # Check for database password
    db_password = os.getenv('SUPABASE_DB_PASSWORD')
    if not db_password:
        print_warning("Database password not set!")
        print("Please set your database password:")
        print(f"  export SUPABASE_DB_PASSWORD='your-db-password'")
        
        # Prompt for password
        db_password = input("Enter your Supabase database password: ").strip()
        if not db_password:
            print_error("Database password is required for connection test")
            return None
    
    # Check for service role key
    service_key = os.getenv('SUPABASE_SERVICE_KEY')
    if not service_key:
        print_warning("Service role key not set!")
        print("Get your service role key from:")
        print(f"  https://supabase.com/dashboard/project/{project_ref}/settings/api")
        
        # Prompt for service key
        service_key = input("Enter your Supabase service role key: ").strip()
        if not service_key:
            print_error("Service role key is required for backend operations")
            return None
    
    # Set up environment variables
    os.environ['SUPABASE_URL'] = f"postgresql://postgres:{db_password}@db.{project_ref}.supabase.co:5432/postgres"
    os.environ['SUPABASE_SERVICE_KEY'] = service_key
    os.environ['SUPABASE_ANON_KEY'] = anon_key
    
    return {
        'project_ref': project_ref,
        'db_password': db_password,
        'service_key': service_key,
        'anon_key': anon_key,
        'db_url': os.environ['SUPABASE_URL']
    }

async def test_basic_connection(config):
    """Test basic database connection."""
    print_header("Testing Database Connection")
    
    try:
        import asyncpg
        
        # Test direct connection to PostgreSQL
        conn = await asyncpg.connect(config['db_url'])
        
        # Test basic query
        result = await conn.fetchval('SELECT version()')
        print_success(f"Connected to PostgreSQL")
        print(f"  Database version: {result.split(',')[0]}")
        
        # Test GP2Official specific tables
        tables_result = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        
        tables = [row['table_name'] for row in tables_result]
        print_success(f"Found {len(tables)} tables in public schema")
        
        # Check for GP2Official tables
        gp2_tables = ['users', 'projects', 'requirements', 'tasks', 'diagrams']
        missing_tables = [table for table in gp2_tables if table not in tables]
        
        if missing_tables:
            print_warning("Missing GP2Official tables:")
            for table in missing_tables:
                print(f"  - {table}")
            print("\nTo create tables:")
            print(f"1. Go to https://supabase.com/dashboard/project/{config['project_ref']}/sql")
            print("2. Run the SQL from supabase/seed.sql")
        else:
            print_success("All core GP2Official tables found:")
            for table in gp2_tables:
                print(f"  ✓ {table}")
        
        await conn.close()
        return True
        
    except Exception as e:
        print_error(f"Connection failed: {e}")
        
        if "password authentication failed" in str(e):
            print_warning("Password authentication failed. Please check:")
            print("1. Your database password is correct")
            print("2. Try resetting password in Supabase dashboard")
        elif "timeout" in str(e):
            print_warning("Connection timeout. Please check:")
            print("1. Your internet connection") 
            print("2. Supabase project is running")
        
        return False

async def test_supabase_adapter(config):
    """Test our Supabase adapter code."""
    print_header("Testing GP2Official Supabase Adapter")
    
    try:
        # Set up configuration
        from config import settings
        settings.use_supabase = True
        settings.supabase_url = config['db_url']
        settings.supabase_service_key = config['service_key']
        
        # Test adapter initialization
        from database_supabase import init_supabase_db
        await init_supabase_db()
        
        print_success("Supabase adapter initialized successfully")
        
        # Test repository operations (if tables exist)
        from database_supabase import SupabaseRepository
        repo = SupabaseRepository("information_schema.tables")
        
        result = await repo._execute_query(
            "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public'"
        )
        
        table_count = result[0]['table_count']
        print_success(f"Repository operations working - {table_count} public tables")
        
        return True
        
    except Exception as e:
        print_error(f"Adapter test failed: {e}")
        return False

def show_next_steps(config):
    """Show what to do next."""
    print_header("Next Steps")
    
    print(f"{Colors.OKCYAN}Your Supabase project is ready! Here's what to do next:{Colors.ENDC}")
    
    print(f"\n{Colors.OKBLUE}1. Complete Database Setup (if tables missing):{Colors.ENDC}")
    print(f"   → Go to: https://supabase.com/dashboard/project/{config['project_ref']}/sql")
    print("   → Run the SQL from: supabase/seed.sql")
    print("   → This creates all tables and Row Level Security policies")
    
    print(f"\n{Colors.OKBLUE}2. Deploy Backend to Render:{Colors.ENDC}")
    print("   → Go to: https://render.com")
    print("   → New Blueprint → Use render-backend.yaml")
    print("   → Set environment variables:")
    print(f"     SECRET_KEY=your-32-char-secret")
    print(f"     SUPABASE_URL={config['db_url']}")
    print(f"     SUPABASE_SERVICE_KEY={config['service_key']}")
    
    print(f"\n{Colors.OKBLUE}3. Deploy Frontend to Netlify:{Colors.ENDC}")
    print("   → Go to: https://netlify.com")
    print("   → New site from Git")
    print("   → Base: frontend, Build: npm ci && npm run build")
    print("   → Environment variables are already configured in netlify.toml")
    
    print(f"\n{Colors.WARNING}Quick Deploy Guide:{Colors.ENDC}")
    print("   → See: QUICK_DEPLOY.md")
    print("   → Total time: ~15 minutes")

async def main():
    """Main test function."""
    print_header("🧪 Testing Your Supabase Project")
    print("Project: qscbybwxuybptijwdyvc")
    print("="*50)
    
    # Set up environment
    config = setup_environment()
    if not config:
        return
    
    # Run connection tests
    tests_passed = 0
    total_tests = 2
    
    if await test_basic_connection(config):
        tests_passed += 1
    
    if await test_supabase_adapter(config):
        tests_passed += 1
    
    # Show results
    print_header("Test Results")
    
    if tests_passed == total_tests:
        print_success(f"All {total_tests} tests passed! 🎉")
        print_success("Your Supabase project is ready for deployment")
        show_next_steps(config)
    else:
        print_warning(f"Passed {tests_passed}/{total_tests} tests")
        if tests_passed > 0:
            print_warning("Partial success - you can proceed but may need to fix issues")
            show_next_steps(config)
        else:
            print_error("Connection tests failed - please check your credentials")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Test interrupted{Colors.ENDC}")
        sys.exit(1)
    except Exception as e:
        print(f"{Colors.FAIL}Test failed: {e}{Colors.ENDC}")
        sys.exit(1)
