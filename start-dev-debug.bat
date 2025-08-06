@echo off
echo ================================================
echo  Ultrasound Annotation Platform - Startup Check
echo ================================================
echo.

echo 1. Checking if port 3000 is available...
netstat -an | find "3000" >nul
if %errorlevel% == 0 (
    echo    ❌ Port 3000 is already in use!
    echo    🔍 Checking what's using port 3000...
    netstat -ano | find "3000"
    echo.
    echo    💡 To kill the process using port 3000:
    echo       1. Find the PID from the list above
    echo       2. Run: taskkill /PID [PID_NUMBER] /F
    echo.
    pause
    exit /b 1
) else (
    echo    ✅ Port 3000 is available
)

echo.
echo 2. Starting Vite development server...
echo    📂 Project directory: %CD%
echo    🌐 Server will be available at: http://localhost:3000
echo.

start "Vite Dev Server" cmd /k "npm run dev"

echo 3. Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo 4. Testing server connection...
curl -s -I http://localhost:3000 >nul 2>&1
if %errorlevel% == 0 (
    echo    ✅ Development server is running and accessible!
    echo    🌐 Test page: http://localhost:3000/test-server.html
    echo    📄 Home page: http://localhost:3000/src/pages/home-clean.html
    echo.
    echo 5. Starting Electron application...
    start "Electron App" cmd /k "npm run electron"
) else (
    echo    ❌ Server is not responding yet
    echo    ⏳ Please wait for the server to fully start, then manually run:
    echo       npm run electron
)

echo.
echo ================================================
echo  Both terminals will remain open for monitoring
echo  Close this window when you're done working
echo ================================================
pause
