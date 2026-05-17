@echo off
cd /d "%~dp0frontend"
echo ========================================
echo 工厂生产管理系统 - 前端启动
echo ========================================
echo.
echo 正在启动前端服务...
echo 请在浏览器中打开: http://127.0.0.1:8081
echo.
echo 如果没有安装http-server，请先执行: npm install -g http-server
echo 或者直接用浏览器打开 login.html 文件
echo.
http-server -p 8081 --cors
pause