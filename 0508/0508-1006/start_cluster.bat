@echo off
echo Starting PaxosKV 3-node cluster...
echo.

start "Node 1" cmd /c "paxos_kv_server.exe 1"
timeout /t 2 /nobreak >nul

start "Node 2" cmd /c "paxos_kv_server.exe 2"
timeout /t 2 /nobreak >nul

start "Node 3" cmd /c "paxos_kv_server.exe 3"

echo.
echo All nodes started!
echo Use CLI client: paxos_kv_client.exe to connect
pause
