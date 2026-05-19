@echo off
echo ========================================
echo WebTransport 3D协作编辑器
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1/2] 下载Go依赖...
go mod download
if %errorlevel% neq 0 (
    echo 依赖下载失败，请确保Go已安装并配置好环境
    pause
    exit /b 1
)

echo.
echo [2/2] 启动服务器...
echo.
echo 服务器启动后，请在浏览器中访问: https://localhost:4433
echo 注意: 浏览器会提示安全警告，点击"高级" -> "继续前往"即可
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

go run main.go

pause
