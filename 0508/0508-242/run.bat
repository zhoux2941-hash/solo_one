@echo off
chcp 65001 >nul
echo ========================================
echo    云盘同步客户端 - 启动脚本
echo ========================================
echo.

if not exist "target\lib" (
    echo 正在下载依赖包...
    call mvn dependency:copy-dependencies -DoutputDirectory=target/lib -q
    if %errorlevel% neq 0 (
        echo 依赖下载失败！
        pause
        exit /b 1
    )
    echo 依赖下载完成！
    echo.
)

if not exist "target\classes" (
    echo 正在编译项目...
    call mvn compile -q
    if %errorlevel% neq 0 (
        echo 编译失败！
        pause
        exit /b 1
    )
    echo 编译完成！
    echo.
)

echo 正在启动应用...
echo.
java -cp "target/classes;target/lib/*" com.cloudsync.CloudSyncApplication

if %errorlevel% neq 0 (
    echo.
    echo 程序异常退出，错误代码: %errorlevel%
    echo.
    echo 如果提示找不到依赖，请尝试删除 target 目录后重新运行
    pause
)
