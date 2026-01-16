# GP2Official Deployment Guide

This guide covers deployment options for GP2Official using Render, Netlify, and Supabase.

## Table of Contents

1. [Quick Deploy (Recommended)](#quick-deploy)
2. [Render Deployment](#render-deployment)
3. [Netlify + Supabase](#netlify--supabase)
4. [Docker Deployment](#docker-deployment)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

## Quick Deploy (Recommended)

### Option 1: Render (Full Stack)

The easiest way to deploy GP2Official is using Render's full-stack hosting:

1. **Fork this repository** to your GitHub account
2. **Connect to Render**:
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select `render.yaml` from the repository root

3. **Configure Environment Variables**:
   ```bash
   SECRET_KEY=your-super-secret-key-here-32-chars-min
   MONGO_URL=your-mongodb-connection-string
   DATABASE_NAME=architect_ai
   LLM_PROVIDER=gemini  # or huggingface, stub
   GEMINI_API_KEY=your-gemini-api-key  # if using Gemini
   HUGGINGFACE_API_KEY=your-hf-key     # if using HuggingFace
   ```

4. **Deploy**: Render will automatically build and deploy both frontend and backend

### Option 2: Netlify + Supabase (Serverless)

For a serverless approach:

1. **Deploy Frontend to Netlify**:
   - Connect your GitHub repo to Netlify
   - Set build command: `cd frontend && npm run build`
   - Set publish directory: `frontend/dist`

2. **Setup Supabase Database**:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/seed.sql`
   - Get your connection details

3. **Deploy Backend**:
   - Use Render/Railway for the FastAPI backend
   - Or deploy as serverless functions (advanced)

## Render Deployment

### Prerequisites

- GitHub repository
- Render account
- MongoDB Atlas account (or use Render's managed database)
- API keys for AI services (optional)

### Step-by-Step Render Setup

1. **Prepare Your Repository**
   ```bash
   git clone https://github.com/yourusername/GP2Official.git
   cd GP2Official
   ```

2. **Create Render Services**

   The `render.yaml` file will create:
   - **Backend**: FastAPI web service
   - **Frontend**: Static site
   - **Database**: PostgreSQL (or connect to MongoDB Atlas)
   - **Redis**: Cache layer

3. **Environment Configuration**

   Set these in Render dashboard or via `render.yaml`:

   ```yaml
   # Backend Environment Variables
   SECRET_KEY: "your-secret-key-minimum-32-characters"
   ENVIRONMENT: "production"
   DEBUG: "false"
   
   # Database
   MONGO_URL: "mongodb+srv://user:pass@cluster.mongodb.net"
   DATABASE_NAME: "architect_ai"
   
   # Redis Cache
   REDIS_URL: "redis://your-redis-url:6379"
   
   # AI Configuration
   LLM_PROVIDER: "gemini"  # or huggingface, stub
   GEMINI_API_KEY: "your-gemini-key"
   HUGGINGFACE_API_KEY: "your-huggingface-key"
   
   # Frontend URL (auto-populated by Render)
   FRONTEND_ORIGIN: "https://your-frontend-url.onrender.com"
   ```

4. **Deploy**
   - Push to GitHub
   - Render auto-deploys from `render.yaml`
   - Monitor build logs in Render dashboard

### Custom Domain Setup

1. In Render dashboard → Settings → Custom Domains
2. Add your domain: `yourdomain.com`
3. Update DNS records as shown
4. SSL is automatically provisioned

## Netlify + Supabase

### Supabase Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Setup Database Schema**
   ```sql
   -- Run this in Supabase SQL Editor
   -- Copy content from supabase/seed.sql
   ```

3. **Configure Row Level Security**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
   -- ... (see supabase/seed.sql for all policies)
   ```

### Netlify Frontend Deployment

1. **Connect Repository**
   - Login to Netlify
   - Click "New site from Git"
   - Select your repository

2. **Build Settings**
   ```bash
   # Build command
   cd frontend && npm ci && npm run build
   
   # Publish directory
   frontend/dist
   
   # Environment variables
   REACT_APP_API_URL=https://your-backend.onrender.com
   ```

3. **Configure Redirects**
   The `netlify.toml` file handles:
   - SPA routing
   - API proxy rules
   - Security headers

### Backend Deployment Options

**Option A: Render (Recommended)**
- Use Render's web service for the FastAPI backend
- Connect to Supabase instead of MongoDB

**Option B: Serverless Functions**
- Convert FastAPI routes to Netlify Functions
- Requires significant refactoring (advanced)

## Docker Deployment

### Local Development with Docker

1. **Clone and Configure**
   ```bash
   git clone https://github.com/yourusername/GP2Official.git
   cd GP2Official
   
   # Create environment file
   cp backend/.env.example backend/.env
   # Edit backend/.env with your values
   ```

2. **Start Services**
   ```bash
   # Start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop services
   docker-compose down
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Production Docker Deployment

**Using Docker Swarm:**
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml gp2official

# Scale services
docker service scale gp2official_backend=3
```

**Using Kubernetes:**
```bash
# Apply configurations
kubectl apply -f k8s/

# Check status
kubectl get pods -n gp2official
```

## Environment Variables

### Backend (.env)

```env
# Required for Production
SECRET_KEY=your-secret-key-minimum-32-characters-long
ENVIRONMENT=production
DEBUG=false

# Database Configuration
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/dbname
DATABASE_NAME=architect_ai
USE_IN_MEMORY_DB=false

# Redis Cache (Optional but Recommended)
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600

# CORS Configuration
FRONTEND_ORIGIN=https://yourdomain.com

# AI Configuration (Optional)
LLM_PROVIDER=gemini  # Options: stub, gemini, huggingface
GEMINI_API_KEY=your-gemini-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key
LLM_MODEL_NAME=gemini-pro

# Database Pool Settings
DB_MIN_CONNECTIONS=1
DB_MAX_CONNECTIONS=10
DB_CONNECT_TIMEOUT=30
DB_RETRY_ATTEMPTS=3
```

### Frontend Environment

```env
# API Configuration
REACT_APP_API_URL=https://your-backend-url.com

# Build Configuration
NODE_ENV=production
```

## Database Setup

### MongoDB Atlas (Recommended)

1. **Create Cluster**
   - Sign up at [mongodb.com](https://www.mongodb.com/atlas)
   - Create free M0 cluster
   - Add your IP to whitelist

2. **Create Database User**
   ```bash
   # Username: gp2official
   # Password: generate secure password
   # Role: readWrite
   ```

3. **Get Connection String**
   ```bash
   mongodb+srv://gp2official:<password>@cluster0.xxxxx.mongodb.net/architect_ai?retryWrites=true&w=majority
   ```

### Supabase (Alternative)

1. **Create Project**
   - Sign up at [supabase.com](https://supabase.com)
   - Create new project
   - Note project URL and service key

2. **Run Schema**
   ```sql
   -- Execute supabase/seed.sql in SQL editor
   ```

3. **Configure Backend**
   ```env
   # Use Supabase adapter (requires code changes)
   DATABASE_TYPE=postgresql
   DATABASE_URL=postgresql://user:pass@host:port/db
   ```

## Monitoring & Maintenance

### Health Checks

The application includes several health check endpoints:

```bash
# Backend health
curl https://your-backend.com/api/health

# AI Pipeline health
curl https://your-backend.com/api/ai/health

# Database connectivity
curl https://your-backend.com/api/health/db
```

### Monitoring Setup

**Using Render:**
- Built-in metrics dashboard
- Set up alerts for downtime
- Monitor resource usage

**Custom Monitoring:**
```bash
# Add to your monitoring stack
- Prometheus metrics endpoint: /metrics
- Health checks: /api/health
- Error tracking: Sentry integration
```

### Performance Optimization

1. **Enable Redis Caching**
   ```env
   REDIS_URL=your-redis-connection-string
   CACHE_TTL=3600
   ```

2. **Database Optimization**
   ```env
   DB_MAX_CONNECTIONS=20
   DB_MIN_CONNECTIONS=5
   ```

3. **Frontend Optimization**
   ```bash
   # Ensure code splitting is enabled
   npm run build  # Uses optimized Vite config
   ```

### Backup Strategy

**MongoDB Atlas:**
- Automatic backups included
- Point-in-time recovery available

**Manual Backups:**
```bash
# Export database
mongodump --uri="your-mongodb-uri" --out=backup/

# Import database
mongorestore --uri="your-mongodb-uri" backup/
```

## Troubleshooting

### Common Issues

**1. Build Failures**
```bash
# Backend build fails
- Check Python version (3.11+ required)
- Verify all dependencies in requirements.txt
- Check environment variables

# Frontend build fails
- Check Node.js version (18+ required)
- Clear node_modules: rm -rf node_modules && npm install
- Check TypeScript errors
```

**2. Database Connection Issues**
```bash
# MongoDB connection fails
- Verify connection string format
- Check IP whitelist in MongoDB Atlas
- Test connection locally

# Connection timeout
- Increase DB_CONNECT_TIMEOUT
- Check network connectivity
```

**3. Authentication Problems**
```bash
# JWT token issues
- Verify SECRET_KEY is set and consistent
- Check token expiration settings
- Clear browser localStorage
```

**4. AI Generation Failures**
```bash
# LLM API errors
- Verify API keys are correct
- Check API quotas and limits
- Fall back to stub mode for testing
```

### Debug Mode

Enable debug mode for troubleshooting:

```env
DEBUG=true
LOG_LEVEL=debug
```

### Getting Help

1. **Check Logs**
   ```bash
   # Render logs
   render logs your-service-name
   
   # Docker logs
   docker-compose logs backend
   ```

2. **Application Logs**
   - Backend logs show database connections, AI API calls
   - Frontend console shows API errors
   - Check network tab for failed requests

3. **Support Resources**
   - GitHub Issues
   - Render Community Forum
   - Supabase Discord

### Performance Tuning

**Backend Optimization:**
```env
# Increase worker processes
WORKER_COUNT=4

# Adjust database pool
DB_MAX_CONNECTIONS=25
DB_MIN_CONNECTIONS=5

# Enable caching
REDIS_URL=your-redis-url
CACHE_TTL=1800
```

**Frontend Optimization:**
```bash
# Enable gzip compression (in nginx.conf)
gzip on;
gzip_types text/plain text/css application/javascript;

# Optimize bundle size
npm run build --analyze
```

## Security Checklist

- [ ] Strong SECRET_KEY (32+ characters)
- [ ] DEBUG=false in production
- [ ] HTTPS enabled (automatic with Render/Netlify)
- [ ] Database credentials secured
- [ ] API keys in environment variables (not code)
- [ ] CORS properly configured
- [ ] Input validation enabled
- [ ] Rate limiting configured
- [ ] Regular security updates

## Cost Optimization

### Free Tier Limits

**Render Free Tier:**
- 750 hours/month web service
- Automatic sleep after 15min inactivity
- 100GB bandwidth

**Netlify Free Tier:**
- 300 build minutes/month
- 100GB bandwidth

**MongoDB Atlas Free:**
- 512MB storage
- Shared clusters

### Scaling Recommendations

**Small Team (1-10 users):**
- Render: Starter plan ($7/month)
- MongoDB Atlas: M10 cluster ($57/month)
- Total: ~$65/month

**Medium Team (10-50 users):**
- Render: Standard plan ($25/month)
- MongoDB Atlas: M20 cluster ($115/month)
- Redis: Render Redis ($15/month)
- Total: ~$155/month

**Large Team (50+ users):**
- Render: Pro plan ($85/month)
- MongoDB Atlas: M30+ cluster ($200+/month)
- Custom monitoring and backup solutions
- Total: $300+/month

---

## Support

For deployment help and issues:

- **Documentation**: Check this deployment guide first
- **GitHub Issues**: Report bugs and feature requests
- **Community**: Join our Discord/Slack for real-time help
- **Professional Support**: Contact for enterprise deployments

Happy deploying! 🚀
