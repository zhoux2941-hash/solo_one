@echo off
echo ========================================
echo 工业产线设备运维工单系统 - 前端启动
echo ========================================
echo.

cd /d "%~dp0frontend"

echo 正在检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

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

echo.
echo 正在启动前端服务...
echo 服务地址: http://localhost:3000
echo.

call npm run serve

pause
