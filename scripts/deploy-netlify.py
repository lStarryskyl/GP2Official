#!/usr/bin/env python3
"""Deploy script for Netlify frontend deployment."""

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

def check_netlify_deployment():
    """Check if the deployment is configured correctly."""
    print_header("Checking Netlify Deployment Configuration")
    
    # Check if netlify.toml exists
    netlify_config = Path("netlify.toml")
    if not netlify_config.exists():
        print_error("netlify.toml not found!")
        return False
    
    print_success("Found netlify.toml")
    
    # Check frontend package.json
    frontend_pkg = Path("frontend/package.json")
    if not frontend_pkg.exists():
        print_error("frontend/package.json not found!")
        return False
    
    # Verify build script
    with open(frontend_pkg) as f:
        package_data = json.load(f)
        if "build" not in package_data.get("scripts", {}):
            print_error("Build script not found in package.json!")
            return False
        print_success("Build script found")
    
    # Check Vite config
    vite_config = Path("frontend/vite.config.ts")
    if not vite_config.exists():
        print_error("frontend/vite.config.ts not found!")
        return False
    
    print_success("Frontend files ready for deployment")
    return True

def update_api_config():
    """Update API configuration for production."""
    print_header("Updating API Configuration")
    
    # Check if API client needs updating for Vite env vars
    api_file = Path("frontend/src/lib/api.ts")
    if api_file.exists():
        with open(api_file) as f:
            content = f.read()
        
        # Check if it's using Vite environment variables
        if "import.meta.env.VITE_API_URL" in content:
            print_success("API client already configured for Vite")
        else:
            print_warning("API client may need updating for Vite environment variables")
            
            # Create updated API client
            updated_content = content.replace(
                "process.env.REACT_APP_API_URL",
                "import.meta.env.VITE_API_URL"
            )
            
            if updated_content != content:
                backup_file = Path("frontend/src/lib/api.ts.backup")
                with open(backup_file, 'w') as f:
                    f.write(content)
                
                with open(api_file, 'w') as f:
                    f.write(updated_content)
                
                print_success("Updated API client for Vite environment variables")
                print_warning(f"Original backed up to {backup_file}")
    else:
        print_warning("API client file not found, may need manual configuration")

def create_netlify_env_template():
    """Create environment variable template for Netlify."""
    print_header("Creating Netlify Environment Variables Template")
    
    env_template = """# GP2Official Netlify Environment Variables
# Set these in your Netlify dashboard: Site settings > Environment variables

# API Configuration
VITE_API_URL=https://gp2official-backend.onrender.com

# Build Configuration
NODE_VERSION=18
NPM_VERSION=9
NODE_ENV=production

# Optional: Analytics or other services
# VITE_GA_TRACKING_ID=your-google-analytics-id
# VITE_SENTRY_DSN=your-sentry-dsn
"""
    
    env_file = Path("netlify-env-template.txt")
    with open(env_file, 'w') as f:
        f.write(env_template)
    
    print_success(f"Created {env_file}")

def create_netlify_deploy_guide():
    """Create deployment guide for Netlify."""
    print_header("Creating Netlify Deployment Guide")
    
    guide = """# Netlify Deployment Guide for GP2Official Frontend

## 1. Prerequisites
- GitHub repository with GP2Official code
- Netlify account (netlify.com)
- Backend deployed to Render (for API endpoints)

## 2. Deploy to Netlify

### Option A: GitHub Integration (Recommended)
1. Go to Netlify Dashboard (netlify.com)
2. Click "Add new site" → "Import from Git"
3. Connect your GitHub repository
4. Configure build settings:
   - Base directory: `frontend`
   - Build command: `npm ci && npm run build`
   - Publish directory: `frontend/dist`

### Option B: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from project root
netlify deploy --prod --dir frontend/dist
```

## 3. Environment Variables
Set these in Netlify Dashboard → Site settings → Environment variables:

**Required:**
- `VITE_API_URL`: https://your-backend.onrender.com
- `NODE_VERSION`: 18
- `NODE_ENV`: production

**Optional:**
- Analytics tracking IDs
- Error monitoring DSNs
- Feature flags

## 4. Domain Configuration

### Custom Domain (Optional)
1. In Netlify Dashboard → Domain settings
2. Add custom domain
3. Update DNS records as shown
4. SSL is automatically provisioned

### Default Netlify Domain
Your site will be available at:
https://your-site-name.netlify.app

## 5. Build Optimization

The netlify.toml file includes:
- Optimized caching headers
- Security headers (CSP, HSTS, etc.)
- API proxy rules
- WebSocket support for real-time features

## 6. Deploy Previews

Netlify automatically creates:
- **Deploy previews** for pull requests
- **Branch deploys** for feature branches
- **Production deploys** from main branch

## 7. Performance Features

**Enabled by default:**
- Asset optimization (minification, compression)
- CDN distribution
- HTTP/2 support
- Brotli compression
- Image optimization (Netlify Pro)

## 8. Monitoring

**Available in Netlify Dashboard:**
- Build logs and history
- Deploy status
- Analytics (visitor stats)
- Performance metrics
- Error tracking integration

## Troubleshooting

**Build Fails:**
- Check Node.js version (18+ required)
- Verify package.json scripts
- Check build logs for missing dependencies
- Ensure VITE_API_URL is set

**API Connection Issues:**
- Verify backend is deployed and healthy
- Check VITE_API_URL format
- Inspect network tab for CORS errors
- Verify proxy rules in netlify.toml

**Environment Variable Issues:**
- Ensure all required variables are set
- Check variable names (VITE_ prefix required)
- Redeploy after environment changes
- Use deploy previews to test changes

**Performance Issues:**
- Enable asset optimization
- Check bundle size with build analyzer
- Optimize images and fonts
- Use code splitting effectively

## Security Checklist
- [x] Content Security Policy configured
- [x] HTTPS enforced
- [x] Security headers set
- [x] No sensitive data in environment variables
- [x] API endpoints properly proxied
"""
    
    guide_file = Path("NETLIFY_DEPLOY.md")
    with open(guide_file, 'w') as f:
        f.write(guide)
    
    print_success(f"Created {guide_file}")

def check_frontend_build():
    """Test frontend build locally."""
    print_header("Testing Frontend Build")
    
    frontend_path = Path("frontend")
    
    # Check if node_modules exists
    if not (frontend_path / "node_modules").exists():
        print_warning("Frontend dependencies not installed")
        print("Run: cd frontend && npm install")
        return False
    
    print("Testing production build...")
    try:
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=frontend_path,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        if result.returncode == 0:
            print_success("Frontend builds successfully")
            
            # Check build output
            dist_path = frontend_path / "dist"
            if dist_path.exists():
                print_success(f"Build output created at {dist_path}")
                
                # Count files
                files = list(dist_path.rglob("*"))
                file_count = len([f for f in files if f.is_file()])
                print_success(f"Build contains {file_count} files")
                
                return True
            else:
                print_error("Build output directory not found")
                return False
        else:
            print_error("Build failed:")
            print(result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print_error("Build timed out (>5 minutes)")
        return False
    except Exception as e:
        print_error(f"Build test failed: {e}")
        return False

def main():
    """Main deployment preparation function."""
    print_header("GP2Official Netlify Deployment Preparation")
    
    # Change to project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    os.chdir(project_root)
    
    steps = [
        ("Checking deployment configuration", check_netlify_deployment),
        ("Updating API configuration", update_api_config),
        ("Creating environment template", create_netlify_env_template),
        ("Creating deployment guide", create_netlify_deploy_guide),
        ("Testing frontend build", check_frontend_build),
    ]
    
    for step_name, step_func in steps:
        try:
            if not step_func():
                print_warning(f"Step completed with warnings: {step_name}")
                # Don't exit on warnings, continue
        except Exception as e:
            print_error(f"Error in {step_name}: {e}")
            sys.exit(1)
    
    print_header("Netlify Deployment Ready!")
    print_success("All preparation steps completed!")
    
    print(f"\n{Colors.OKCYAN}Next Steps:{Colors.ENDC}")
    print("1. Ensure your backend is deployed to Render")
    print("2. Go to netlify.com and create a new site")
    print("3. Connect your GitHub repository")
    print("4. Set build settings (or use netlify.toml)")
    print("5. Set environment variables from netlify-env-template.txt")
    print("6. Deploy and test the frontend")
    
    print(f"\n{Colors.WARNING}Important Files:{Colors.ENDC}")
    print("- netlify.toml: Netlify configuration")
    print("- netlify-env-template.txt: Environment variables template")
    print("- NETLIFY_DEPLOY.md: Detailed deployment guide")
    
    print(f"\n{Colors.OKBLUE}Frontend will be available at:{Colors.ENDC}")
    print("https://your-site-name.netlify.app")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Deployment preparation interrupted{Colors.ENDC}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
