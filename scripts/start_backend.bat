@echo off
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%.."
set PYTHONPATH=%CD%
echo ========================================================
echo   SHADOW-CODE: AGENTIC AI SECURE SDLC GATEWAY
echo   Starting FastAPI Backend on http://127.0.0.1:8000
echo ========================================================
if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
) else (
    python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
)
pause
