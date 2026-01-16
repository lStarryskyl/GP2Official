#!/usr/bin/env python3
"""Deploy script for Render backend deployment."""

import os
import sys
import json
import subprocess
from pathlib import Path

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

def check_render_deployment():
    """Check if the deployment is configured correctly."""
    print_header("Checking Render Deployment Configuration")
    
    # Check if render-backend.yaml exists
    render_config = Path("render-backend.yaml")
    if not render_config.exists():
        print_error("render-backend.yaml not found!")
        return False
    
    print_success("Found render-backend.yaml")
    
    # Check backend requirements
    backend_req = Path("backend/requirements.txt")
    if not backend_req.exists():
        print_error("backend/requirements.txt not found!")
        return False
    
    # Check for PostgreSQL drivers
    with open(backend_req) as f:
        content = f.read()
        if "asyncpg" not in content:
            print_error("Missing asyncpg dependency for PostgreSQL!")
            return False
        print_success("PostgreSQL dependencies found")
    
    # Check main.py
    main_py = Path("backend/main.py")
    if not main_py.exists():
        print_error("backend/main.py not found!")
        return False
    
    print_success("Backend files ready for deployment")
    return True

def create_render_env_template():
    """Create environment variable template for Render."""
    print_header("Creating Environment Variables Template")
    
    env_template = """# GP2Official Render Environment Variables
# Copy these to your Render service dashboard

# Required - Generate a strong secret key (32+ characters)
SECRET_KEY=your-super-secure-secret-key-here-minimum-32-chars

# Supabase Database Configuration
USE_SUPABASE=true
SUPABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key

# Database Pool Settings (Optimized for Render)
DB_MIN_CONNECTIONS=2
DB_MAX_CONNECTIONS=20
DB_CONNECT_TIMEOUT=30
DB_RETRY_ATTEMPTS=3

# App Configuration
ENVIRONMENT=production
DEBUG=false

# CORS - Update with your Netlify frontend URL
FRONTEND_ORIGIN=https://your-app.netlify.app

# AI Configuration (Optional)
LLM_PROVIDER=stub
# GEMINI_API_KEY=your-gemini-key
# HUGGINGFACE_API_KEY=your-huggingface-key
# LLM_MODEL_NAME=gemini-pro

# Cache Configuration (Redis will be auto-configured)
CACHE_TTL=3600
"""
    
    env_file = Path("render-env-template.txt")
    with open(env_file, 'w') as f:
        f.write(env_template)
    
    print_success(f"Created {env_file}")
    print_warning("Remember to update these values in your Render dashboard!")
    
def create_render_deploy_guide():
    """Create deployment guide for Render."""
    print_header("Creating Render Deployment Guide")
    
    guide = """# Render Deployment Guide for GP2Official Backend

## 1. Prerequisites
- GitHub repository with GP2Official code
- Render account (render.com)
- Supabase project set up

## 2. Deploy to Render

### Option A: Using Blueprint (Recommended)
1. Go to Render Dashboard
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Select `render-backend.yaml`
5. Review and create services

### Option B: Manual Service Creation
1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - Name: gp2official-backend
   - Runtime: Python 3
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

## 3. Environment Variables
Copy these from render-env-template.txt to your Render service:

**Required:**
- SECRET_KEY (generate a secure 32+ character string)
- SUPABASE_URL (from Supabase project settings)
- SUPABASE_SERVICE_KEY (from Supabase API settings)
- USE_SUPABASE=true
- ENVIRONMENT=production
- DEBUG=false

**Optional:**
- GEMINI_API_KEY (for AI features)
- HUGGINGFACE_API_KEY (for AI features)
- LLM_PROVIDER=gemini (or huggingface)

## 4. Redis Cache (Optional but Recommended)
1. In Render Dashboard, create new Redis service
2. Name: gp2official-redis
3. Plan: Starter
4. The REDIS_URL will be auto-configured

## 5. Custom Domain (Optional)
1. In service settings → Custom Domains
2. Add your domain
3. Update DNS records as shown
4. SSL is automatically provisioned

## 6. Health Check
Your backend will be available at:
https://your-service-name.onrender.com/api/health

## 7. Monitoring
- View logs in Render dashboard
- Set up alerts for downtime
- Monitor resource usage

## Troubleshooting

**Build Fails:**
- Check Python version (should be 3.11+)
- Verify requirements.txt includes asyncpg
- Check build logs for missing dependencies

**Database Connection Issues:**
- Verify Supabase URL format
- Check service key permissions
- Ensure IP allowlisting (Render uses dynamic IPs)

**Environment Variable Issues:**
- Ensure all required vars are set
- Check for typos in variable names
- Restart service after changes
"""
    
    guide_file = Path("RENDER_DEPLOY.md")
    with open(guide_file, 'w') as f:
        f.write(guide)
    
    print_success(f"Created {guide_file}")

def check_supabase_connection():
    """Verify Supabase connection details."""
    print_header("Supabase Connection Check")
    
    print("To verify your Supabase setup:")
    print("1. Go to your Supabase project dashboard")
    print("2. Settings → Database")
    print("3. Copy the connection string")
    print("4. Settings → API")
    print("5. Copy the service_role key (for backend)")
    print("6. Copy the anon key (for frontend)")
    
    print_warning("Make sure to:")
    print("- Enable Row Level Security on all tables")
    print("- Run the schema from supabase/seed.sql")
    print("- Configure authentication policies")

def main():
    """Main deployment preparation function."""
    print_header("GP2Official Render Deployment Preparation")
    
    # Change to project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    os.chdir(project_root)
    
    steps = [
        ("Checking deployment configuration", check_render_deployment),
        ("Creating environment template", create_render_env_template),
        ("Creating deployment guide", create_render_deploy_guide),
        ("Supabase connection info", check_supabase_connection),
    ]
    
    for step_name, step_func in steps:
        try:
            if not step_func():
                print_error(f"Step failed: {step_name}")
                sys.exit(1)
        except Exception as e:
            print_error(f"Error in {step_name}: {e}")
            sys.exit(1)
    
    print_header("Render Deployment Ready!")
    print_success("All preparation steps completed!")
    
    print(f"\n{Colors.OKCYAN}Next Steps:{Colors.ENDC}")
    print("1. Set up your Supabase database (see DEPLOYMENT.md)")
    print("2. Go to render.com and create a new Blueprint")
    print("3. Connect your GitHub repository")
    print("4. Use render-backend.yaml as the blueprint")
    print("5. Set environment variables from render-env-template.txt")
    print("6. Deploy and test the backend")
    
    print(f"\n{Colors.WARNING}Important Files:{Colors.ENDC}")
    print("- render-backend.yaml: Render service configuration")
    print("- render-env-template.txt: Environment variables template")
    print("- RENDER_DEPLOY.md: Detailed deployment guide")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Deployment preparation interrupted{Colors.ENDC}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
