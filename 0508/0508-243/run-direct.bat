@echo off
echo 正在启动局域网设备探测工具...
java -cp target\classes com.networkscanner.Main
if errorlevel 1 (
    echo 运行失败，请确保已执行 mvn compile 编译项目
    pause
)
