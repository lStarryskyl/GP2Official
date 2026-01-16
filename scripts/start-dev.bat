@echo off
:: GP2Official Development Server Startup Script (Windows)
:: This script starts both backend and frontend in development mode

setlocal enabledelayedexpansion

echo 🌰 Starting GP2Official Development Environment
echo =======================================================

:: Check if we're in the project root
if not exist "docker-compose.yml" (
    echo Error: Please run this script from the project root directory
    goto :error
)
if not exist "backend" (
    echo Error: Backend directory not found
    goto :error
)
if not exist "frontend" (
    echo Error: Frontend directory not found
    goto :error
)

:: Check if backend virtual environment exists
if not exist "backend\venv" (
    echo Error: Backend virtual environment not found!
    echo Run: cd backend ^&^& python -m venv venv ^&^& venv\Scripts\activate ^&^& pip install -r requirements.txt
    goto :error
)

:: Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo Error: Frontend dependencies not installed!
    echo Run: cd frontend ^&^& npm install
    goto :error
)

:: Start backend server in new window
echo Starting backend server...
start "GP2Official Backend" cmd /c "cd backend && venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Wait for backend to initialize
echo Waiting for backend to initialize...
timeout /t 8 /nobreak >nul

:: Check if backend is running (simple check)
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8000/api/health' -UseBasicParsing -TimeoutSec 5 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo Warning: Backend may not have started properly
    echo Check the backend window for errors
)

:: Start frontend server in new window
echo Starting frontend server...
start "GP2Official Frontend" cmd /c "cd frontend && npm run dev"

:: Wait for frontend to initialize
echo Waiting for frontend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ✓ Development servers started successfully!
echo.
echo Access your application:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
goto :end

:error
echo.
echo Setup failed. Please check the error messages above.
pause
exit /b 1

:end
endlocal
