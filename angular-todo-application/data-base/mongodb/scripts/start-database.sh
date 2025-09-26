#!/bin/bash

# Angular Todo Application - MongoDB Startup Script
# This script starts the MongoDB database with Docker Compose

echo "🚀 Starting Angular Todo Application Database..."
echo "=================================================="

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose not found. Please install docker-compose."
    exit 1
fi

# Navigate to the MongoDB directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONGODB_DIR="$(dirname "$SCRIPT_DIR")"
cd "$MONGODB_DIR"

echo "📁 Working directory: $MONGODB_DIR"

# Create data directory if it doesn't exist
mkdir -p data

echo "🐳 Starting MongoDB and Mongo Express containers..."

# Start the containers
docker-compose up -d

# Check if containers started successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database containers started successfully!"
    echo "=================================================="
    echo ""
    echo "🔗 Service URLs:"
    echo "   MongoDB:        mongodb://localhost:27017"
    echo "   Mongo Express:  http://localhost:8081"
    echo ""
    echo "🔐 Database Credentials:"
    echo "   MongoDB Admin:  admin / todopassword123"
    echo "   Mongo Express:  admin / admin123"
    echo ""
    echo "📊 Container Status:"
    docker-compose ps
    echo ""
    echo "⏰ Waiting for database to initialize (15 seconds)..."
    sleep 15
    
    echo ""
    echo "🏥 Health Check:"
    if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        echo "   ✅ MongoDB is healthy and ready"
    else
        echo "   ⚠️  MongoDB is starting up, may need a few more seconds"
    fi
    
    echo ""
    echo "📋 Database Collections:"
    docker-compose exec -T mongodb mongosh tododb --eval "db.getCollectionNames()" 2>/dev/null | grep -E '\[|\]' | head -1 || echo "   Collections will be created when seed data is loaded"
    
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Access Mongo Express UI: http://localhost:8081"
    echo "   2. Use MongoDB connection: mongodb://admin:todopassword123@localhost:27017/tododb"
    echo "   3. Run 'npm start' in the Express API directory"
    echo "   4. Run 'ng serve' in the Angular frontend directory"
    
else
    echo "❌ Failed to start database containers"
    echo "🔍 Checking container logs..."
    docker-compose logs
    exit 1
fi

echo ""
echo "🚀 Database startup completed!"