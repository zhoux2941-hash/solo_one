@echo off
chcp 65001 >nul
echo ==============================================
echo  分布式追踪系统演示
echo ==============================================
echo.
echo 此脚本将演示如何启动多节点分布式追踪系统。
echo.
echo 步骤1: 启动 MASTER 节点 (端口 8765)
echo 步骤2: 启动多个 EDGE 节点
echo.
echo 请在新的终端窗口中分别运行以下命令:
echo.
echo 终端1 (MASTER):
echo   cd /d %~dp0..
echo   python scripts\set_master.py
echo   python backend\api\main.py
echo.
echo 终端2 (EDGE 1):
echo   cd /d %~dp0..
echo   python scripts\set_edge.py cam_01 region_a
echo   python backend\api\main.py
echo.
echo 终端3 (EDGE 2):
echo   cd /d %~dp0..
echo   python scripts\set_edge.py cam_02 region_a
echo   python backend\api\main.py
echo.
echo ==============================================
echo 前端访问:
echo   Master: http://localhost:8000
echo   Edge 1: http://localhost:8001  (需修改端口)
echo   Edge 2: http://localhost:8002  (需修改端口)
echo ==============================================
pause
