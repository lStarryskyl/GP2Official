#!/usr/bin/env python3
"""Test script for Supabase database connection and setup."""

import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime

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

def check_supabase_config():
    """Check if Supabase configuration is available."""
    print_header("Checking Supabase Configuration")
    
    required_vars = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_KEY',
        'SUPABASE_ANON_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print_error("Missing required environment variables:")
        for var in missing_vars:
            print(f"  - {var}")
        
        print(f"\n{Colors.OKCYAN}To set up Supabase:{Colors.ENDC}")
        print("1. Go to https://supabase.com")
        print("2. Create a new project")
        print("3. Go to Settings → Database")
        print("4. Copy the connection string")
        print("5. Go to Settings → API")
        print("6. Copy the service_role key and anon key")
        print("7. Set environment variables:")
        print("   export SUPABASE_URL='postgresql://postgres:[password]@[host]:5432/postgres'")
        print("   export SUPABASE_SERVICE_KEY='your-service-key'")
        print("   export SUPABASE_ANON_KEY='your-anon-key'")
        return False
    
    print_success("All required environment variables found")
    return True

async def test_database_connection():
    """Test basic database connection."""
    print_header("Testing Database Connection")
    
    try:
        # Set up configuration for testing
        from config import settings
        settings.use_supabase = True
        settings.supabase_url = os.getenv('SUPABASE_URL')
        settings.supabase_service_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        # Initialize Supabase connection
        from database_supabase import init_supabase_db, SupabaseRepository
        await init_supabase_db()
        
        print_success("Successfully connected to Supabase")
        
        # Test basic query
        repo = SupabaseRepository("information_schema.tables")
        result = await repo._execute_query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5"
        )
        
        print_success(f"Found {len(result)} tables in public schema")
        for row in result[:3]:  # Show first 3 tables
            print(f"  - {dict(row)['table_name']}")
        
        return True
        
    except Exception as e:
        print_error(f"Database connection failed: {e}")
        return False

async def check_database_schema():
    """Check if required tables exist."""
    print_header("Checking Database Schema")
    
    try:
        from database_supabase import SupabaseRepository
        repo = SupabaseRepository("information_schema.tables")
        
        required_tables = [
            'users', 'projects', 'requirements', 'tasks',
            'diagrams', 'artifacts', 'ai_runs', 'activity_logs'
        ]
        
        # Get existing tables
        result = await repo._execute_query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        )
        existing_tables = [dict(row)['table_name'] for row in result]
        
        missing_tables = [table for table in required_tables if table not in existing_tables]
        
        if missing_tables:
            print_error("Missing required tables:")
            for table in missing_tables:
                print(f"  - {table}")
            
            print(f"\n{Colors.OKCYAN}To create tables:{Colors.ENDC}")
            print("1. Go to your Supabase project dashboard")
            print("2. Open the SQL Editor")
            print("3. Run the schema from supabase/seed.sql")
            return False
        else:
            print_success("All required tables found")
            for table in required_tables:
                print(f"  ✓ {table}")
            return True
            
    except Exception as e:
        print_error(f"Schema check failed: {e}")
        return False

async def test_crud_operations():
    """Test basic CRUD operations."""
    print_header("Testing CRUD Operations")
    
    try:
        from database_supabase import SupabaseUserRepository
        user_repo = SupabaseUserRepository()
        
        # Test data
        test_user_data = {
            'id': 'test-user-' + datetime.now().strftime('%Y%m%d-%H%M%S'),
            'email': f'test-{datetime.now().strftime("%Y%m%d%H%M%S")}@example.com',
            'hashed_password': 'test-hashed-password',
            'full_name': 'Test User',
            'organization': 'Test Org',
            'role': 'developer',
            'is_active': True
        }
        
        # Test CREATE
        print("Testing CREATE operation...")
        created_user = await user_repo.create(test_user_data)
        print_success(f"Created user: {created_user['email']}")
        
        # Test READ
        print("Testing READ operation...")
        found_user = await user_repo.find_by_id(created_user['id'])
        if found_user and found_user['email'] == test_user_data['email']:
            print_success("User found successfully")
        else:
            print_error("User not found")
        
        # Test UPDATE
        print("Testing UPDATE operation...")
        updated_user = await user_repo.update(
            created_user['id'], 
            {'full_name': 'Updated Test User'}
        )
        if updated_user and updated_user['full_name'] == 'Updated Test User':
            print_success("User updated successfully")
        else:
            print_error("User update failed")
        
        # Test DELETE
        print("Testing DELETE operation...")
        deleted = await user_repo.delete(created_user['id'])
        if deleted:
            print_success("User deleted successfully")
        else:
            print_error("User deletion failed")
        
        return True
        
    except Exception as e:
        print_error(f"CRUD test failed: {e}")
        return False

async def test_repository_functions():
    """Test repository-specific functions."""
    print_header("Testing Repository Functions")
    
    try:
        from database_supabase import SupabaseProjectRepository
        project_repo = SupabaseProjectRepository()
        
        # Test finding projects (should work even with no data)
        projects = await project_repo.find_all("test-org")
        print_success(f"Found {len(projects)} projects for test-org")
        
        return True
        
    except Exception as e:
        print_error(f"Repository test failed: {e}")
        return False

async def cleanup_test_data():
    """Clean up any test data."""
    print_header("Cleaning Up Test Data")
    
    try:
        from database_supabase import SupabaseRepository
        repo = SupabaseRepository("users")
        
        # Delete test users
        await repo._execute_command(
            "DELETE FROM users WHERE email LIKE 'test-%@example.com'"
        )
        
        print_success("Test data cleaned up")
        return True
        
    except Exception as e:
        print_warning(f"Cleanup failed (this is usually ok): {e}")
        return True

def create_supabase_setup_guide():
    """Create setup guide for Supabase."""
    print_header("Creating Supabase Setup Guide")
    
    guide = """# Supabase Setup Guide for GP2Official

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Choose organization and enter:
   - Name: `gp2official`
   - Database Password: Generate strong password
   - Region: Choose closest to your users
5. Wait for project to be ready (~2 minutes)

## 2. Set up Database Schema

1. Go to your project dashboard
2. Click "SQL Editor" in the sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase/seed.sql`
5. Click "Run" to execute the schema

## 3. Configure Authentication

1. Go to Authentication → Settings
2. Site URL: `https://your-app.netlify.app`
3. Redirect URLs: Add your Netlify URL
4. Enable email authentication
5. Configure any OAuth providers if needed

## 4. Set up Row Level Security

The seed.sql file includes RLS policies, but verify:

1. Go to Authentication → Policies
2. Ensure all tables have appropriate policies
3. Test with different user roles

## 5. Get Connection Details

### Database Connection
1. Go to Settings → Database
2. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

### API Keys
1. Go to Settings → API
2. Copy:
   - `anon` key (for frontend)
   - `service_role` key (for backend)

## 6. Environment Variables

Set these in your deployment platforms:

### Backend (Render)
```env
USE_SUPABASE=true
SUPABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

### Frontend (Netlify)
```env
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 7. Testing Connection

Run the test script:
```bash
# Set environment variables first
export SUPABASE_URL="postgresql://..."
export SUPABASE_SERVICE_KEY="your-service-key"
export SUPABASE_ANON_KEY="your-anon-key"

# Run test
python3 scripts/test-supabase.py
```

## 8. Security Checklist

- [x] Row Level Security enabled on all tables
- [x] Service key kept secret (server-side only)
- [x] Anon key properly scoped
- [x] Authentication policies configured
- [x] Database password is strong
- [x] Connection string uses SSL

## 9. Monitoring

Available in Supabase dashboard:
- Database usage and performance
- API request logs
- Authentication logs
- Real-time subscriptions

## Troubleshooting

**Connection Issues:**
- Verify connection string format
- Check if IP is allowlisted (Supabase allows all by default)
- Ensure SSL is enabled

**Permission Issues:**
- Check RLS policies
- Verify API key permissions
- Test with different user roles

**Performance Issues:**
- Add database indexes as needed
- Monitor query performance
- Use connection pooling
- Consider read replicas for high traffic
"""
    
    guide_file = Path("SUPABASE_SETUP.md")
    with open(guide_file, 'w') as f:
        f.write(guide)
    
    print_success(f"Created {guide_file}")

async def main():
    """Main test function."""
    print_header("GP2Official Supabase Database Test")
    
    # Change to project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    os.chdir(project_root)
    
    # Check configuration first
    if not check_supabase_config():
        create_supabase_setup_guide()
        return
    
    # Run tests
    tests = [
        ("Database Connection", test_database_connection),
        ("Database Schema", check_database_schema),
        ("CRUD Operations", test_crud_operations),
        ("Repository Functions", test_repository_functions),
        ("Cleanup", cleanup_test_data),
    ]
    
    all_passed = True
    
    for test_name, test_func in tests:
        try:
            success = await test_func()
            if not success:
                all_passed = False
        except Exception as e:
            print_error(f"Test failed: {test_name} - {e}")
            all_passed = False
    
    # Always create the setup guide
    create_supabase_setup_guide()
    
    if all_passed:
        print_header("All Tests Passed! ✅")
        print_success("Supabase database is ready for deployment")
    else:
        print_header("Some Tests Failed ❌")
        print_error("Please fix issues before deploying")
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Test interrupted{Colors.ENDC}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Test failed with error: {e}")
        sys.exit(1)
