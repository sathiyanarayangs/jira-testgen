@echo off
echo ======================================
echo   TestGen AI - Starting Application
echo ======================================

echo.
echo [1/2] Starting Spring Boot backend on port 8080...
cd backend
start "Backend" cmd /k "mvn spring-boot:run"

echo Waiting for backend...
timeout /t 15 /nobreak > NUL

echo.
echo [2/2] Starting React frontend on port 3000...
cd ..\frontend
call npm install
start "Frontend" cmd /k "npm start"

echo.
echo ======================================
echo   App running!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8080
echo ======================================
pause
