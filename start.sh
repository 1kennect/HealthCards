#!/bin/bash

# HealthCards - AI-Powered Healthcare Priority System
# Start script for both backend and frontend

echo "🚀 Starting HealthCards - AI-Powered Healthcare Priority System"
echo "================================================================"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if required tools are installed
echo "📋 Checking prerequisites..."

if ! command_exists python3; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "📦 Setting up Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo "✅ Virtual environment created and dependencies installed"
else
    echo "✅ Virtual environment already exists"
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi

echo ""
echo "🔧 Starting services..."
echo ""

# Function to start backend
start_backend() {
    echo "🐍 Starting Python backend on port 5001..."
    cd backend
    source venv/bin/activate
    python app.py
}

# Function to start frontend
start_frontend() {
    echo "⚛️  Starting React frontend on port 3000..."
    cd frontend
    npm run dev
}

# Check if we're on macOS (to use osascript for new terminals)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS - Opening in separate terminal windows..."
    
    # Start backend in new terminal
    osascript -e 'tell application "Terminal" to do script "cd '"$(pwd)"'/backend && source venv/bin/activate && python app.py"'
    
    # Wait a moment for backend to start
    sleep 2
    
    # Start frontend in new terminal
    osascript -e 'tell application "Terminal" to do script "cd '"$(pwd)"'/frontend && npm run dev"'
    
    echo ""
    echo "🎉 Services started in separate terminal windows!"
    echo ""
    echo "📱 Frontend: http://localhost:3000"
    echo "🔌 Backend API: http://localhost:5001"
    echo ""
    echo "💡 To stop the services, close the terminal windows or press Ctrl+C in each"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Detected Linux - Starting in background..."
    
    # Start backend in background
    cd backend
    source venv/bin/activate
    python app.py &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend in background
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo ""
    echo "🎉 Services started in background!"
    echo ""
    echo "📱 Frontend: http://localhost:3000"
    echo "🔌 Backend API: http://localhost:5001"
    echo ""
    echo "💡 To stop the services, run: kill $BACKEND_PID $FRONTEND_PID"
    echo "   Or press Ctrl+C in this terminal"
    
    # Wait for user to stop
    wait
    
else
    echo "🪟 Detected Windows/Other - Starting sequentially..."
    echo "   (For better experience on Windows, run backend and frontend in separate terminals)"
    
    # Start backend
    start_backend &
    BACKEND_PID=$!
    
    # Wait a moment
    sleep 3
    
    # Start frontend
    start_frontend &
    FRONTEND_PID=$!
    
    echo ""
    echo "🎉 Services started!"
    echo ""
    echo "📱 Frontend: http://localhost:3000"
    echo "🔌 Backend API: http://localhost:5001"
    echo ""
    echo "💡 To stop the services, press Ctrl+C"
    
    # Wait for user to stop
    wait
fi 