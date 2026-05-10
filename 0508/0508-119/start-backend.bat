@echo off
echo ========================================
echo 启动充电桩预约系统 - 后端服务
echo ========================================
echo.

cd backend
echo [1/2] 正在编译后端项目...
call mvn clean compile -DskipTests

if %ERRORLEVEL% EQU 0 (
    echo [2/2] 正在启动Spring Boot应用...
    echo 请确保MySQL和Redis服务已启动
    echo.
    echo 后端服务地址: http://localhost:8080
    echo.
    call mvn spring-boot:run
) else (
    echo 编译失败，请检查错误信息
    pause
)
