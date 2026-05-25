@echo off
echo ========================================
echo   手语教学系统 - 启动脚本
echo ========================================
echo.

echo [1/2] 启动后端服务...
start "手语教学后端" cmd /k "cd backend && pip install -r requirements.txt && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo 等待后端启动...
timeout /t 5 /nobreak > nul

echo [2/2] 启动前端服务...
start "手语教学前端" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo 启动完成！
echo 前端地址: http://localhost:5173
echo 后端API: http://localhost:8000
echo API文档: http://localhost:8000/docs
echo.
pause
