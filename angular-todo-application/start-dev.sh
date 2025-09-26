#!/bin/bash

# Development startup script for Angular Todo Application
# This script starts both the Express API backend and Angular frontend simultaneously

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 1
    else
        return 0
    fi
}

# Function to cleanup background processes on script exit
cleanup() {
    print_status "Cleaning up background processes..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_status "Backend process stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_status "Frontend process stopped"
    fi
    if [ ! -z "$DB_PID" ]; then
        print_status "MongoDB container still running - use 'npm run db:stop' to stop it"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM EXIT

print_status "🚀 Starting Angular Todo Application Development Environment"
print_status "============================================================"

# Check if we're in the right directory
if [ ! -f "PROJECT_STATUS.md" ]; then
    print_error "Please run this script from the angular-todo-application root directory"
    exit 1
fi

# Check required directories
if [ ! -d "Back-End/express-rest-todo-api" ]; then
    print_error "Backend directory not found: Back-End/express-rest-todo-api"
    exit 1
fi

if [ ! -d "Front-End/angular-18-todo-app" ]; then
    print_error "Frontend directory not found: Front-End/angular-18-todo-app"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js to continue."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm to continue."
    exit 1
fi

print_success "✓ Prerequisites check passed"

# Check ports availability
print_status "Checking port availability..."

if ! check_port 3000; then
    print_warning "Port 3000 (backend) is already in use"
    read -p "Do you want to kill the process using port 3000? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        print_success "Freed port 3000"
    else
        print_error "Cannot start backend on port 3000. Please free the port manually."
        exit 1
    fi
fi

if ! check_port 4200; then
    print_warning "Port 4200 (frontend) is already in use"
    read -p "Do you want to kill the process using port 4200? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:4200 | xargs kill -9 2>/dev/null || true
        print_success "Freed port 4200"
    else
        print_error "Cannot start frontend on port 4200. Please free the port manually."
        exit 1
    fi
fi

print_success "✓ Ports are available"

# Start MongoDB if not running
print_status "Starting MongoDB..."
cd data-base/mongodb
if [ -f "docker-compose.yml" ]; then
    if ! docker compose ps | grep -q "mongodb.*Up"; then
        docker compose up -d
        print_success "✓ MongoDB container started"
        sleep 3 # Wait for MongoDB to be ready
    else
        print_success "✓ MongoDB is already running"
    fi
else
    print_warning "MongoDB docker-compose.yml not found, assuming MongoDB is running elsewhere"
fi
cd ../..

# Install backend dependencies if needed
print_status "Checking backend dependencies..."
cd Back-End/express-rest-todo-api
if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm install
    print_success "✓ Backend dependencies installed"
else
    print_success "✓ Backend dependencies already installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        print_warning ".env file not found, copying from .env.example"
        cp .env.example .env
        print_warning "Please review and update the .env file with your configuration"
    else
        print_error ".env.example file not found. Please create a .env file."
        exit 1
    fi
fi

# Start backend server
print_status "Starting Express API backend on port 3000..."
npm run dev > ../../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ../..
print_success "✓ Backend server started (PID: $BACKEND_PID)"

# Wait a moment for backend to start
sleep 2

# Install frontend dependencies if needed
print_status "Checking frontend dependencies..."
cd Front-End/angular-18-todo-app
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
    print_success "✓ Frontend dependencies installed"
else
    print_success "✓ Frontend dependencies already installed"
fi

# Start frontend server
print_status "Starting Angular frontend on port 4200..."
npm run start:dev > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..
print_success "✓ Frontend server started (PID: $FRONTEND_PID)"

# Create logs directory if it doesn't exist
mkdir -p logs

print_status "============================================================"
print_success "🎉 Development environment is ready!"
print_status ""
print_status "Services running:"
print_status "  📊 MongoDB:      http://localhost:27017"
print_status "  🚀 Backend API:  http://localhost:3000"
print_status "  🖥️  Frontend:     http://localhost:4200"
print_status ""
print_status "Logs are being written to:"
print_status "  Backend:  logs/backend.log"
print_status "  Frontend: logs/frontend.log"
print_status ""
print_status "Press Ctrl+C to stop all services"
print_status "============================================================"

# Monitor both processes
while true; do
    # Check if backend is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "Backend process died unexpectedly"
        print_status "Check logs/backend.log for details"
        cleanup
    fi
    
    # Check if frontend is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "Frontend process died unexpectedly"
        print_status "Check logs/frontend.log for details"
        cleanup
    fi
    
    sleep 5
done