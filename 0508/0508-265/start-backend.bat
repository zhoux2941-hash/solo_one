@echo off
echo ========================================
echo 工业产线设备运维工单系统 - 后端启动
echo ========================================
echo.

cd /d "%~dp0backend"

echo 正在检查Maven环境...
mvn -version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Maven，请先安装Maven并配置环境变量
    pause
    exit /b 1
)

echo.
echo 正在启动后端服务...
echo 服务地址: http://localhost:8080
echo H2控制台: http://localhost:8080/h2-console
echo.

mvn spring-boot:run

pause
