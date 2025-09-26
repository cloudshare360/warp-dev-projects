#!/bin/bash

################################################################################
# Quick API Test Runner
# This script provides a simple interface to run the comprehensive API tests
################################################################################

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       ANGULAR TODO APPLICATION - API TEST SUITE          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if backend is running
echo -e "${YELLOW}Checking backend status...${NC}"
if timeout 5 curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${YELLOW}! Backend is not running. Starting it now...${NC}"
    cd Back-End/express-rest-todo-api
    npm run dev > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    sleep 5
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
fi

# Check if MongoDB is running
echo -e "${YELLOW}Checking MongoDB status...${NC}"
if docker ps | grep -q mongodb; then
    echo -e "${GREEN}✓ MongoDB is running${NC}"
else
    echo -e "${YELLOW}! MongoDB is not running. Starting it now...${NC}"
    npm run db:start
    sleep 3
    echo -e "${GREEN}✓ MongoDB started${NC}"
fi

echo ""
echo -e "${CYAN}Running comprehensive API tests...${NC}"
echo ""

# Run the comprehensive tests
cd curl-scripts

echo -e "${CYAN}Starting comprehensive API testing...${NC}"
echo -e "${YELLOW}This will test Normal, Alternative, Error, Exception, and Integration flows${NC}"
echo ""

# Check if jq is installed (needed for JSON parsing)
if ! command -v jq > /dev/null 2>&1; then
    echo -e "${YELLOW}! jq not found, installing for JSON processing...${NC}"
    sudo apt-get update > /dev/null 2>&1
    sudo apt-get install -y jq > /dev/null 2>&1
fi

./comprehensive-api-tester.sh

# Store exit code
TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  ALL TESTS PASSED! 🎉                    ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║                 SOME TESTS FAILED ⚠️                      ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════╝${NC}"
fi

echo ""
echo "Check the detailed report in: curl-scripts/reports/"
echo ""

exit $TEST_EXIT_CODE