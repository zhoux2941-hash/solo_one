@echo off
chcp 65001 >nul
echo ========================================
echo    多模态知识图谱系统 - 启动脚本
echo ========================================
echo.

echo [1/3] 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到Python，请先安装Python 3.8+
    pause
    exit /b 1
)
echo ✅ Python环境正常
echo.

echo [2/3] 检查并安装依赖...
cd backend
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt -q
echo ✅ 依赖安装完成
echo.

echo [3/3] 启动后端服务...
echo.
echo ========================================
echo   服务启动中，请稍候...
echo   后端地址: http://localhost:8000
echo   前端请打开: frontend\index.html
echo   按 Ctrl+C 停止服务
echo ========================================
echo.

python main.py

pause
