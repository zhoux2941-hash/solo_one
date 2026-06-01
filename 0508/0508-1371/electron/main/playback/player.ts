import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFile } from 'child_process';
import type { HIDInputEvent, SandboxMode, SandboxPlaybackResult, SandboxPlaybackOptions } from '@shared/types';

function toDate(timestamp: Date | number | string): Date {
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
}

const SENDKEYS_MAP: Record<string, string> = {
  'Enter': '{ENTER}',
  'Escape': '{ESC}',
  'Esc': '{ESC}',
  'Backspace': '{BACKSPACE}',
  'Tab': '{TAB}',
  'Delete': '{DELETE}',
  'Insert': '{INSERT}',
  'Home': '{HOME}',
  'End': '{END}',
  'PageUp': '{PGUP}',
  'PageDown': '{PGDN}',
  'ArrowUp': '{UP}',
  'ArrowDown': '{DOWN}',
  'ArrowLeft': '{LEFT}',
  'ArrowRight': '{RIGHT}',
  'F1': '{F1}', 'F2': '{F2}', 'F3': '{F3}', 'F4': '{F4}',
  'F5': '{F5}', 'F6': '{F6}', 'F7': '{F7}', 'F8': '{F8}',
  'F9': '{F9}', 'F10': '{F10}', 'F11': '{F11}', 'F12': '{F12}',
  'CapsLock': '{CAPSLOCK}',
  ' ': ' ',
};

const MODIFIER_SENDKEYS: Record<string, string> = {
  'MetaLeft': '^{ESC}',
  'MetaRight': '^{ESC}',
  'ControlLeft': '^',
  'ControlRight': '^',
  'ShiftLeft': '+',
  'ShiftRight': '+',
  'AltLeft': '%',
  'AltRight': '%',
};

class SandboxPlaybackEngine {
  private events: HIDInputEvent[] = [];
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(os.tmpdir(), 'hid-attack-framework', 'playback');
  }

  loadEvents(events: HIDInputEvent[]): void {
    this.events = [...events];
  }

  clearEvents(): void {
    this.events = [];
  }

  getEvents(): HIDInputEvent[] {
    return [...this.events];
  }

  getEventCount(): number {
    return this.events.length;
  }

  private ensureOutputDir(): void {
    fs.ensureDirSync(this.outputDir);
  }

  generatePlaybackScript(options: SandboxPlaybackOptions): { scriptPath: string; scriptContent: string } {
    this.ensureOutputDir();

    const lines: string[] = [
      '# HID Attack Framework - Sandbox Playback Script',
      '# Generated at: ' + new Date().toISOString(),
      '# WARNING: This script simulates keyboard/mouse input for security analysis ONLY.',
      '# It is designed to run inside an isolated sandbox environment.',
      '',
      'Add-Type -AssemblyName System.Windows.Forms',
      'Add-Type -AssemblyName Microsoft.VisualBasic',
      '',
      '$wshell = New-Object -ComObject WScript.Shell',
      '',
      'function Send-HIDKey {',
      '    param(',
      '        [string]$Key,',
      '        [string[]]$Modifiers,',
      '        [int]$DelayMs = 50',
      '    )',
      '    ',
      '    if ($Modifiers -and $Modifiers.Count -gt 0) {',
      '        $modStr = ($Modifiers | ForEach-Object {',
      '            switch ($_) {',
      '                "ControlLeft" { "^" }',
      '                "ControlRight" { "^" }',
      '                "ShiftLeft" { "+" }',
      '                "ShiftRight" { "+" }',
      '                "AltLeft" { "%" }',
      '                "AltRight" { "%" }',
      '                "MetaLeft" { "^{ESC}" }',
      '                "MetaRight" { "^{ESC}" }',
      '                default { "" }',
      '            }',
      '        }) -join ""',
      '        ',
      '        if ($modStr -eq "^{ESC}") {',
      '            $wshell.SendKeys("^{ESC}")',
      '            Start-Sleep -Milliseconds 200',
      '            if ($Key -and $Key -ne " ") {',
      '                $wshell.SendKeys($Key)',
      '            }',
      '        } else {',
      '            $sendKey = $modStr + $Key',
      '            $wshell.SendKeys($sendKey)',
      '        }',
      '    } else {',
      '        if ($Key) {',
      '            $wshell.SendKeys($Key)',
      '        }',
      '    }',
      '    ',
      '    Start-Sleep -Milliseconds $DelayMs',
      '}',
      '',
      'function Move-SandboxMouse {',
      '    param(',
      '        [int]$DeltaX,',
      '        [int]$DeltaY',
      '    )',
      '    ',
      '    $position = [System.Windows.Forms.Cursor]::Position',
      '    $newX = $position.X + $DeltaX',
      '    $newY = $position.Y + $DeltaY',
      '    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($newX, $newY)',
      '}',
      '',
      'function Click-SandboxMouse {',
      '    param(',
      '        [string]$Button = "Left"',
      '    )',
      '    ',
      '    Add-Type -MemberDefinition @"',
      '    [DllImport("user32.dll")]',
      '    public static extern void mouse_event(int flags, int dx, int dy, int data, int info);',
      '@ -Name U32 -Namespace Win',
      '    ',
      '    switch ($Button) {',
      '        "Left" { [Win.U32]::mouse_event(2, 0, 0, 0, 0); [Win.U32]::mouse_event(4, 0, 0, 0, 0) }',
      '        "Right" { [Win.U32]::mouse_event(8, 0, 0, 0, 0); [Win.U32]::mouse_event(16, 0, 0, 0, 0) }',
      '        "Middle" { [Win.U32]::mouse_event(32, 0, 0, 0, 0); [Win.U32]::mouse_event(64, 0, 0, 0, 0) }',
      '    }',
      '}',
      '',
      'Write-Host "=== HID Attack Framework - Playback Started ===" -ForegroundColor Cyan',
      'Write-Host "Events: ' + this.events.length + ' | Mode: Sandbox | Speed: ' + options.speedMultiplier + 'x" -ForegroundColor Yellow',
      'Write-Host ""',
      '',
    ];

    let prevTime = 0;
    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      const eventTime = toDate(event.timestamp).getTime();

      if (i > 0 && !options.ignoreDelays) {
        const delay = Math.max(0, (eventTime - prevTime) / options.speedMultiplier);
        if (delay > 0) {
          const delaySec = (delay / 1000).toFixed(3);
          lines.push(`Start-Sleep -Milliseconds ${Math.round(delay)}`);
        }
      } else if (i > 0 && options.ignoreDelays) {
        lines.push(`Start-Sleep -Milliseconds ${options.defaultDelayMs}`);
      }

      prevTime = eventTime;

      lines.push(`Write-Host "[${i + 1}/${this.events.length}] ${event.type}: ${event.keyName || ''}${event.modifiers?.length ? ' [' + event.modifiers.join('+') + ']' : ''}" -ForegroundColor Gray`);

      if (event.type === 'keyboard') {
        if (event.modifiers && event.modifiers.length > 0) {
          const modsArr = event.modifiers.map(m => `"${m}"`).join(', ');
          const sendKey = this.mapKeyToSendKeys(event.keyName || '');
          lines.push(`Send-HIDKey -Key "${sendKey}" -Modifiers @(${modsArr}) -DelayMs 10`);
        } else if (event.keyName) {
          const sendKey = this.mapKeyToSendKeys(event.keyName);
          lines.push(`Send-HIDKey -Key "${sendKey}" -DelayMs 10`);
        }
      } else if (event.type === 'mouse') {
        if (event.mouseX !== undefined && event.mouseY !== undefined) {
          lines.push(`Move-SandboxMouse -DeltaX ${event.mouseX} -DeltaY ${event.mouseY}`);
        }
        if (event.keyName === 'MouseLeft') {
          lines.push('Click-SandboxMouse -Button "Left"');
        } else if (event.keyName === 'MouseRight') {
          lines.push('Click-SandboxMouse -Button "Right"');
        } else if (event.keyName === 'MouseMiddle') {
          lines.push('Click-SandboxMouse -Button "Middle"');
        }
      }
    }

    lines.push('');
    lines.push('Write-Host ""');
    lines.push('Write-Host "=== Playback Complete ===" -ForegroundColor Green');
    lines.push('Write-Host "Total events processed: ' + this.events.length + '" -ForegroundColor Cyan');
    lines.push('');
    lines.push('Start-Sleep -Seconds 5');

    const scriptContent = lines.join('\r\n');
    const scriptId = crypto.randomUUID().slice(0, 8);
    const scriptPath = path.join(this.outputDir, `playback_${scriptId}.ps1`);
    fs.writeFileSync(scriptPath, scriptContent, 'utf-8');

    return { scriptPath, scriptContent };
  }

  private mapKeyToSendKeys(keyName: string): string {
    if (SENDKEYS_MAP[keyName]) {
      return SENDKEYS_MAP[keyName];
    }

    if (MODIFIER_SENDKEYS[keyName]) {
      return MODIFIER_SENDKEYS[keyName];
    }

    if (keyName.length === 1) {
      return keyName.toLowerCase();
    }

    return keyName;
  }

  generateWsbConfig(scriptPath: string, options: SandboxPlaybackOptions): string {
    const scriptName = path.basename(scriptPath);
    const sandboxScriptDir = 'C:\\Users\\WDAGUtilityAccount\\Desktop\\playback';
    const memMB = options.sandboxMemoryMB || 4096;

    const wsbContent = `<?xml version="1.0" encoding="utf-8"?>
<Configuration>
  <VGpu>Enable</VGpu>
  <Networking>Disable</Networking>
  <MappedFolders>
    <MappedFolder>
      <HostFolder>${this.outputDir}</HostFolder>
      <SandboxFolder>${sandboxScriptDir}</SandboxFolder>
      <ReadOnly>false</ReadOnly>
    </MappedFolder>
  </MappedFolders>
  <LogonCommand>
    <Command>powershell.exe -ExecutionPolicy Bypass -File "${sandboxScriptDir}\\${scriptName}"</Command>
  </LogonCommand>
  <MemoryInMB>${memMB}</MemoryInMB>
  <AudioInput>Disable</AudioInput>
  <VideoInput>Disable</VideoInput>
  <ProtectedClient>Enable</ProtectedClient>
  <PrinterRedirection>Disable</PrinterRedirection>
  <ClipboardRedirection>Disable</ClipboardRedirection>
</Configuration>`;

    const wsbId = crypto.randomUUID().slice(0, 8);
    const wsbPath = path.join(this.outputDir, `sandbox_${wsbId}.wsb`);
    fs.writeFileSync(wsbPath, wsbContent, 'utf-8');

    return wsbPath;
  }

  generateVmwareScript(scriptPath: string, options: SandboxPlaybackOptions): string {
    const vmName = options.vmwareVmName || 'HID_Playback_Sandbox';
    const vmPath = options.vmwareVmPath || path.join(this.outputDir, 'vm');
    const scriptName = path.basename(scriptPath);

    const ps1Content = `# HID Attack Framework - VMware Sandbox Launcher
# Generated at: ${new Date().toISOString()}
# Requires: VMware Workstation or VMware Player

$ErrorActionPreference = "Stop"

$VMName = "${vmName}"
$VMPath = "${vmPath}"
$VMDiskPath = Join-Path $VMPath "$VMName.vmx"
$ScriptToInject = "${scriptPath}"
$VmrunPath = "vmrun"

function Find-Vmrun {
    $searchPaths = @(
        "$env:ProgramFiles (x86)\\VMware\\VMware Workstation\\vmrun.exe",
        "$env:ProgramFiles\\VMware\\VMware Workstation\\vmrun.exe",
        "$env:ProgramFiles (x86)\\VMware\\VMware Player\\vmrun.exe",
        "$env:ProgramFiles\\VMware\\VMware Player\\vmrun.exe"
    )
    
    foreach ($p in $searchPaths) {
        if (Test-Path $p) { return $p }
    }
    
    $vmrun = Get-Command vmrun -ErrorAction SilentlyContinue
    if ($vmrun) { return $vmrun.Source }
    
    throw "VMware vmrun not found. Please install VMware Workstation or VMware Player."
}

function Create-MiniVM {
    param([string]$Path, [string]$Name)
    
    if (Test-Path (Join-Path $Path "$Name.vmx")) {
        Write-Host "VM already exists, reusing..." -ForegroundColor Yellow
        return
    }
    
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
    
    \$vmxContent = @"
.encoding = "UTF-8"
config.version = "8"
virtualHW.version = "19"
guestOS = "windows10-64"
displayName = "$Name"
memsize = "2048"
numvcpus = "2"
scsi0.present = "TRUE"
scsi0.virtualDev = "lsilogic"
scsi0:0.present = "TRUE"
scsi0:0.fileName = "$Name.vmdk"
ethernet0.present = "FALSE"
usb.present = "TRUE"
sound.present = "FALSE"
floppy0.present = "FALSE"
serial0.present = "FALSE"
parallel0.present = "FALSE"
"@
    
    Set-Content -Path (Join-Path $Path "$Name.vmx") -Value \$vmxContent -Encoding UTF8
    Write-Host "VM configuration created at: $Path\\$Name.vmx" -ForegroundColor Green
}

Write-Host "=== HID Attack Framework - VMware Sandbox ===" -ForegroundColor Cyan

try {
    \$vmrun = Find-Vmrun
    Write-Host "Found vmrun: \$vmrun" -ForegroundColor Green
    
    Create-MiniVM -Path \$VMPath -Name \$VMName
    
    Write-Host ""
    Write-Host "VMware Sandbox Configuration:" -ForegroundColor Yellow
    Write-Host "  VM Name: \$VMName"
    Write-Host "  VM Path: \$VMPath"
    Write-Host "  Script:  \$ScriptToInject"
    Write-Host ""
    Write-Host "To start the VM and run the playback script:" -ForegroundColor Cyan
    Write-Host "  1. Install Windows 10/11 in the VM (first time only)" -ForegroundColor White
    Write-Host "  2. Copy the playback script into the VM via shared folder" -ForegroundColor White
    Write-Host "  3. Run: & '\$vmrun' start \"\$VMDiskPath\" nogui" -ForegroundColor White
    Write-Host "  4. Run: & '\$vmrun' copyFileFromHostToGuest \"\$VMDiskPath\" \"\$ScriptToInject\" \"C:\\playback.ps1\"" -ForegroundColor White
    Write-Host "  5. Run: & '\$vmrun' runScriptInGuest \"\$VMDiskPath\" \"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\" \"-ExecutionPolicy Bypass -File C:\\playback.ps1\"" -ForegroundColor White
    Write-Host ""
    Write-Host "Playback script is ready at: \$ScriptToInject" -ForegroundColor Green
    
} catch {
    Write-Host "Error: \$_" -ForegroundColor Red
    Write-Host ""
    Write-Host "The playback script has still been generated and can be" -ForegroundColor Yellow
    Write-Host "manually copied into any VMware VM for execution." -ForegroundColor Yellow
}
`;

    const vmwareId = crypto.randomUUID().slice(0, 8);
    const vmwareScriptPath = path.join(this.outputDir, `vmware_launch_${vmwareId}.ps1`);
    fs.writeFileSync(vmwareScriptPath, ps1Content, 'utf-8');

    return vmwareScriptPath;
  }

  async generateSandboxPlayback(options: SandboxPlaybackOptions): Promise<SandboxPlaybackResult> {
    try {
      this.ensureOutputDir();

      const { scriptPath } = this.generatePlaybackScript(options);

      if (options.mode === 'windows-sandbox') {
        const wsbPath = this.generateWsbConfig(scriptPath, options);

        return {
          success: true,
          mode: 'windows-sandbox',
          scriptPath,
          configPath: wsbPath,
          outputPath: this.outputDir,
          message: `Windows Sandbox playback generated. Double-click ${wsbPath} to launch.`,
        };
      }

      if (options.mode === 'vmware') {
        const vmwareScriptPath = this.generateVmwareScript(scriptPath, options);

        return {
          success: true,
          mode: 'vmware',
          scriptPath,
          configPath: vmwareScriptPath,
          outputPath: this.outputDir,
          message: `VMware playback generated. Run ${vmwareScriptPath} to set up the VM.`,
        };
      }

      return {
        success: false,
        mode: options.mode,
        scriptPath,
        outputPath: this.outputDir,
        message: `Unknown sandbox mode: ${options.mode}`,
      };
    } catch (error) {
      return {
        success: false,
        mode: options.mode,
        scriptPath: '',
        outputPath: this.outputDir,
        message: `Failed to generate sandbox playback: ${(error as Error).message}`,
      };
    }
  }

  async launchWindowsSandbox(wsbPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      execFile('WindowsSandbox.exe', [wsbPath], (error) => {
        if (error) {
          console.error('Failed to launch Windows Sandbox:', error);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  async checkSandboxAvailable(): Promise<{ sandbox: boolean; vmware: boolean }> {
    const result = { sandbox: false, vmware: false };

    try {
      const sandboxPath = path.join(
        process.env.SystemRoot || 'C:\\Windows',
        'System32',
        'WindowsSandbox.exe'
      );
      result.sandbox = fs.existsSync(sandboxPath);
    } catch {
      // not available
    }

    try {
      const vmwarePaths = [
        'C:\\Program Files (x86)\\VMware\\VMware Workstation\\vmrun.exe',
        'C:\\Program Files\\VMware\\VMware Workstation\\vmrun.exe',
        'C:\\Program Files (x86)\\VMware\\VMware Player\\vmrun.exe',
        'C:\\Program Files\\VMware\\VMware Player\\vmrun.exe',
      ];
      result.vmware = vmwarePaths.some((p) => fs.existsSync(p));
    } catch {
      // not available
    }

    return result;
  }

  destroy(): void {
    this.clearEvents();
  }
}

export const playbackEngine = new SandboxPlaybackEngine();
export default SandboxPlaybackEngine;
export type { SandboxMode, SandboxPlaybackResult, SandboxPlaybackOptions };
