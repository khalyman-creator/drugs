@echo off
cd /d "%~dp0"
title RawDrop

echo Freeing port 3000 if needed...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Starting RawDrop...
echo Open http://localhost:3000 when you see Ready
echo.
npm run dev
pause
