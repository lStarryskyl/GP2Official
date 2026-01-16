# 🚀 GP2Official Quick Deploy Guide
## Your Project: qscbybwxuybptijwdyvc

**Ready to deploy with your actual Supabase project!**

## ⚡ 15-Minute Express Deploy

### Step 1: Complete Supabase Setup (5 minutes)

1. **Go to your Supabase dashboard**: https://supabase.com/dashboard/project/qscbybwxuybptijwdyvc

2. **Create the database schema**:
   - Click **"SQL Editor"**
   - Click **"New Query"** 
   - Copy and paste the entire contents of `supabase/seed.sql`
   - Click **"Run"** 

3. **Get your service role key**:
   - Go to **Settings → API**
   - Copy the **`service_role`** key (secret key for backend)
   - Your **anon key** is already configured: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. **Get your database password**:
   - Go to **Settings → Database** 
   - Find your database password (or reset it)

### Step 2: Deploy Backend to Render (5 minutes)

1. **Go to Render**: https://render.com/dashboard

2. **Create new Blueprint**:
   - Click **"New"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select **`render-backend.yaml`**

3. **Set these environment variables** in Render:
   ```
   SECRET_KEY=your-32-character-secret-key
   SUPABASE_URL=postgresql://postgres:[YOUR-DB-PASSWORD]@db.qscbybwxuybptijwdyvc.supabase.co:5432/postgres
   SUPABASE_SERVICE_KEY=[YOUR-SERVICE-ROLE-KEY-FROM-SUPABASE]
   ```

4. **Deploy**: Click **"Apply"** and wait ~3 minutes

### Step 3: Deploy Frontend to Netlify (5 minutes)

1. **Go to Netlify**: https://app.netlify.com

2. **Deploy from Git**:
   - Click **"Add new site"** → **"Import from Git"**
   - Connect your GitHub repository
   - Build settings:
     - **Base directory**: `frontend`
     - **Build command**: `npm ci && npm run build`
     - **Publish directory**: `frontend/dist`

3. **Update API URL**:
   - After Render deploys, copy your backend URL
   - In Netlify: **Site settings** → **Environment variables**
   - Update `VITE_API_URL` with your Render backend URL

4. **Deploy**: Netlify builds automatically

## ✅ Test Your Deployment

1. **Backend Health Check**: 
   - Visit: `https://your-backend.onrender.com/api/health`
   - Should return: `{"status": "healthy"}`

2. **Frontend Test**:
   - Visit your Netlify site
   - Register a new account
   - Create a test project

## 🔧 Quick Fix Commands

If something goes wrong, run these:

```bash
# Test Supabase connection locally
export SUPABASE_URL="postgresql://postgres:[password]@db.qscbybwxuybptijwdyvc.supabase.co:5432/postgres"
export SUPABASE_SERVICE_KEY="your-service-key"
python3 scripts/test-supabase.py

# Test frontend build locally
cd frontend
npm install
npm run build
```

## 🎯 Your Actual Project URLs

- **Supabase Dashboard**: https://supabase.com/dashboard/project/qscbybwxuybptijwdyvc
- **Supabase API**: https://qscbybwxuybptijwdyvc.supabase.co
- **Database**: `db.qscbybwxuybptijwdyvc.supabase.co:5432`

## 🆘 Need Help?

**Common Issues:**
- **Backend won't connect to DB**: Check database password and service key
- **Frontend can't reach API**: Update VITE_API_URL in Netlify settings
- **Build fails**: Run the test commands above locally first

**Your configuration is already set up with:**
- ✅ Real Supabase project credentials
- ✅ Optimized caching and security headers  
- ✅ WebSocket support for real-time features
- ✅ Production-ready environment configs

**Ready to deploy? Start with Step 1! 🚀**
