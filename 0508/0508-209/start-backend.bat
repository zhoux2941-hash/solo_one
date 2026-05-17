@echo off
chcp 65001 >nul
echo ========================================
echo   公交公司司机疲劳驾驶预警系统
echo       后端服务启动脚本
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1/3] 检查Java环境...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Java环境，请先安装JDK 1.8或更高版本
    pause
    exit /b 1
)
echo Java环境检查通过
echo.

echo [2/3] 检查Maven环境...
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Maven环境，请先安装Maven 3.6或更高版本
    pause
    exit /b 1
)
echo Maven环境检查通过
echo.

echo [3/3] 启动Spring Boot后端服务...
echo.
echo 服务启动后，请在浏览器中打开前端页面：
echo   - 调度中心: frontend\dashboard.html
echo   - 车载模拟: frontend\device-simulator.html
echo   - 报表统计: frontend\reports.html
echo.
echo 后端API地址: http://localhost:8080
echo H2控制台: http://localhost:8080/h2-console
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

mvn spring-boot:run

if %errorlevel% neq 0 (
    echo.
    echo 服务启动失败，请检查错误信息
    pause
)
