@echo off
echo ========================================================
echo   SHADOW CODE: AGENTIC AI SECURE SDLC GATEWAY
echo   Starting FastAPI Backend Server on http://127.0.0.1:8000
echo ========================================================

cd /d "%~dp0\.."
set PYTHONPATH=%CD%
call backend\venv\Scripts\activate.bat
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
