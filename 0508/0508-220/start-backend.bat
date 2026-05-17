@echo off
cd /d "%~dp0backend"
echo ========================================
echo 工厂生产管理系统 - 后端启动
echo ========================================
echo.
echo [环境检查]
java -version 2>nul
if %errorlevel% neq 0 (
    echo ERROR: 未检测到 Java，请安装 JDK 8 或以上版本
    pause
    exit /b 1
)

where mvn >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: 未检测到 Maven，请安装 Maven 或使用 IDE 启动
    echo.
    echo 使用 IDE 启动方式：
    echo 1. 用 IntelliJ IDEA 打开 backend 目录
    echo 2. 等待 Maven 依赖下载完成
    echo 3. 运行 ProductionManagementApplication.java
    pause
    exit /b 1
)

echo.
echo [启动信息]
echo 后端地址: http://localhost:8080/api
echo H2控制台: http://localhost:8080/api/h2-console
echo 默认账号: admin / admin123
echo.
echo 正在编译并启动后端服务（首次启动需要下载依赖，请耐心等待）...
echo.
mvn spring-boot:run
if %errorlevel% neq 0 (
    echo.
    echo 启动失败！
    echo 可能原因：端口被占用、Maven依赖下载失败等
    echo.
    echo 备选方案：
    echo 使用 IntelliJ IDEA 打开 backend 目录，直接运行 ProductionManagementApplication.java
)
pause