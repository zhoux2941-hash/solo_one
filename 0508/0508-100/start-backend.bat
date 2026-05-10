@echo off
echo ========================================
echo   食堂剩菜回收量预测系统 - 后端启动
echo ========================================
echo.

cd canteen-backend

echo [INFO] 正在启动 Spring Boot 后端服务...
echo [INFO] 请确保 MySQL 和 Redis 已启动
echo.

mvn spring-boot:run

pause
