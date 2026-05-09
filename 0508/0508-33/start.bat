@echo off
echo ============================================
echo   农场筒仓温度监控系统 - 一键启动
echo ============================================
echo.
echo [前置要求]
echo   1. 确保已安装 JDK 17+ 和 Maven
echo   2. 确保已安装 Node.js 16+ 和 npm
echo   3. 确保 Redis 服务已启动 (localhost:6379)
echo.
echo ============================================
echo.

cd /d "%~dp0"

echo [1/2] 启动后端服务...
start "Spring Boot Backend" cmd /k "start-backend.bat"

echo [2/2] 启动前端服务...
start "Vue Frontend" cmd /k "start-frontend.bat"

echo.
echo ============================================
echo   正在启动服务，请等待...
echo ============================================
echo.
echo 访问地址:
echo   - 前端: http://localhost:5173
echo   - 后端API: http://localhost:8080/api/temperature/current
echo.
echo 两个新的命令行窗口已打开，分别运行后端和前端服务。
echo 请等待服务启动完成后访问上述地址。
echo.
pause
