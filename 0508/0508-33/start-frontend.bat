@echo off
echo ============================================
echo   启动前端服务
echo ============================================
echo.

cd /d "%~dp0frontend"

echo [1/3] 检查 Node.js 环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请安装 Node.js 16+
    pause
    exit /b 1
)

echo [2/3] 检查 npm 环境...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 npm
    pause
    exit /b 1
)

echo [3/3] 安装依赖并启动...
echo 前端地址: http://localhost:5173
echo.

if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

echo 启动开发服务器...
call npm run dev

pause
