# PowerShell script to start Shadow Code frontend
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location "$ProjectRoot\frontend"

$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SHADOW CODE: VITE REACT FRONTEND DASHBOARD" -ForegroundColor Cyan
Write-Host "  Starting Vite Dev Server on http://127.0.0.1:5173" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

& "C:\Program Files\nodejs\npm.cmd" run dev
