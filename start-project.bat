@echo off
echo Starting LegalMate Project...
echo.

echo Starting AI Backend (Python)...
start "AI Backend" cmd /k "cd ai-backend && python app.py"

echo Starting Node.js Backend...
start "Backend" cmd /k "cd backend && npm start"

echo Starting React Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services are starting...
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo AI Backend: http://localhost:5001
echo.
pause
