@echo off
echo Starting Ultrasound Webex Electron App...
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

REM Kill any existing processes on port 3000
echo Checking for existing processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Killing process %%a on port 3000
    taskkill /f /pid %%a >nul 2>&1
)

REM Start Vite dev server in background
echo Starting Vite development server on port 3000...
start /B "Vite Dev Server" cmd /c "npm run dev"

REM Wait for server to start
echo Waiting for development server to start...
:WAIT_LOOP
timeout /t 1 /nobreak >nul
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo Still waiting for server...
    goto WAIT_LOOP
)

echo Development server is ready!

REM Start Electron app
echo Starting Electron app...
npm run electron

REM Keep window open if there's an error
if errorlevel 1 (
    echo.
    echo Error starting application. Press any key to exit.
    pause >nul
)
