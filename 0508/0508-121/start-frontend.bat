@echo off
echo ========================================
echo   流星雨观测记录系统 - 前端启动
echo ========================================
echo.

cd /d "%~dp0meteor-frontend"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请确保已安装并配置环境变量
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] 首次运行，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

echo.
echo [INFO] 启动 Vue 开发服务器...
echo [INFO] 前端地址: http://localhost:3000
echo.
call npm run dev

pause
