#!/bin/bash

# GP2Official Development Server Startup Script
# This script starts both backend and frontend in development mode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌰 Starting GP2Official Development Environment${NC}"
echo "======================================================="

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    jobs -p | xargs -r kill
    exit 0
}

# Trap cleanup function on script exit
trap cleanup INT TERM

# Check if backend virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo -e "${RED}Backend virtual environment not found!${NC}"
    echo -e "${YELLOW}Run: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt${NC}"
    exit 1
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${RED}Frontend dependencies not installed!${NC}"
    echo -e "${YELLOW}Run: cd frontend && npm install${NC}"
    exit 1
fi

# Start backend server
echo -e "${GREEN}Starting backend server...${NC}"
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to initialize...${NC}"
sleep 5

# Check if backend is running
if ! curl -s http://localhost:8000/api/health > /dev/null; then
    echo -e "${RED}Backend failed to start!${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend server
echo -e "${GREEN}Starting frontend server...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo -e "${YELLOW}Waiting for frontend to initialize...${NC}"
sleep 3

echo -e "${GREEN}✓ Development servers started successfully!${NC}"
echo ""
echo -e "${BLUE}Access your application:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:  ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Wait for any background job to finish
wait
