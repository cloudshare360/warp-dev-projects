#!/bin/bash

# Angular Todo Application - MongoDB Shutdown Script
# This script stops the MongoDB database containers

echo "🛑 Stopping Angular Todo Application Database..."
echo "================================================="

# Navigate to the MongoDB directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONGODB_DIR="$(dirname "$SCRIPT_DIR")"
cd "$MONGODB_DIR"

echo "📁 Working directory: $MONGODB_DIR"

# Stop the containers
echo "🐳 Stopping MongoDB containers..."
docker-compose down

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database containers stopped successfully!"
    echo ""
    echo "📊 Container Status:"
    docker-compose ps
    echo ""
    echo "💾 Note: Database data is preserved in the ./data directory"
    echo "🚀 To restart the database, run: ./scripts/start-database.sh"
else
    echo "❌ Failed to stop database containers"
    exit 1
fi

echo ""
echo "🛑 Database shutdown completed!"