#!/bin/bash

# GP2Official Test Runner Script
# Runs both backend and frontend tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Running GP2Official Tests${NC}"
echo "=================================="

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

BACKEND_SUCCESS=0
FRONTEND_SUCCESS=0

# Run backend tests
echo -e "${YELLOW}Running backend tests...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo -e "${RED}Backend virtual environment not found!${NC}"
    echo -e "${YELLOW}Run setup first: python3 scripts/setup.py${NC}"
    exit 1
fi

source venv/bin/activate

# Run pytest with coverage
if pytest -v --cov=. --cov-report=term-missing --cov-report=html:htmlcov --cov-fail-under=80; then
    echo -e "${GREEN}✓ Backend tests passed${NC}"
    BACKEND_SUCCESS=1
else
    echo -e "${RED}✗ Backend tests failed${NC}"
fi

cd ..

# Run frontend tests
echo -e "${YELLOW}Running frontend tests...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo -e "${RED}Frontend dependencies not installed!${NC}"
    echo -e "${YELLOW}Run: npm install${NC}"
    exit 1
fi

if npm test; then
    echo -e "${GREEN}✓ Frontend tests passed${NC}"
    FRONTEND_SUCCESS=1
else
    echo -e "${RED}✗ Frontend tests failed${NC}"
fi

cd ..

# Summary
echo ""
echo -e "${BLUE}Test Results Summary:${NC}"
echo "======================"

if [ $BACKEND_SUCCESS -eq 1 ]; then
    echo -e "Backend:  ${GREEN}✓ PASSED${NC}"
else
    echo -e "Backend:  ${RED}✗ FAILED${NC}"
fi

if [ $FRONTEND_SUCCESS -eq 1 ]; then
    echo -e "Frontend: ${GREEN}✓ PASSED${NC}"
else
    echo -e "Frontend: ${RED}✗ FAILED${NC}"
fi

if [ $BACKEND_SUCCESS -eq 1 ] && [ $FRONTEND_SUCCESS -eq 1 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi
