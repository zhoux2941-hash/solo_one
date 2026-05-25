@echo off
echo ========================================
echo   安装后端依赖
echo ========================================
echo.

cd backend

echo [1/2] 升级pip...
python -m pip install --upgrade pip

echo [2/2] 安装依赖包...
pip install -r requirements.txt

echo.
echo ========================================
echo   依赖安装完成！
echo ========================================
echo.
echo 现在可以运行 start_backend.bat 启动后端服务器
pause
