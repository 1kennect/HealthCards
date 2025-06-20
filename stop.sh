#!/bin/bash

# HealthCards - Stop script for both backend and frontend

echo "🛑 Stopping HealthCards services..."
echo "=================================="

# Function to kill processes by port
kill_by_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "🔄 Stopping service on port $port..."
        kill $pids 2>/dev/null
        sleep 1
        # Force kill if still running
        pids=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$pids" ]; then
            echo "💀 Force killing service on port $port..."
            kill -9 $pids 2>/dev/null
        fi
        echo "✅ Stopped service on port $port"
    else
        echo "ℹ️  No service running on port $port"
    fi
}

# Stop backend (port 5001)
kill_by_port 5001

# Stop frontend (port 3000)
kill_by_port 3000

echo ""
echo "🎉 All HealthCards services stopped!"
echo ""
echo "💡 You can restart them anytime with: ./start.sh" 