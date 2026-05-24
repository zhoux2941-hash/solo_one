@echo off
echo ========================================
echo WebSSH Client - Development Setup
echo ========================================
echo.

echo Step 1: Installing dependencies...
node "E:\nodejs\node_modules\npm\bin\npm-cli.js" install
if %errorlevel% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Starting backend server...
start "WebSSH Backend" cmd /k "node node_modules\tsx\dist\cli.js src/server/index.ts"

echo.
echo Step 3: Starting frontend dev server...
timeout /t 3 /nobreak > nul
start "WebSSH Frontend" cmd /k "node node_modules\vite\bin\vite.js"

echo.
echo ========================================
echo Servers are starting...
echo Backend: http://localhost:3001
echo Frontend: https://localhost:3000
echo ========================================
echo.
echo Press any key to close this window...
pause
