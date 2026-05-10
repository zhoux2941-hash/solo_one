@echo off
echo ========================================
echo   流星雨观测记录系统 - 后端启动
echo ========================================
echo.

cd /d "%~dp0meteor-backend"

where mvn >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Maven，请确保已安装并配置环境变量
    echo 下载地址: https://maven.apache.org/download.cgi
    pause
    exit /b 1
)

echo [INFO] 正在检查依赖并编译...
call mvn clean compile -DskipTests

if %errorlevel% neq 0 (
    echo [错误] 编译失败
    pause
    exit /b 1
)

echo.
echo [INFO] 启动 Spring Boot 应用...
echo [INFO] 后端地址: http://localhost:8080
echo.
call mvn spring-boot:run

pause
