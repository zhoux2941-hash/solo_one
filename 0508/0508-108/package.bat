@echo off
chcp 65001 >nul
echo ========================================
echo        律师函生成工具 - 打包脚本
echo ========================================
echo.

where mvn >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Maven，请先安装 Maven 并配置环境变量
    pause
    exit /b 1
)

echo [信息] 正在打包项目...
call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo [错误] 打包失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo [成功] 打包完成！
echo ========================================
echo.
echo 生成的文件: target\lawyer-letter-generator.jar
echo.
echo 运行命令: java -jar target\lawyer-letter-generator.jar
echo.

pause
