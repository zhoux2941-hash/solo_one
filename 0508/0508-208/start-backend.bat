@echo off
echo ========================================
echo   机场失物招领系统 - 后端服务启动
echo ========================================
echo.

cd /d "%~dp0backend"

echo 正在检查Maven环境...
where mvn >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到Maven！请先安装Maven并配置环境变量。
    pause
    exit /b 1
)

echo Maven环境检查通过！
echo.
echo 正在启动Spring Boot服务...
echo 服务地址: http://localhost:8080
echo H2控制台: http://localhost:8080/h2-console
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

mvn spring-boot:run

pause
