@echo off
echo ========================================
echo 启动充电桩预约系统 - 前端服务
echo ========================================
echo.

cd frontend
echo [1/2] 正在安装前端依赖...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo [2/2] 正在启动Vue开发服务器...
    echo.
    echo 前端访问地址: http://localhost:5173
    echo 请确保后端服务已启动 (http://localhost:8080)
    echo.
    call npm run dev
) else (
    echo 依赖安装失败，请检查Node.js和npm是否安装
    pause
)
