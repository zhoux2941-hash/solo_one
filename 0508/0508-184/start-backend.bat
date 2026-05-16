@echo off
echo ========================================
echo 物业维修管理系统 - 后端启动脚本
echo ========================================
echo.

cd /d "%~dp0\backend"

echo [1/3] 正在检查Maven环境...
mvn -version
if %errorlevel% neq 0 (
    echo ERROR: Maven未安装或未配置环境变量！
    pause
    exit /b 1
)

echo.
echo [2/3] 正在编译项目...
mvn clean compile -DskipTests
if %errorlevel% neq 0 (
    echo ERROR: 编译失败！
    pause
    exit /b 1
)

echo.
echo [3/3] 正在启动Spring Boot应用...
echo 注意：请确保MySQL数据库已启动，并且schema.sql已执行
echo.
mvn spring-boot:run

pause
