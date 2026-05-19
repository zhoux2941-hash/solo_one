@echo off
echo ========================================
echo     WebRTC 实时导播台 - 启动脚本
echo ========================================
echo.

echo 正在启动本地HTTP服务器...
echo 服务器地址: http://localhost:8080
echo 请在浏览器中打开上述地址
echo.
echo 按 Ctrl+C 停止服务器
echo.

python -m http.server 8080

if errorlevel 1 (
    echo.
    echo Python 未检测到，尝试使用 Node.js...
    npx http-server -p 8080
)
