Write-Host "================================================" -ForegroundColor Cyan
Write-Host " Ultrasound Annotation Platform - Debug Startup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if port 3000 is in use
Write-Host "1. Checking port 3000..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "   ❌ Port 3000 is already in use!" -ForegroundColor Red
    Write-Host "   📋 Processes using port 3000:" -ForegroundColor Gray
    $port3000 | ForEach-Object {
        $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        Write-Host "      PID: $($_.OwningProcess) - $($process.Name)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "   💡 To kill these processes, run:" -ForegroundColor Cyan
    $port3000 | ForEach-Object {
        Write-Host "      taskkill /PID $($_.OwningProcess) /F" -ForegroundColor White
    }
    Write-Host ""
    Read-Host "   Press Enter to continue anyway, or Ctrl+C to exit"
} else {
    Write-Host "   ✅ Port 3000 is available" -ForegroundColor Green
}

Write-Host ""
Write-Host "2. Current directory: $PWD" -ForegroundColor Yellow

# Check if package.json exists
if (Test-Path "package.json") {
    Write-Host "   ✅ package.json found" -ForegroundColor Green
} else {
    Write-Host "   ❌ package.json not found!" -ForegroundColor Red
    Write-Host "   Make sure you're in the correct project directory" -ForegroundColor Gray
    Read-Host "   Press Enter to exit"
    exit 1
}

# Check if node_modules exists
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  node_modules not found" -ForegroundColor Yellow
    Write-Host "   🔧 Running npm install..." -ForegroundColor Gray
    npm install
}

Write-Host ""
Write-Host "3. Starting development server..." -ForegroundColor Yellow
Write-Host "   🌐 Server URL: http://localhost:3000" -ForegroundColor Gray

# Start Vite dev server in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "   ⏳ Waiting for server to start..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# Test server connection
Write-Host ""
Write-Host "4. Testing server connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ Server is responding! (Status: $($response.StatusCode))" -ForegroundColor Green
    
    # Test specific pages
    Write-Host ""
    Write-Host "5. Testing application pages..." -ForegroundColor Yellow
    
    $testPages = @(
        "test-server.html",
        "src/pages/home-clean.html",
        "src/pages/annotation-room.html"
    )
    
    foreach ($page in $testPages) {
        try {
            $pageResponse = Invoke-WebRequest -Uri "http://localhost:3000/$page" -TimeoutSec 3 -UseBasicParsing
            Write-Host "   ✅ $page (Status: $($pageResponse.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ $page (Error: $($_.Exception.Message))" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "6. Starting Electron application..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run electron"
    
    Write-Host ""
    Write-Host "✅ Both development server and Electron app are starting!" -ForegroundColor Green
    Write-Host "📊 Monitor both PowerShell windows for any errors" -ForegroundColor Gray
    
} catch {
    Write-Host "   ❌ Server is not responding: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting steps:" -ForegroundColor Cyan
    Write-Host "   1. Check if the Vite dev server started without errors" -ForegroundColor Gray
    Write-Host "   2. Try accessing http://localhost:3000 in your browser" -ForegroundColor Gray
    Write-Host "   3. If browser works, manually run: npm run electron" -ForegroundColor Gray
    Write-Host "   4. Check firewall/antivirus settings" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Read-Host "Press Enter to close this window"
