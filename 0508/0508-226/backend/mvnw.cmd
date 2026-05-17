@echo off
setlocal

set "DIRNAME=%~dp0"
set "APP_BASE_NAME=%~n0"
set "APP_HOME=%DIRNAME%"

if exist "%JAVA_HOME%\bin\java.exe" (
    set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
) else (
    set "JAVA_EXE=java"
)

"%JAVA_EXE%" -version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Found Java
) else (
    echo ERROR: Java is not installed or not in PATH
    exit /b 1
)

where mvn >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Found Maven
    mvn %*
) else (
    echo ERROR: Maven is not installed or not in PATH
    echo Please install Maven from https://maven.apache.org/download.cgi
    echo Or use IDE like IntelliJ IDEA to open the backend project and run it
    exit /b 1
)

endlocal