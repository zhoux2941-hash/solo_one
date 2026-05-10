@echo off
chcp 65001 >nul
echo ========================================
echo        律师函生成工具 - 启动脚本
echo ========================================
echo.

where mvn >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Maven，请先安装 Maven 并配置环境变量
    echo.
    echo 下载地址: https://maven.apache.org/download.cgi
    pause
    exit /b 1
)

where java >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Java，请先安装 JDK 17+ 并配置 JAVA_HOME
    echo.
    echo 下载地址: https://adoptium.net/
    pause
    exit /b 1
)

echo [信息] 正在编译项目...
call mvn clean compile -q
if %errorlevel% neq 0 (
    echo [错误] 编译失败！
    pause
    exit /b 1
)

echo [信息] 正在启动程序...
echo.
call mvn javafx:run

pause
