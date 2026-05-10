@echo off
echo ============================================
echo  安装项目依赖
echo ============================================
echo.

echo ========== 安装前端依赖 ==========
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo 错误: 前端依赖安装失败
    cd ..
    pause
    exit /b 1
)
echo 前端依赖安装成功!
echo.

cd ..

echo ========== 安装后端依赖 ==========
cd backend
where mvn >nul 2>&1
if %errorlevel% neq 0 (
    echo 警告: 未找到Maven，请确保已安装Maven
    echo 后端依赖将在首次运行时自动下载
) else (
    echo 正在下载Maven依赖...
    call mvn dependency:resolve
    if %errorlevel% neq 0 (
        echo 警告: Maven依赖下载可能有问题，但不影响后续运行
    ) else (
        echo 后端依赖安装成功!
    )
)
echo.

cd ..

echo ============================================
echo  依赖安装完成!
echo ============================================
echo.
echo 下一步操作:
echo 1. 确保MySQL和Redis服务已启动
echo 2. 执行 schema.sql 初始化数据库
echo 3. 运行 start-backend.bat 启动后端
echo 4. 运行 start-frontend.bat 启动前端
echo.

pause
