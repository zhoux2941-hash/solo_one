@echo off
echo ========================================
echo 工控烧录调试工具 - 启动脚本
echo ========================================
echo.

if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo 依赖安装失败！
        pause
        exit /b 1
    )
    echo 依赖安装完成！
    echo.
)

echo 正在启动应用...
call npm start

if errorlevel 1 (
    echo.
    echo 启动失败，请检查错误信息
    pause
)
