@echo off
chcp 65001 >nul
echo ==============================================
echo  实时物体检测与多目标追踪系统
echo ==============================================

echo.
echo 检查Python环境...
python --version

echo.
echo 安装依赖...
pip install -r requirements.txt

echo.
echo 启动服务...
echo 访问 http://localhost:8000 查看前端界面
echo 按 Ctrl+C 停止服务
echo ==============================================

cd backend\api
python main.py
