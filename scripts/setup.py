#!/usr/bin/env python3
"""Setup script for GP2Official development environment."""

import os
import sys
import subprocess
import secrets
import string
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

def run_command(command, cwd=None, check=True):
    """Run a shell command and return the result."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=check
        )
        return result
    except subprocess.CalledProcessError as e:
        print_error(f"Command failed: {command}")
        print_error(f"Error: {e.stderr}")
        return None

def check_prerequisites():
    """Check if required tools are installed."""
    print_header("Checking Prerequisites")
    
    required_tools = {
        'python3': 'Python 3.11+',
        'node': 'Node.js 18+',
        'npm': 'npm package manager',
        'git': 'Git version control'
    }
    
    missing_tools = []
    
    for tool, description in required_tools.items():
        result = run_command(f"which {tool}", check=False)
        if result and result.returncode == 0:
            print_success(f"{description} found")
        else:
            missing_tools.append(f"{tool} ({description})")
            print_error(f"{description} not found")
    
    if missing_tools:
        print_error("Missing required tools:")
        for tool in missing_tools:
            print(f"  - {tool}")
        print("\nPlease install missing tools and run setup again.")
        return False
    
    return True

def generate_secret_key():
    """Generate a secure secret key."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    secret_key = ''.join(secrets.choice(alphabet) for _ in range(32))
    return secret_key

def create_env_file():
    """Create backend .env file with default values."""
    print_header("Creating Environment File")
    
    env_path = Path("backend/.env")
    
    if env_path.exists():
        response = input("Backend .env file already exists. Overwrite? (y/N): ")
        if response.lower() != 'y':
            print_warning("Skipping .env file creation")
            return
    
    secret_key = generate_secret_key()
    
    env_content = f"""# GP2Official Backend Configuration

# Security
SECRET_KEY={secret_key}
ENVIRONMENT=development
DEBUG=true

# Database Configuration
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=architect_ai
USE_IN_MEMORY_DB=true

# Cache Configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# Database Pool Settings
DB_MIN_CONNECTIONS=1
DB_MAX_CONNECTIONS=10
DB_CONNECT_TIMEOUT=30
DB_RETRY_ATTEMPTS=3

# CORS Configuration  
FRONTEND_ORIGIN=http://localhost:3000

# AI Configuration (Optional)
LLM_PROVIDER=stub
LLM_API_KEY=
GEMINI_API_KEY=
HUGGINGFACE_API_KEY=
LLM_MODEL_NAME=gpt-4

# PlantUML Configuration
PLANTUML_API_HOST=
PLANTUML_API_KEY=
"""
    
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print_success("Created backend/.env file")
    print_warning("Remember to update API keys for production use")

def setup_backend():
    """Setup Python backend environment."""
    print_header("Setting Up Backend")
    
    backend_path = Path("backend")
    
    # Check Python version
    result = run_command("python3 --version")
    if result:
        version_str = result.stdout.strip()
        print_success(f"Using {version_str}")
    
    # Create virtual environment
    venv_path = backend_path / "venv"
    if not venv_path.exists():
        print("Creating virtual environment...")
        result = run_command("python3 -m venv venv", cwd=backend_path)
        if result:
            print_success("Created virtual environment")
        else:
            print_error("Failed to create virtual environment")
            return False
    else:
        print_success("Virtual environment already exists")
    
    # Activate virtual environment and install dependencies
    if sys.platform == "win32":
        pip_cmd = "venv\\Scripts\\pip"
    else:
        pip_cmd = "venv/bin/pip"
    
    print("Installing Python dependencies...")
    result = run_command(f"{pip_cmd} install --upgrade pip", cwd=backend_path)
    if not result:
        print_error("Failed to upgrade pip")
        return False
    
    result = run_command(f"{pip_cmd} install -r requirements.txt", cwd=backend_path)
    if result:
        print_success("Installed Python dependencies")
    else:
        print_error("Failed to install Python dependencies")
        return False
    
    return True

def setup_frontend():
    """Setup Node.js frontend environment."""
    print_header("Setting Up Frontend")
    
    frontend_path = Path("frontend")
    
    # Check Node.js version
    result = run_command("node --version")
    if result:
        version_str = result.stdout.strip()
        print_success(f"Using Node.js {version_str}")
    
    # Install dependencies
    print("Installing Node.js dependencies...")
    result = run_command("npm ci", cwd=frontend_path)
    if result:
        print_success("Installed Node.js dependencies")
    else:
        print_error("Failed to install Node.js dependencies")
        return False
    
    return True

def setup_database():
    """Setup database (MongoDB or in-memory)."""
    print_header("Database Setup")
    
    print("GP2Official can use:")
    print("1. In-memory database (no setup required, data not persisted)")
    print("2. MongoDB (requires MongoDB installation)")
    print("3. MongoDB Atlas (cloud database)")
    
    choice = input("Choose database option (1/2/3) [1]: ").strip()
    
    if choice == "2":
        # Check if MongoDB is running
        result = run_command("mongosh --eval 'db.runCommand({ping: 1})'", check=False)
        if result and result.returncode == 0:
            print_success("MongoDB is running locally")
        else:
            print_warning("MongoDB not detected. Please install and start MongoDB:")
            print("  - macOS: brew install mongodb-community && brew services start mongodb-community")
            print("  - Ubuntu: sudo apt install mongodb && sudo systemctl start mongodb")
            print("  - Windows: Download from https://www.mongodb.com/download-center/community")
    
    elif choice == "3":
        print("To use MongoDB Atlas:")
        print("1. Sign up at https://www.mongodb.com/atlas")
        print("2. Create a free M0 cluster")
        print("3. Get your connection string")
        print("4. Update MONGO_URL in backend/.env")
        print("5. Set USE_IN_MEMORY_DB=false in backend/.env")
    
    else:
        print_success("Using in-memory database (default)")
        print_warning("Data will not persist between server restarts")
    
    return True

def setup_redis():
    """Setup Redis cache (optional)."""
    print_header("Redis Setup (Optional)")
    
    # Check if Redis is available
    result = run_command("redis-cli ping", check=False)
    if result and result.returncode == 0 and "PONG" in result.stdout:
        print_success("Redis is running and available")
        return True
    
    print_warning("Redis not detected. Caching will be disabled.")
    print("To enable caching, install Redis:")
    print("  - macOS: brew install redis && brew services start redis")
    print("  - Ubuntu: sudo apt install redis-server && sudo systemctl start redis-server")
    print("  - Windows: Use Docker or WSL")
    print("  - Docker: docker run -d -p 6379:6379 redis:alpine")
    
    return True

def create_startup_scripts():
    """Create convenience startup scripts."""
    print_header("Creating Startup Scripts")
    
    scripts_dir = Path("scripts")
    scripts_dir.mkdir(exist_ok=True)
    
    # Development start script
    if sys.platform == "win32":
        start_script = scripts_dir / "start-dev.bat"
        script_content = """@echo off
echo Starting GP2Official Development Server...

REM Start backend
start "Backend" cmd /c "cd backend && venv\\Scripts\\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start frontend
start "Frontend" cmd /c "cd frontend && npm run dev"

echo Both servers starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
pause
"""
    else:
        start_script = scripts_dir / "start-dev.sh"
        script_content = """#!/bin/bash
echo "Starting GP2Official Development Server..."

# Start backend in background
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a moment
sleep 3

# Start frontend in background
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Both servers started!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap cleanup function on script exit
trap cleanup INT TERM

# Wait for any process to exit
wait
"""
    
    with open(start_script, 'w') as f:
        f.write(script_content)
    
    # Make executable on Unix systems
    if not sys.platform == "win32":
        os.chmod(start_script, 0o755)
    
    print_success(f"Created {start_script}")
    
    # Test script
    test_script = scripts_dir / "test.py"
    test_content = """#!/usr/bin/env python3
\"\"\"Run tests for GP2Official.\"\"\"

import subprocess
import sys
from pathlib import Path

def run_backend_tests():
    \"\"\"Run backend tests.\"\"\"
    print("Running backend tests...")
    backend_path = Path("backend")
    
    if sys.platform == "win32":
        pytest_cmd = "venv\\\\Scripts\\\\pytest"
    else:
        pytest_cmd = "venv/bin/pytest"
    
    result = subprocess.run(
        [pytest_cmd, "-v", "--cov=.", "--cov-report=term-missing"],
        cwd=backend_path
    )
    
    return result.returncode == 0

def run_frontend_tests():
    \"\"\"Run frontend tests.\"\"\"
    print("Running frontend tests...")
    frontend_path = Path("frontend")
    
    result = subprocess.run(["npm", "test"], cwd=frontend_path)
    return result.returncode == 0

if __name__ == "__main__":
    backend_success = run_backend_tests()
    frontend_success = run_frontend_tests()
    
    if backend_success and frontend_success:
        print("All tests passed! ✓")
        sys.exit(0)
    else:
        print("Some tests failed! ✗")
        sys.exit(1)
"""
    
    with open(test_script, 'w') as f:
        f.write(test_content)
    
    if not sys.platform == "win32":
        os.chmod(test_script, 0o755)
    
    print_success(f"Created {test_script}")

def verify_setup():
    """Verify the setup is working."""
    print_header("Verifying Setup")
    
    # Test backend import
    try:
        sys.path.append(str(Path("backend")))
        from config import settings
        print_success("Backend configuration loads successfully")
    except Exception as e:
        print_error(f"Backend setup issue: {e}")
        return False
    
    # Check frontend build
    print("Testing frontend build...")
    result = run_command("npm run build", cwd="frontend", check=False)
    if result and result.returncode == 0:
        print_success("Frontend builds successfully")
    else:
        print_warning("Frontend build failed - check for TypeScript errors")
    
    return True

def main():
    """Main setup function."""
    print_header("GP2Official Development Environment Setup")
    print("This script will set up your development environment.\n")
    
    # Change to project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    os.chdir(project_root)
    
    # Run setup steps
    steps = [
        ("Checking prerequisites", check_prerequisites),
        ("Creating environment file", create_env_file),
        ("Setting up backend", setup_backend),
        ("Setting up frontend", setup_frontend),
        ("Setting up database", setup_database),
        ("Setting up Redis cache", setup_redis),
        ("Creating startup scripts", create_startup_scripts),
        ("Verifying setup", verify_setup),
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print_error(f"Setup failed at step: {step_name}")
            sys.exit(1)
    
    print_header("Setup Complete!")
    print_success("GP2Official development environment is ready!")
    
    print(f"\n{Colors.OKCYAN}Next Steps:{Colors.ENDC}")
    print("1. Update backend/.env with your API keys (optional)")
    print("2. Start the development server:")
    
    if sys.platform == "win32":
        print("   scripts\\start-dev.bat")
    else:
        print("   ./scripts/start-dev.sh")
    
    print("3. Visit http://localhost:3000")
    print("4. Check API docs at http://localhost:8000/docs")
    
    print(f"\n{Colors.WARNING}Important:{Colors.ENDC}")
    print("- Default setup uses in-memory database (data not persisted)")
    print("- AI features use stub mode (no real AI calls)")
    print("- For production, configure proper database and AI API keys")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Setup interrupted by user{Colors.ENDC}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Setup failed with unexpected error: {e}")
        sys.exit(1)
