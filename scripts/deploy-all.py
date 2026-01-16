#!/usr/bin/env python3
"""Master deployment script for GP2Official - Supabase → Render → Netlify."""

import os
import sys
import subprocess
import time
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

def print_info(message):
    print(f"{Colors.OKBLUE}ℹ {message}{Colors.ENDC}")

def run_script(script_path, description):
    """Run a deployment script and handle output."""
    print_header(f"Running: {description}")
    
    try:
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        if result.returncode == 0:
            print_success(f"✓ {description} completed successfully")
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print_error(f"✗ {description} failed")
            if result.stderr:
                print(result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print_error(f"✗ {description} timed out")
        return False
    except Exception as e:
        print_error(f"✗ {description} error: {e}")
        return False

def check_prerequisites():
    """Check if all prerequisites are met."""
    print_header("Checking Prerequisites")
    
    # Check if we're in the project root
    if not Path("backend").exists() or not Path("frontend").exists():
        print_error("Must run from project root directory")
        return False
    
    # Check required files
    required_files = [
        "backend/requirements.txt",
        "frontend/package.json",
        "supabase/seed.sql",
        "netlify.toml",
        "render-backend.yaml"
    ]
    
    for file_path in required_files:
        if not Path(file_path).exists():
            print_error(f"Required file missing: {file_path}")
            return False
    
    print_success("All required files found")
    
    # Check Python and Node versions
    try:
        python_result = subprocess.run(["python3", "--version"], capture_output=True, text=True)
        node_result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        
        print_success(f"Python: {python_result.stdout.strip()}")
        print_success(f"Node.js: {node_result.stdout.strip()}")
        
    except Exception as e:
        print_error(f"Version check failed: {e}")
        return False
    
    return True

def collect_deployment_info():
    """Collect information needed for deployment."""
    print_header("Deployment Configuration")
    
    print(f"{Colors.OKCYAN}Please provide the following information:{Colors.ENDC}")
    
    config = {}
    
    # Supabase information
    print(f"\n{Colors.OKBLUE}1. Supabase Configuration:{Colors.ENDC}")
    config['supabase_url'] = input("   Supabase Database URL: ").strip()
    config['supabase_service_key'] = input("   Supabase Service Key: ").strip()
    config['supabase_anon_key'] = input("   Supabase Anon Key: ").strip()
    
    # Backend information
    print(f"\n{Colors.OKBLUE}2. Backend Configuration:{Colors.ENDC}")
    config['secret_key'] = input("   Secret Key (32+ chars): ").strip()
    if not config['secret_key']:
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        config['secret_key'] = ''.join(secrets.choice(alphabet) for _ in range(32))
        print_success(f"   Generated secret key: {config['secret_key'][:8]}...")
    
    # Optional AI configuration
    print(f"\n{Colors.OKBLUE}3. AI Configuration (Optional):{Colors.ENDC}")
    config['gemini_key'] = input("   Gemini API Key (optional): ").strip()
    config['huggingface_key'] = input("   HuggingFace API Key (optional): ").strip()
    
    return config

def create_environment_files(config):
    """Create environment configuration files."""
    print_header("Creating Environment Files")
    
    # Create backend .env for local testing
    backend_env = f"""# GP2Official Backend Configuration (Generated)

# Security
SECRET_KEY={config['secret_key']}
ENVIRONMENT=production
DEBUG=false

# Supabase Database
USE_SUPABASE=true
SUPABASE_URL={config['supabase_url']}
SUPABASE_SERVICE_KEY={config['supabase_service_key']}
SUPABASE_ANON_KEY={config['supabase_anon_key']}

# Database Pool Settings
DB_MIN_CONNECTIONS=2
DB_MAX_CONNECTIONS=20
DB_CONNECT_TIMEOUT=30
DB_RETRY_ATTEMPTS=3

# AI Configuration
LLM_PROVIDER={'gemini' if config['gemini_key'] else 'stub'}
GEMINI_API_KEY={config['gemini_key']}
HUGGINGFACE_API_KEY={config['huggingface_key']}
LLM_MODEL_NAME=gemini-pro

# CORS (will be updated after frontend deploy)
FRONTEND_ORIGIN=http://localhost:3000
"""
    
    with open("backend/.env.production", "w") as f:
        f.write(backend_env)
    
    print_success("Created backend/.env.production")
    
    # Create Render environment variables file
    render_env = f"""# Copy these to Render dashboard - Environment Variables

SECRET_KEY={config['secret_key']}
ENVIRONMENT=production
DEBUG=false

USE_SUPABASE=true
SUPABASE_URL={config['supabase_url']}
SUPABASE_SERVICE_KEY={config['supabase_service_key']}
SUPABASE_ANON_KEY={config['supabase_anon_key']}

DB_MIN_CONNECTIONS=2
DB_MAX_CONNECTIONS=20
DB_CONNECT_TIMEOUT=30

LLM_PROVIDER={'gemini' if config['gemini_key'] else 'stub'}
GEMINI_API_KEY={config['gemini_key']}
HUGGINGFACE_API_KEY={config['huggingface_key']}

FRONTEND_ORIGIN=https://YOUR_NETLIFY_SITE.netlify.app
"""
    
    with open("render-env-vars.txt", "w") as f:
        f.write(render_env)
    
    print_success("Created render-env-vars.txt")
    
    # Create Netlify environment variables file  
    netlify_env = f"""# Copy these to Netlify dashboard - Environment Variables

VITE_API_URL=https://YOUR_RENDER_BACKEND.onrender.com
NODE_VERSION=18
NODE_ENV=production
"""
    
    with open("netlify-env-vars.txt", "w") as f:
        f.write(netlify_env)
    
    print_success("Created netlify-env-vars.txt")

def run_deployment_steps():
    """Run all deployment preparation steps."""
    print_header("Running Deployment Preparation")
    
    scripts_dir = Path("scripts")
    
    steps = [
        (scripts_dir / "test-supabase.py", "Supabase Connection Test"),
        (scripts_dir / "deploy-render.py", "Render Backend Preparation"),
        (scripts_dir / "deploy-netlify.py", "Netlify Frontend Preparation"),
    ]
    
    results = []
    
    for script, description in steps:
        if script.exists():
            success = run_script(script, description)
            results.append((description, success))
        else:
            print_warning(f"Script not found: {script}")
            results.append((description, False))
    
    return results

def show_deployment_summary(results, config):
    """Show deployment summary and next steps."""
    print_header("Deployment Summary")
    
    # Show results
    for description, success in results:
        if success:
            print_success(f"{description}")
        else:
            print_error(f"{description}")
    
    print_header("Next Steps")
    
    print(f"{Colors.OKCYAN}1. Supabase Database:{Colors.ENDC}")
    print("   ✓ Schema should already be applied")
    print("   → Verify at: https://supabase.com/dashboard")
    
    print(f"\n{Colors.OKCYAN}2. Deploy Backend to Render:{Colors.ENDC}")
    print("   → Go to: https://render.com")
    print("   → New Blueprint → Select render-backend.yaml")
    print("   → Copy environment variables from: render-env-vars.txt")
    print("   → Deploy and test: https://YOUR_BACKEND.onrender.com/api/health")
    
    print(f"\n{Colors.OKCYAN}3. Deploy Frontend to Netlify:{Colors.ENDC}")
    print("   → Go to: https://netlify.com") 
    print("   → New Site from Git → Connect repository")
    print("   → Build settings: Base=frontend, Command=npm ci && npm run build")
    print("   → Copy environment variables from: netlify-env-vars.txt")
    print("   → Update VITE_API_URL with your Render backend URL")
    
    print(f"\n{Colors.OKCYAN}4. Final Configuration:{Colors.ENDC}")
    print("   → Update FRONTEND_ORIGIN in Render with your Netlify URL")
    print("   → Test full application flow")
    print("   → Set up custom domains (optional)")
    
    print(f"\n{Colors.WARNING}Important Files Created:{Colors.ENDC}")
    print("   • render-env-vars.txt - Copy to Render dashboard")
    print("   • netlify-env-vars.txt - Copy to Netlify dashboard")
    print("   • backend/.env.production - For local testing")
    print("   • DEPLOY_COMPLETE.md - Detailed deployment guide")
    
    print(f"\n{Colors.OKGREEN}Estimated Total Time: 30 minutes{Colors.ENDC}")

def main():
    """Main deployment orchestration function."""
    print_header("🚀 GP2Official Complete Deployment")
    print("Supabase → Render → Netlify")
    print("="*50)
    
    # Change to project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    os.chdir(project_root)
    
    # Check prerequisites
    if not check_prerequisites():
        print_error("Prerequisites not met. Please fix issues and try again.")
        sys.exit(1)
    
    # Collect deployment information
    config = collect_deployment_info()
    
    # Create environment files
    create_environment_files(config)
    
    # Run deployment preparation steps
    results = run_deployment_steps()
    
    # Show summary and next steps
    show_deployment_summary(results, config)
    
    print_header("🎉 Deployment Preparation Complete!")
    print_success("All scripts have been run and files prepared.")
    print_info("Follow the deployment guide: DEPLOY_COMPLETE.md")
    print_info("Or follow the Next Steps above.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Deployment preparation interrupted{Colors.ENDC}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Deployment preparation failed: {e}")
        sys.exit(1)
