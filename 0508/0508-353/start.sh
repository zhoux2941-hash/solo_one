#!/bin/bash
echo "========================================"
echo "  手语教学系统 - 启动脚本"
echo "========================================"
echo ""

echo "[1/2] 启动后端服务..."
cd backend && pip install -r requirements.txt && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "等待后端启动..."
sleep 5

echo "[2/2] 启动前端服务..."
cd ../frontend && npm install && npm run dev &
FRONTEND_PID=$!

echo ""
echo "启动完成！"
echo "前端地址: http://localhost:5173"
echo "后端API: http://localhost:8000"
echo "API文档: http://localhost:8000/docs"
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
