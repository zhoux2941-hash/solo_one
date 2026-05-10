@echo off
echo ========================================
echo 戏曲脸谱设计工具 - 数据库初始化脚本
echo ========================================

echo.
echo 请确保MySQL服务已启动...
echo.

set MYSQL_HOST=localhost
set MYSQL_PORT=3306
set MYSQL_USER=root
set MYSQL_PASSWORD=root
set DATABASE=opera_mask

echo 正在执行数据库初始化...
mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_USER% -p%MYSQL_PASSWORD% < src\main\resources\schema.sql

if %errorlevel% equ 0 (
    echo.
    echo [成功] 数据库表结构创建完成
    echo.
    echo 是否导入示例数据？(y/n)
    set /p IMPORT_DATA=
    if /i "%IMPORT_DATA%"=="y" (
        mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_USER% -p%MYSQL_PASSWORD% < src\main\resources\data.sql
        if %errorlevel% equ 0 (
            echo [成功] 示例数据导入完成
        ) else (
            echo [失败] 示例数据导入失败
        )
    )
) else (
    echo.
    echo [失败] 数据库初始化失败，请检查MySQL连接配置
    echo.
    echo 提示：请确认：
    echo   1. MySQL服务已启动
    echo   2. 用户名密码正确（默认 root/root）
    echo   3. 如需修改配置，请编辑此脚本
)

echo.
echo 初始化完成！
pause
