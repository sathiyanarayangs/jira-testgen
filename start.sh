#!/bin/bash
echo "======================================"
echo "  TestGen AI — Starting Application"
echo "======================================"

# Start backend
echo ""
echo "[1/2] Starting Spring Boot backend on port 8080..."
cd backend
mvn spring-boot:run &
BACKEND_PID=$!

# Wait for backend
echo "Waiting for backend to start..."
sleep 12

# Start frontend
echo ""
echo "[2/2] Starting React frontend on port 3000..."
cd ../frontend
npm install --silent
npm start &
FRONTEND_PID=$!

echo ""
echo "======================================"
echo "  App running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8080"
echo "======================================"
echo ""
echo "Press Ctrl+C to stop both services."

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
