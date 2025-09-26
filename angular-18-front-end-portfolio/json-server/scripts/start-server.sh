#!/bin/bash

# Portfolio JSON Server Start Script
# This script starts the JSON server with proper configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PORT=3001
HOST=localhost
DB_FILE="data/db.json"
WATCH=true
DELAY=200

echo -e "${BLUE}📋 Portfolio JSON Server Startup${NC}"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if json-server is installed
if ! command -v json-server &> /dev/null; then
    echo -e "${YELLOW}⚠️  json-server not found globally. Installing...${NC}"
    npm install -g json-server
fi

# Check if database file exists
if [ ! -f "$DB_FILE" ]; then
    echo -e "${RED}❌ Error: Database file '$DB_FILE' not found${NC}"
    echo "Please ensure the database file exists or run the setup script first."
    exit 1
fi

# Validate JSON format
echo -e "${BLUE}🔍 Validating JSON database...${NC}"
if ! node -e "JSON.parse(require('fs').readFileSync('$DB_FILE', 'utf8'))"; then
    echo -e "${RED}❌ Error: Invalid JSON format in database file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ JSON database validated successfully${NC}"

# Check if port is available
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Port $PORT is already in use${NC}"
    echo "Attempting to kill existing process..."
    PID=$(lsof -ti:$PORT)
    if [ ! -z "$PID" ]; then
        kill -9 $PID 2>/dev/null || true
        sleep 2
    fi
fi

# Create backup before starting
BACKUP_DIR="backups"
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
fi

BACKUP_FILE="$BACKUP_DIR/db-backup-$(date +%Y%m%d-%H%M%S).json"
cp "$DB_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✅ Database backed up to: $BACKUP_FILE${NC}"

# Start JSON server
echo -e "${BLUE}🚀 Starting JSON Server...${NC}"
echo "   Port: $PORT"
echo "   Host: $HOST"
echo "   Database: $DB_FILE"
echo "   Watch mode: $WATCH"
echo "   Delay: ${DELAY}ms"
echo ""
echo -e "${GREEN}Server will be available at: http://$HOST:$PORT${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Start the server with proper configuration
exec json-server \
  --watch "$DB_FILE" \
  --port $PORT \
  --host $HOST \
  --delay $DELAY \
  --no-cors false \
  --quiet false