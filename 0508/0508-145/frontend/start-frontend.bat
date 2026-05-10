@echo off
echo ========================================
echo 戏曲脸谱设计工具 - 前端启动脚本
echo ========================================

echo.
echo 正在安装依赖...
call npm install

echo.
echo 正在启动前端服务...
echo 服务地址: http://localhost:3000
echo.

npm run dev

pause
