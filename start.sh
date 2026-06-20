#!/bin/bash
set -e

echo "=== Transmill Startup ==="

# Function to handle shutdown
cleanup() {
    echo "Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Start backend IMMEDIATELY
cd /app/backend
echo "Starting backend..."
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 1 --no-access-log &
BACKEND_PID=$!

# Start frontend IMMEDIATELY
cd /app/frontend
echo "Starting frontend..."
serve -s build -l 3000 -n &
FRONTEND_PID=$!

echo "=== Services started ==="

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
