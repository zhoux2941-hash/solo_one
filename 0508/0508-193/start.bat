@echo off
echo ========================================
echo       作业管理系统启动脚本
echo ========================================
echo.

echo [1/3] 检查Maven环境...
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到Maven，请先安装Maven并配置环境变量
    pause
    exit /b 1
)
echo [成功] Maven环境正常
echo.

echo [2/3] 检查Java环境...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到Java，请先安装JDK 8+并配置环境变量
    pause
    exit /b 1
)
echo [成功] Java环境正常
echo.

echo [3/3] 启动Spring Boot应用...
echo.
echo ========================================
echo  启动成功后，请访问:
echo  系统首页: http://localhost:8080/index.html
echo  H2控制台: http://localhost:8080/h2-console
echo ========================================
echo.
echo 测试账号:
echo   教师: teacher / 123456
echo   学生: student1 ~ student8 / 123456
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

mvn spring-boot:run

pause
