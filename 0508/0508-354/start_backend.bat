@echo off
echo ========================================
echo   汉字描红字帖系统 - 后端启动脚本
echo ========================================
echo.

cd backend

echo [1/2] 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请先安装Python 3.8+
    pause
    exit /b 1
)

echo [2/2] 启动Flask服务器...
echo.
echo 服务器将在 http://localhost:5000 启动
echo 按 Ctrl+C 停止服务器
echo.

python app.py
pause
