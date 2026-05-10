@echo off
echo ============================================
echo  启动后端服务 (Spring Boot)
echo ============================================
echo.

cd backend

echo [1/2] 检查Maven...
where mvn >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Maven，请确保已安装Maven并配置环境变量
    pause
    exit /b 1
)

echo [2/2] 启动Spring Boot应用...
echo 服务将在 http://localhost:8080 启动
echo 按 Ctrl+C 停止服务
echo.

mvn spring-boot:run

pause
