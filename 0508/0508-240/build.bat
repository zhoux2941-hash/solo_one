@echo off
echo 正在编译 Java 项目...

if not exist "bin" mkdir bin

javac -d bin -encoding UTF-8 src\com\watermark\util\ImageUtil.java src\com\watermark\model\WatermarkConfig.java src\com\watermark\task\BatchTask.java src\com\watermark\ui\WatermarkToolUI.java src\com\watermark\Main.java

if %errorlevel% equ 0 (
    echo 编译成功！
    echo.
    echo 正在运行程序...
    java -cp bin com.watermark.Main
) else (
    echo 编译失败！
    pause
)