@echo off
echo ========================================
echo 戏曲脸谱设计工具 - 一键启动脚本
echo ========================================

echo.
echo 请选择要启动的服务:
echo [1] 仅启动后端服务
echo [2] 仅启动前端服务
echo [3] 同时启动前后端服务
echo [4] 仅初始化数据库
echo [5] 初始化数据库并启动全部服务
echo.

set /p CHOICE=请输入选项 (1-5):

if "%CHOICE%"=="1" goto start_backend
if "%CHOICE%"=="2" goto start_frontend
if "%CHOICE%"=="3" goto start_both
if "%CHOICE%"=="4" goto init_db
if "%CHOICE%"=="5" goto init_and_start_all

echo 无效选项
pause
exit

:start_backend
cd backend
call start-backend.bat
goto end

:start_frontend
cd frontend
call start-frontend.bat
goto end

:start_both
echo 正在启动后端服务 (端口: 8080)...
start "Backend Service" cmd /k "cd backend && mvn spring-boot:run"

echo 等待3秒后启动前端...
timeout /t 3 >nul

echo 正在启动前端服务 (端口: 3000)...
start "Frontend Service" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ========================================
echo 服务启动中...
echo 后端地址: http://localhost:8080
echo 前端地址: http://localhost:3000
echo ========================================
echo.
echo 请等待服务启动完成后在浏览器中访问
echo.
pause
goto end

:init_db
cd backend
call init-db.bat
goto end

:init_and_start_all
echo 正在初始化数据库...
cd backend
call init-db.bat

echo.
echo 正在启动后端服务 (端口: 8080)...
start "Backend Service" cmd /k "cd backend && mvn spring-boot:run"

echo 等待3秒后启动前端...
timeout /t 3 >nul

echo 正在启动前端服务 (端口: 3000)...
start "Frontend Service" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ========================================
echo 全部服务启动中...
echo 后端地址: http://localhost:8080
echo 前端地址: http://localhost:3000
echo ========================================
echo.
echo 请等待服务启动完成后在浏览器中访问
echo.
pause

:end
