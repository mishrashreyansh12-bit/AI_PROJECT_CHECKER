@echo off
echo Starting Backend Server...
start cmd /k "cd backend && npm start"

echo Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo Remember to start the AI service (Python) manually if needed:
echo cd ai_service
echo pip install -r requirements.txt
echo uvicorn main:app --reload --port 8000
echo.
pause
