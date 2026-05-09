@echo off
echo ============================================
echo   启动后端服务
echo ============================================
echo.

cd /d "%~dp0backend"

echo [1/2] 检查 Java 环境...
java -version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Java 环境，请安装 JDK 17+
    pause
    exit /b 1
)

echo [2/2] 启动 Spring Boot 应用...
echo 后端地址: http://localhost:8080
echo API 地址: http://localhost:8080/api/temperature/current
echo.

mvn spring-boot:run

if errorlevel 1 (
    echo.
    echo [错误] Maven 启动失败，请检查 Maven 是否正确安装
    echo 尝试运行: mvn clean install
)

pause
