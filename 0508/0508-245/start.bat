@echo off
chcp 65001 >nul
echo ========================================
echo    海洋文化遗产保护系统 - 启动脚本
echo ========================================
echo.

echo [1/3] 检查Java环境...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Java环境，请先安装JDK 11或更高版本
    pause
    exit /b 1
)
echo ✓ Java环境正常
echo.

echo [2/3] 检查Maven环境...
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Maven环境，请先安装Maven
    pause
    exit /b 1
)
echo ✓ Maven环境正常
echo.

echo [3/3] 启动后端服务...
echo.
cd backend
echo 正在编译和启动Spring Boot应用，这可能需要一些时间...
echo 服务启动后，请在浏览器中打开 frontend/index.html
echo 按 Ctrl+C 可以停止服务
echo.
mvn spring-boot:run

pause
