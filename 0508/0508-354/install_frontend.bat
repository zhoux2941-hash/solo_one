@echo off
echo ========================================
echo   安装前端依赖
echo ========================================
echo.

cd frontend

echo [1/2] 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Node.js，请先安装Node.js 16+
    pause
    exit /b 1
)

echo [2/2] 安装npm依赖包...
npm install

echo.
echo ========================================
echo   依赖安装完成！
echo ========================================
echo.
echo 现在可以运行 start_frontend.bat 启动前端服务器
pause
