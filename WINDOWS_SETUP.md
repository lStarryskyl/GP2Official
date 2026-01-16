# 🪟 Windows Setup Guide for GP2Official

## 🔧 Quick Fix for Your Current Issues

You're currently in `C:\Acron` but need to be in `C:\Acron\GP2Official`. Here's how to fix:

```powershell
# Navigate to the project directory
cd C:\Acron\GP2Official

# Use Windows-compatible commands
python scripts/test-your-supabase.py  # Use 'python' not 'python3'
Get-Content QUICK_DEPLOY.md           # Use 'Get-Content' not 'cat'

# Alternative: use type command
type QUICK_DEPLOY.md
```

## 🔑 Your API Keys (Already Configured)

✅ **OpenAI API Key**: `sk-proj-ZUAFOrAFPlPmKOdcYfVNbW...` (added to config)
✅ **Supabase Project**: `qscbybwxuybptijwdyvc` (configured)

## ⚡ Windows Quick Deploy Steps

### Step 1: Set Environment Variables
```powershell
# Set your API keys
$env:OPENAI_API_KEY="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"
$env:SUPABASE_DB_PASSWORD="your-supabase-db-password"
$env:SUPABASE_SERVICE_KEY="your-supabase-service-key"
```

### Step 2: Test Supabase Connection
```powershell
cd C:\Acron\GP2Official
python scripts/test-your-supabase.py
```

### Step 3: View Quick Deploy Guide
```powershell
Get-Content QUICK_DEPLOY.md
# or
type QUICK_DEPLOY.md
```

## 🛠️ Windows Command Equivalents

| Linux/Mac | Windows PowerShell | Description |
|-----------|-------------------|-------------|
| `python3` | `python` | Python interpreter |
| `cat file.md` | `Get-Content file.md` | View file contents |
| `ls` | `Get-ChildItem` or `ls` | List directory |
| `chmod +x script.py` | Not needed | Make executable |
| `export VAR=value` | `$env:VAR="value"` | Set environment variable |

## 🚀 Run This Now

Execute these commands in PowerShell:

```powershell
# Navigate to project
cd C:\Acron\GP2Official

# Set your OpenAI API key
$env:OPENAI_API_KEY="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"

# View the deployment guide
type QUICK_DEPLOY.md

# Test your setup (when you have Supabase credentials)
python scripts/test-your-supabase.py
```

## 📱 Need Your Supabase Credentials

You still need to get from Supabase dashboard:
1. **Database Password**: Settings → Database
2. **Service Role Key**: Settings → API → service_role key

Once you have these, you're ready to deploy! 🎉
