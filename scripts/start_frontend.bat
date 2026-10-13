@echo off
echo ========================================================
echo   SHADOW CODE: VITE REACT FRONTEND DASHBOARD
echo   Starting Vite Dev Server on http://127.0.0.1:5173
echo ========================================================

cd /d "%~dp0\..\frontend"
set PATH=C:\Program Files\nodejs;%PATH%
call npm.cmd run dev
pause
