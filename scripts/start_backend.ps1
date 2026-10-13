# PowerShell script to start Shadow Code backend
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

$env:PYTHONPATH = $ProjectRoot
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SHADOW CODE: AGENTIC AI SECURE SDLC GATEWAY" -ForegroundColor Cyan
Write-Host "  Starting FastAPI Backend on http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

& "$ProjectRoot\backend\venv\Scripts\python.exe" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
