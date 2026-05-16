@echo off
echo ========================================
echo 物业维修管理系统 - 前端启动脚本
echo ========================================
echo.

cd /d "%~dp0\frontend"

echo [1/2] 正在检查Node.js环境...
node -v
if %errorlevel% neq 0 (
    echo ERROR: Node.js未安装或未配置环境变量！
    pause
    exit /b 1
)

echo.
echo [2/2] 正在启动前端开发服务器...
echo.

if not exist "node_modules" (
    echo 首次启动，正在安装依赖...
    call npm install
)

call npm run serve

pause
