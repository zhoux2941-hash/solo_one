@echo off
echo ============================================
echo  启动前端服务 (Vue)
echo ============================================
echo.

cd frontend

echo [1/3] 检查Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请确保已安装Node.js
    pause
    exit /b 1
)

echo [2/3] 检查依赖是否已安装...
if not exist "node_modules" (
    echo 依赖未安装，正在安装...
    call npm install
    if %errorlevel% neq 0 (
        echo 错误: 依赖安装失败
        pause
        exit /b 1
    )
)

echo [3/3] 启动Vue开发服务器...
echo 服务将在 http://localhost:8081 启动
echo 按 Ctrl+C 停止服务
echo.

call npm run serve

pause
