@echo off
cd /d "E:\LaptopArchive\Downloads\new app"
title RawDrop

echo Stopping old server on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)

echo Clearing broken cache...
if exist .next rmdir /s /q .next

echo.
echo Starting RawDrop...
echo   Store:  http://localhost:3000
echo   Test:   http://localhost:3000/product/checkout-test-20-51
echo.
echo Wait for "Ready" before opening the browser.
echo.
call npm run dev
pause
