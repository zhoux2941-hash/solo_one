@echo off
echo ========================================
echo   食堂剩菜回收量预测系统 - 前端启动
echo ========================================
echo.

cd canteen-frontend

if not exist "node_modules" (
    echo [INFO] 首次运行，正在安装依赖...
    call npm install
    echo [INFO] 依赖安装完成
)

echo [INFO] 正在启动 Vue 3 前端开发服务器...
echo [INFO] 请确保后端服务已启动
echo.

call npm run dev

pause
