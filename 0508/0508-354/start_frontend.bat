@echo off
echo ========================================
echo   汉字描红字帖系统 - 前端启动脚本
echo ========================================
echo.

cd frontend

echo [1/3] 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Node.js，请先安装Node.js 16+
    pause
    exit /b 1
)

echo [2/3] 检查npm环境...
npm --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到npm
    pause
    exit /b 1
)

echo [3/3] 启动前端开发服务器...
echo.
echo 前端将在 http://localhost:3000 启动
echo 按 Ctrl+C 停止服务器
echo.

npm start
pause
