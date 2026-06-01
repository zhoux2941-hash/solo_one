import { useState } from 'react';
import {
  Cpu,
  Play,
  Download,
  Terminal,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  FileCode,
  Zap,
  Settings,
  FolderOpen,
  Copy,
  Info,
  AlertTriangle,
} from 'lucide-react';
import type { DeviceType, DeviceCompileResult, OutputType } from '@shared/types';

interface DeviceConfig {
  id: DeviceType;
  name: string;
  description: string;
  icon: string;
  outputFormat: string;
  fileExtension: string;
  features: string[];
}

const devices: DeviceConfig[] = [
  {
    id: 'arduino',
    name: 'Arduino Leonardo',
    description: '基于 ATmega32u4 的开发板，支持 HID 键盘模拟',
    icon: 'Arduino',
    outputFormat: 'Intel HEX',
    fileExtension: '.hex',
    features: ['USB HID 模拟', '即插即用', '开源固件', '广泛兼容'],
  },
  {
    id: 'pico',
    name: 'Raspberry Pi Pico',
    description: '基于 RP2040 的微控制器，支持 USB HID 和 UF2 启动',
    icon: 'Pico',
    outputFormat: 'UF2 Firmware',
    fileExtension: '.uf2',
    features: ['UF2 拖拽烧录', '双核处理器', '大容量存储', '低成本'],
  },
  {
    id: 'badusb',
    name: 'USB Rubber Ducky',
    description: '经典的 HID 注入设备，使用 Ducky Script 语法',
    icon: 'Ducky',
    outputFormat: 'Inject Binary',
    fileExtension: '.bin',
    features: ['Ducky Script 兼容', '高速注入', '隐藏存储', '即插即用'],
  },
  {
    id: 'flipper',
    name: 'Flipper Zero',
    description: '多功能渗透测试设备，支持多种无线协议',
    icon: 'Flipper',
    outputFormat: 'Flipper Script',
    fileExtension: '.txt',
    features: ['BadUSB 模式', 'RFID/NFC 模拟', 'Sub-GHz', '红外遥控'],
  },
];

const mockCompileLogs = [
  { type: 'info', message: 'Starting compilation process...', time: '00:00:01' },
  { type: 'info', message: 'Parsing DSL script...', time: '00:00:02' },
  { type: 'success', message: 'Script parsed successfully, 42 commands found', time: '00:00:03' },
  { type: 'info', message: 'Generating HID report descriptors...', time: '00:00:04' },
  { type: 'info', message: 'Optimizing payload size...', time: '00:00:05' },
  { type: 'success', message: 'Payload optimized: reduced by 23%', time: '00:00:06' },
  { type: 'info', message: 'Compiling to Arduino C++...', time: '00:00:07' },
  { type: 'info', message: 'Linking with HID libraries...', time: '00:00:09' },
  { type: 'info', message: 'Generating Intel HEX file...', time: '00:00:11' },
  { type: 'success', message: 'Compilation successful!', time: '00:00:12' },
  { type: 'info', message: 'Output file: payload.hex (12.5 KB)', time: '00:00:12' },
];

interface CompileState {
  status: 'idle' | 'compiling' | 'success' | 'error';
  progress: number;
  result: DeviceCompileResult | null;
  logs: Array<{ type: string; message: string; time: string }>;
}

function getDeviceIcon(deviceId: DeviceType) {
  switch (deviceId) {
    case 'arduino':
      return <Cpu className="text-cyber-cyan" size={28} />;
    case 'pico':
      return <HardDrive className="text-cyber-green" size={28} />;
    case 'badusb':
      return <Zap className="text-cyber-yellow" size={28} />;
    case 'flipper':
      return <Terminal className="text-cyber-purple" size={28} />;
    default:
      return <Cpu className="text-cyber-muted" size={28} />;
  }
}

function getLogColor(type: string) {
  switch (type) {
    case 'success':
      return 'text-cyber-green';
    case 'error':
      return 'text-cyber-red';
    case 'warning':
      return 'text-cyber-yellow';
    default:
      return 'text-cyber-muted';
  }
}

export default function DeviceCompiler() {
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('arduino');
  const [compileState, setCompileState] = useState<CompileState>({
    status: 'idle',
    progress: 0,
    result: null,
    logs: [],
  });
  const [selectedOutputFormat, setSelectedOutputFormat] = useState('default');

  const currentDevice = devices.find((d) => d.id === selectedDevice)!;

  const handleCompile = () => {
    setCompileState({
      status: 'compiling',
      progress: 0,
      result: null,
      logs: [],
    });

    let progress = 0;
    let logIndex = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setCompileState((prev) => ({
          ...prev,
          status: 'success',
          progress: 100,
          result: {
            success: true,
            outputPath: `/output/payload${currentDevice.fileExtension}`,
            outputType: currentDevice.fileExtension.slice(1) as OutputType,
            fileSize: 12500 + Math.floor(Math.random() * 5000),
            errors: [],
            targetDevice: selectedDevice,
          },
        }));
      }

      if (logIndex < mockCompileLogs.length && progress > (logIndex + 1) * (100 / mockCompileLogs.length)) {
        setCompileState((prev) => ({
          ...prev,
          progress: Math.min(progress, 100),
          logs: [...prev.logs, mockCompileLogs[logIndex]],
        }));
        logIndex++;
      } else {
        setCompileState((prev) => ({
          ...prev,
          progress: Math.min(progress, 100),
        }));
      }
    }, 200);
  };

  const handleReset = () => {
    setCompileState({
      status: 'idle',
      progress: 0,
      result: null,
      logs: [],
    });
  };

  return (
    <div className="h-full flex flex-col cyber-grid">
      <div className="px-6 py-4 border-b border-cyber-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-cyber-green/20">
              <Cpu className="text-cyber-green" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-cyber-text neon-text-green">
                设备编译
              </h1>
              <p className="text-cyber-muted text-sm">将 DSL 脚本编译为各种 HID 设备固件</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {compileState.status === 'success' && (
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-text hover:border-cyber-cyan/50 transition-colors btn-cyber"
              >
                重新编译
              </button>
            )}
            <button
              onClick={handleCompile}
              disabled={compileState.status === 'compiling'}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all btn-cyber ${
                compileState.status === 'compiling'
                  ? 'bg-cyber-surface border border-cyber-border text-cyber-muted cursor-not-allowed'
                  : 'bg-cyber-green text-black hover:bg-cyber-green/80 neon-glow-green'
              }`}
            >
              {compileState.status === 'compiling' ? (
                <>
                  <div className="w-4 h-4 border-2 border-cyber-muted border-t-transparent rounded-full animate-spin" />
                  编译中...
                </>
              ) : (
                <>
                  <Play size={16} />
                  开始编译
                </>
              )}
            </button>
            {compileState.status === 'success' && compileState.result && (
              <button className="flex items-center gap-2 px-6 py-2 rounded-lg bg-cyber-purple text-white font-medium hover:bg-cyber-purple/80 transition-colors btn-cyber neon-glow-purple">
                <Download size={16} />
                下载 {currentDevice.fileExtension}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-cyber-border bg-cyber-bg/30 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-cyber-text mb-3 flex items-center gap-2">
              <Cpu className="text-cyber-cyan" size={16} />
              选择目标设备
            </h3>
            <div className="space-y-2">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device.id)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    selectedDevice === device.id
                      ? 'bg-cyber-purple/20 border-cyber-purple/50 data-flow-border'
                      : 'bg-cyber-surface/30 border-cyber-border hover:border-cyber-muted'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${
                        selectedDevice === device.id
                          ? 'bg-cyber-purple/30'
                          : 'bg-cyber-surface/50'
                      }`}
                    >
                      {getDeviceIcon(device.id)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-cyber-text">{device.name}</p>
                      <p className="text-xs text-cyber-muted">{device.outputFormat}</p>
                    </div>
                  </div>
                  <p className="text-xs text-cyber-muted line-clamp-2">{device.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-cyber-border">
            <h3 className="text-sm font-semibold text-cyber-text mb-3 flex items-center gap-2">
              <Settings className="text-cyber-yellow" size={16} />
              编译选项
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-cyber-muted block mb-1">输出格式</label>
                <select
                  value={selectedOutputFormat}
                  onChange={(e) => setSelectedOutputFormat(e.target.value)}
                  className="w-full p-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-text text-sm"
                >
                  <option value="default">默认格式</option>
                  <option value="minified">最小化</option>
                  <option value="debug">调试版本</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-cyber-muted">优化大小</span>
                <button className="w-10 h-5 rounded-full bg-cyber-green/30 relative transition-colors">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-cyber-green" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-cyber-muted">包含调试符号</span>
                <button className="w-10 h-5 rounded-full bg-cyber-border relative transition-colors">
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-cyber-muted" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-cyber-border">
            <h3 className="text-sm font-semibold text-cyber-text mb-3 flex items-center gap-2">
              <Info className="text-cyber-cyan" size={16} />
              设备特性
            </h3>
            <div className="space-y-2">
              {currentDevice.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="text-cyber-green" size={14} />
                  <span className="text-cyber-muted">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {compileState.status !== 'idle' && (
            <div className="px-6 py-3 border-b border-cyber-border bg-cyber-surface/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-cyber-muted">编译进度</span>
                <span className={`text-sm font-medium ${
                  compileState.status === 'success' ? 'text-cyber-green' :
                  compileState.status === 'error' ? 'text-cyber-red' : 'text-cyber-cyan'
                }`}>
                  {compileState.status === 'compiling' && '编译中...'}
                  {compileState.status === 'success' && '编译完成'}
                  {compileState.status === 'error' && '编译失败'}
                </span>
              </div>
              <div className="h-2 bg-cyber-border rounded-full overflow-hidden progress-bar">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    compileState.status === 'error' ? 'bg-cyber-red' :
                    compileState.status === 'success' ? 'bg-cyber-green' : 'bg-cyber-purple'
                  }`}
                  style={{ width: `${compileState.progress}%` }}
                />
              </div>
            </div>
          )}

          {compileState.status === 'success' && compileState.result && (
            <div className="px-6 py-4 border-b border-cyber-border">
              <div className="glass-panel rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-cyber-green/20">
                      <CheckCircle className="text-cyber-green" size={28} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-cyber-green">编译成功！</h3>
                      <p className="text-sm text-cyber-muted mt-1">
                        固件已生成，可下载到目标设备
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <FileCode className="text-cyber-cyan" size={14} />
                      <span className="text-sm text-cyber-text font-mono">
                        payload{currentDevice.fileExtension}
                      </span>
                      <button className="text-cyber-muted hover:text-cyber-cyan">
                        <Copy size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-cyber-muted">
                      <span className="flex items-center gap-1">
                        <HardDrive size={12} />
                        {(compileState.result.fileSize / 1024).toFixed(2)} KB
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        ~12s
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-2 bg-cyber-surface/10 border-b border-cyber-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="text-cyber-cyan" size={14} />
                <span className="text-sm text-cyber-muted">编译输出</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs text-cyber-muted hover:text-cyber-text flex items-center gap-1">
                  <Copy size={12} />
                  复制日志
                </button>
                <button className="text-xs text-cyber-muted hover:text-cyber-text flex items-center gap-1">
                  <FolderOpen size={12} />
                  打开目录
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-cyber-bg/50 p-4">
              {compileState.logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-cyber-muted">
                  <Terminal className="mb-3 opacity-50" size={48} />
                  <p className="text-sm">等待编译开始...</p>
                  <p className="text-xs mt-1">点击"开始编译"按钮生成设备固件</p>
                </div>
              ) : (
                <div className="font-mono text-sm space-y-1">
                  {compileState.logs.map((log, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-cyber-muted/50 text-xs">{log.time}</span>
                      <span className={getLogColor(log.type)}>
                        {log.type === 'success' && '✓ '}
                        {log.type === 'error' && '✗ '}
                        {log.message}
                      </span>
                    </div>
                  ))}
                  {compileState.status === 'compiling' && (
                    <div className="flex items-center gap-2 text-cyber-cyan">
                      <span className="animate-pulse">▋</span>
                      <span>Processing...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {compileState.status === 'success' && compileState.result && (
            <div className="px-6 py-4 border-t border-cyber-border bg-cyber-surface/20">
              <div className="flex items-center justify-between">
                <div className="text-sm text-cyber-muted">
                  <AlertTriangle className="text-cyber-yellow inline mr-2" size={14} />
                  提示：将设备进入烧录模式后，拖放固件文件到设备存储中
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-text hover:border-cyber-cyan/50 transition-colors btn-cyber text-sm flex items-center gap-2">
                    <FolderOpen size={14} />
                    查看输出目录
                  </button>
                  <button className="px-5 py-2 rounded-lg bg-cyber-purple text-white font-medium hover:bg-cyber-purple/80 transition-colors btn-cyber neon-glow-purple text-sm flex items-center gap-2">
                    <Download size={14} />
                    下载固件
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
