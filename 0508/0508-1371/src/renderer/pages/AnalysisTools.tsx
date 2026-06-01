import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Clock,
  Zap,
  BarChart3,
  Activity,
  Copy,
  ExternalLink,
  Check,
  Monitor,
  Box,
  FileCode,
  FolderOpen,
  FileText,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { VirusTotalScanResult, SandboxMode, SandboxPlaybackResult } from '@shared/types';

interface PlaybackEvent {
  id: number;
  time: number;
  type: 'key' | 'delay' | 'string' | 'mouse';
  value: string;
  keyCode?: string;
}

const mockPlaybackSequence: PlaybackEvent[] = [
  { id: 1, time: 0, type: 'delay', value: '500ms' },
  { id: 2, time: 500, type: 'key', value: 'GUI r', keyCode: '0x53' },
  { id: 3, time: 1000, type: 'delay', value: '100ms' },
  { id: 4, time: 1100, type: 'string', value: 'cmd.exe' },
  { id: 5, time: 1500, type: 'key', value: 'ENTER', keyCode: '0x28' },
  { id: 6, time: 2000, type: 'delay', value: '300ms' },
  { id: 7, time: 2300, type: 'string', value: 'whoami /priv' },
  { id: 8, time: 3000, type: 'key', value: 'ENTER', keyCode: '0x28' },
  { id: 9, time: 3500, type: 'delay', value: '500ms' },
  { id: 10, time: 4000, type: 'string', value: 'net user admin P@ssw0rd /add' },
  { id: 11, time: 5000, type: 'key', value: 'ENTER', keyCode: '0x28' },
  { id: 12, time: 5500, type: 'delay', value: '300ms' },
  { id: 13, time: 5800, type: 'string', value: 'net localgroup administrators admin /add' },
  { id: 14, time: 6800, type: 'key', value: 'ENTER', keyCode: '0x28' },
];

const mockVTScan: VirusTotalScanResult = {
  scanId: 'vt_scan_0012345',
  permalink: 'https://www.virustotal.com/gui/file/abc123',
  positives: 12,
  total: 67,
  detectionRate: 17.9,
  scanDate: new Date(Date.now() - 3600000),
  scans: {
    'Microsoft': { detected: true, result: 'Trojan:Win32/RedLine' },
    'Kaspersky': { detected: true, result: 'HEUR:Trojan.Script.Generic' },
    'Malwarebytes': { detected: true, result: 'Malware.Heuristic.1234' },
    'ESET-NOD32': { detected: false, result: null as any },
    'Symantec': { detected: true, result: 'Trojan.Gen.2' },
    'McAfee': { detected: false, result: null as any },
    'Avast': { detected: true, result: 'Win32:MalwareX-gen [Trj]' },
    'BitDefender': { detected: true, result: 'Trojan.GenericKD.12345678' },
  },
};

const detectionRateData = [
  { name: '键盘输入', rate: 94.5, color: '#10b981' },
  { name: '快捷键序列', rate: 87.2, color: '#06b6d4' },
  { name: '鼠标移动', rate: 72.8, color: '#8b5cf6' },
  { name: 'Rubber Ducky', rate: 98.1, color: '#ec4899' },
  { name: '鼠标点击', rate: 81.3, color: '#f59e0b' },
];

const categoryData = [
  { name: '已检测', value: 12, color: '#ef4444' },
  { name: '未检测', value: 55, color: '#334155' },
];

export default function AnalysisTools() {
  const [activeTab, setActiveTab] = useState<'playback' | 'vt-scan' | 'detection'>('playback');
  const [sandboxMode, setSandboxMode] = useState<SandboxMode>('windows-sandbox');
  const [sandboxAvailable, setSandboxAvailable] = useState<{ sandbox: boolean; vmware: boolean }>({ sandbox: false, vmware: false });
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [ignoreDelays, setIgnoreDelays] = useState(false);
  const [defaultDelayMs, setDefaultDelayMs] = useState(50);
  const [sandboxMemoryMB, setSandboxMemoryMB] = useState(4096);
  const [vmwareVmName, setVmwareVmName] = useState('HID_Playback_Sandbox');
  const [generating, setGenerating] = useState(false);
  const [playbackResult, setPlaybackResult] = useState<SandboxPlaybackResult | null>(null);
  const [vtScanning, setVtScanning] = useState(false);
  const [vtProgress, setVtProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [inputSequence, setInputSequence] = useState(`DELAY 500
GUI r
DELAY 100
STRING cmd.exe
ENTER
DELAY 300
STRING whoami /priv
ENTER
DELAY 500
STRING net user admin P@ssw0rd /add
ENTER
DELAY 300
STRING net localgroup administrators admin /add
ENTER`);

  useEffect(() => {
    window.electronAPI?.playback.status().then((status) => {
      if (status) setSandboxAvailable(status);
    }).catch(() => {});
  }, []);

  const handleGenerateSandbox = async () => {
    setGenerating(true);
    setPlaybackResult(null);
    try {
      const events = mockPlaybackSequence.map((e) => ({
        id: String(e.id),
        timestamp: new Date(e.time),
        devicePath: '',
        type: e.type === 'key' || e.type === 'string' ? 'keyboard' as const : 'mouse' as const,
        keyCode: e.keyCode ? parseInt(e.keyCode.replace('0x', ''), 16) : undefined,
        keyName: e.type === 'string' ? e.value : (e.type === 'key' ? e.value.split(' ').pop() : undefined),
        isModifier: e.type === 'key' && e.value.includes(' '),
        modifiers: e.type === 'key' && e.value.includes(' ') ? e.value.split(' ').slice(0, -1) : [],
        rawData: [],
      }));

      const result = await window.electronAPI?.playback.start(events, {
        mode: sandboxMode,
        speedMultiplier: playbackSpeed,
        ignoreDelays,
        defaultDelayMs,
        sandboxMemoryMB,
        vmwareVmName,
      });
      setPlaybackResult(result);
    } catch (error) {
      setPlaybackResult({
        success: false,
        mode: sandboxMode,
        scriptPath: '',
        outputPath: '',
        message: `Generation failed: ${(error as Error).message}`,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateOnly = async () => {
    setGenerating(true);
    setPlaybackResult(null);
    try {
      const events = mockPlaybackSequence.map((e) => ({
        id: String(e.id),
        timestamp: new Date(e.time),
        devicePath: '',
        type: e.type === 'key' || e.type === 'string' ? 'keyboard' as const : 'mouse' as const,
        keyCode: e.keyCode ? parseInt(e.keyCode.replace('0x', ''), 16) : undefined,
        keyName: e.type === 'string' ? e.value : (e.type === 'key' ? e.value.split(' ').pop() : undefined),
        isModifier: e.type === 'key' && e.value.includes(' '),
        modifiers: e.type === 'key' && e.value.includes(' ') ? e.value.split(' ').slice(0, -1) : [],
        rawData: [],
      }));

      const result = await window.electronAPI?.playback.generateScript(events, {
        mode: sandboxMode,
        speedMultiplier: playbackSpeed,
        ignoreDelays,
        defaultDelayMs,
        sandboxMemoryMB,
        vmwareVmName,
      });
      setPlaybackResult(result);
    } catch (error) {
      setPlaybackResult({
        success: false,
        mode: sandboxMode,
        scriptPath: '',
        outputPath: '',
        message: `Script generation failed: ${(error as Error).message}`,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenOutputDir = () => {
    if (playbackResult?.outputPath) {
      window.electronAPI?.shell.openPath(playbackResult.outputPath);
    }
  };

  const handleVTScan = () => {
    setVtScanning(true);
    setVtProgress(0);
    const interval = setInterval(() => {
      setVtProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setVtScanning(false);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}s`;
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'key': return 'text-cyber-purple';
      case 'string': return 'text-cyber-green';
      case 'delay': return 'text-cyber-yellow';
      case 'mouse': return 'text-cyber-cyan';
      default: return 'text-cyber-muted';
    }
  };

  const copyVTLink = () => {
    navigator.clipboard.writeText(mockVTScan.permalink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cyber-text neon-text-purple mb-2">分析工具</h1>
        <p className="text-cyber-muted text-sm">输入序列回放、病毒扫描与检测率分析</p>
      </div>

      <div className="glass-panel rounded-xl p-1 mb-6 inline-flex">
        {[
          { id: 'playback', label: '序列回放', icon: Play },
          { id: 'vt-scan', label: 'VT扫描报告', icon: Shield },
          { id: 'detection', label: '检测率展示', icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'playback' | 'vt-scan' | 'detection')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-cyber-purple text-white shadow-neon-purple'
                : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/30'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'playback' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          <div className="glass-panel rounded-xl p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-cyber-text mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyber-purple" />
              输入序列预览
            </h2>

            <div className="mb-4">
              <label className="block text-cyber-muted text-sm mb-2">DSL 脚本输入</label>
              <textarea
                value={inputSequence}
                onChange={(e) => setInputSequence(e.target.value)}
                className="w-full h-48 px-4 py-3 bg-black/50 border border-cyber-border rounded-lg text-cyber-green font-mono text-sm focus:outline-none focus:border-cyber-purple resize-none"
              />
            </div>

            <div className="flex-1 bg-cyber-bg/50 rounded-lg border border-cyber-border p-4 overflow-auto">
              <div className="text-cyber-muted text-sm mb-3">事件序列 ({mockPlaybackSequence.length} 个事件)</div>
              <div className="space-y-1">
                {mockPlaybackSequence.map((event, index) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  >
                    <span className="text-cyber-muted text-xs font-mono w-16">
                      {event.time}ms
                    </span>
                    <span className={`font-mono text-sm ${getEventColor(event.type)}`}>
                      {event.type.toUpperCase()}
                    </span>
                    <span className="text-cyber-text font-mono text-sm flex-1">
                      {event.value}
                    </span>
                    {event.keyCode && (
                      <span className="text-cyber-muted text-xs font-mono">
                        {event.keyCode}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-cyber-text mb-4 flex items-center gap-2">
              <Box className="w-5 h-5 text-cyber-cyan" />
              沙箱回放配置
            </h2>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-cyber-muted text-sm">沙箱环境</label>
                <div className="flex items-center gap-2 text-xs">
                  {sandboxAvailable.sandbox && (
                    <span className="px-2 py-0.5 rounded bg-cyber-green/20 text-cyber-green">Windows Sandbox ✓</span>
                  )}
                  {sandboxAvailable.vmware && (
                    <span className="px-2 py-0.5 rounded bg-cyber-purple/20 text-cyber-purple">VMware ✓</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSandboxMode('windows-sandbox')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    sandboxMode === 'windows-sandbox'
                      ? 'border-cyber-cyan bg-cyber-cyan/10 shadow-neon-cyan'
                      : 'border-cyber-border hover:border-cyber-cyan/50'
                  }`}
                >
                  <Monitor className="w-6 h-6 text-cyber-cyan mb-2" />
                  <div className="text-cyber-text font-medium text-sm">Windows Sandbox</div>
                  <div className="text-cyber-muted text-xs mt-1">系统自带沙箱，即开即用</div>
                  {!sandboxAvailable.sandbox && (
                    <div className="text-cyber-yellow text-xs mt-1">⚠ 需要启用Windows功能</div>
                  )}
                </button>
                <button
                  onClick={() => setSandboxMode('vmware')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    sandboxMode === 'vmware'
                      ? 'border-cyber-purple bg-cyber-purple/10 shadow-neon-purple'
                      : 'border-cyber-border hover:border-cyber-purple/50'
                  }`}
                >
                  <Box className="w-6 h-6 text-cyber-purple mb-2" />
                  <div className="text-cyber-text font-medium text-sm">VMware 虚拟机</div>
                  <div className="text-cyber-muted text-xs mt-1">独立VM，完整隔离</div>
                  {!sandboxAvailable.vmware && (
                    <div className="text-cyber-yellow text-xs mt-1">⚠ 需要安装VMware</div>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-cyber-muted">回放速度</span>
                  <span className="text-cyber-text font-mono">{playbackSpeed}x</span>
                </div>
                <div className="flex gap-2">
                  {[0.25, 0.5, 1, 2, 4].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                        playbackSpeed === speed
                          ? 'bg-cyber-purple text-white'
                          : 'bg-cyber-border/50 text-cyber-muted hover:bg-cyber-border hover:text-cyber-text'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-cyber-muted text-sm">忽略原始延时</span>
                <button
                  onClick={() => setIgnoreDelays(!ignoreDelays)}
                  className={`w-10 h-5 rounded-full transition-colors ${
                    ignoreDelays ? 'bg-cyber-purple' : 'bg-cyber-border'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    ignoreDelays ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {sandboxMode === 'windows-sandbox' && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-cyber-muted">沙箱内存 (MB)</span>
                    <span className="text-cyber-text font-mono">{sandboxMemoryMB}</span>
                  </div>
                  <input
                    type="range"
                    min="1024"
                    max="8192"
                    step="512"
                    value={sandboxMemoryMB}
                    onChange={(e) => setSandboxMemoryMB(parseInt(e.target.value))}
                    className="w-full accent-cyber-cyan"
                  />
                </div>
              )}

              {sandboxMode === 'vmware' && (
                <div>
                  <label className="block text-cyber-muted text-sm mb-1">虚拟机名称</label>
                  <input
                    type="text"
                    value={vmwareVmName}
                    onChange={(e) => setVmwareVmName(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-cyber-border rounded-lg text-cyber-text text-sm focus:outline-none focus:border-cyber-purple"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={handleGenerateSandbox}
                disabled={generating}
                className="flex-1 py-2.5 bg-gradient-to-r from-cyber-purple to-cyber-cyan text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {generating ? '生成中...' : '生成并启动沙箱'}
              </button>
              <button
                onClick={handleGenerateOnly}
                disabled={generating}
                className="flex-1 py-2.5 bg-cyber-green/20 text-cyber-green rounded-lg hover:bg-cyber-green/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FileCode className="w-4 h-4" />
                仅生成脚本
              </button>
            </div>

            {playbackResult && (
              <div className={`flex-1 rounded-lg border p-4 overflow-auto ${
                playbackResult.success
                  ? 'bg-cyber-green/5 border-cyber-green/30'
                  : 'bg-cyber-red/5 border-cyber-red/30'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {playbackResult.success ? (
                    <CheckCircle className="w-5 h-5 text-cyber-green" />
                  ) : (
                    <XCircle className="w-5 h-5 text-cyber-red" />
                  )}
                  <span className={`font-medium ${playbackResult.success ? 'text-cyber-green' : 'text-cyber-red'}`}>
                    {playbackResult.success ? '沙箱回放已生成' : '生成失败'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-cyber-muted w-20">模式:</span>
                    <span className="text-cyber-text font-mono">
                      {playbackResult.mode === 'windows-sandbox' ? 'Windows Sandbox' : 'VMware'}
                    </span>
                  </div>
                  {playbackResult.scriptPath && (
                    <div className="flex items-center gap-2">
                      <span className="text-cyber-muted w-20">回放脚本:</span>
                      <span className="text-cyber-cyan font-mono text-xs break-all">{playbackResult.scriptPath}</span>
                    </div>
                  )}
                  {playbackResult.configPath && (
                    <div className="flex items-center gap-2">
                      <span className="text-cyber-muted w-20">
                        {playbackResult.mode === 'windows-sandbox' ? 'WSB配置:' : 'VMware脚本:'}
                      </span>
                      <span className="text-cyber-purple font-mono text-xs break-all">{playbackResult.configPath}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="text-cyber-muted w-20">状态:</span>
                    <span className="text-cyber-text text-xs">{playbackResult.message}</span>
                  </div>
                </div>

                {playbackResult.success && playbackResult.outputPath && (
                  <button
                    onClick={handleOpenOutputDir}
                    className="mt-3 w-full py-2 bg-cyber-border/50 text-cyber-text rounded-lg hover:bg-cyber-border transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FolderOpen className="w-4 h-4" />
                    打开输出目录
                  </button>
                )}
              </div>
            )}

            {!playbackResult && !generating && (
              <div className="flex-1 bg-cyber-bg/50 rounded-lg border border-cyber-border p-4 flex flex-col items-center justify-center text-cyber-muted">
                <Shield className="w-12 h-12 mb-3 opacity-30" />
                <div className="text-sm mb-1">安全沙箱回放</div>
                <div className="text-xs text-center max-w-xs">
                  回放脚本将在隔离环境中执行，不会影响本机系统。
                  选择 Windows Sandbox 或 VMware 模式后点击生成。
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'vt-scan' && (
        <div className="flex-1 flex flex-col glass-panel rounded-xl overflow-hidden">
          <div className="p-6 border-b border-cyber-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-cyber-text flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyber-purple" />
                VirusTotal 扫描报告
              </h2>
              <button
                onClick={handleVTScan}
                disabled={vtScanning}
                className="flex items-center gap-2 px-4 py-2 bg-cyber-purple text-white rounded-lg hover:bg-cyber-purple/80 transition-colors disabled:opacity-50"
              >
                {vtScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {vtScanning ? '扫描中...' : '重新扫描'}
              </button>
            </div>
          </div>

          {vtScanning ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-cyber-purple/30 border-t-cyber-purple animate-spin mb-4" />
              <div className="text-cyber-text text-lg mb-2">正在扫描...</div>
              <div className="text-cyber-muted text-sm mb-4">上传文件并分析中</div>
              <div className="w-64 h-2 bg-cyber-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan transition-all"
                  style={{ width: `${vtProgress}%` }}
                />
              </div>
              <div className="text-cyber-purple text-sm mt-2">{vtProgress}%</div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1 glass-panel rounded-xl p-6 text-center">
                  <div className="relative inline-block mb-4">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                      mockVTScan.detectionRate > 30 ? 'bg-cyber-red/20' : mockVTScan.detectionRate > 10 ? 'bg-cyber-yellow/20' : 'bg-cyber-green/20'
                    }`}>
                      <div className={`text-4xl font-bold ${
                        mockVTScan.detectionRate > 30 ? 'text-cyber-red' : mockVTScan.detectionRate > 10 ? 'text-cyber-yellow' : 'text-cyber-green'
                      }`}>
                        {mockVTScan.detectionRate}%
                      </div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyber-surface rounded-full text-sm">
                      <span className="text-cyber-red font-bold">{mockVTScan.positives}</span>
                      <span className="text-cyber-muted"> / {mockVTScan.total}</span>
                    </div>
                  </div>
                  <div className="text-cyber-text font-semibold mb-1">检测率</div>
                  <div className="text-cyber-muted text-sm">
                    {mockVTScan.positives} 个引擎检测为恶意
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 text-cyber-muted text-xs">
                    <Clock className="w-3 h-3" />
                    扫描时间: {new Date(mockVTScan.scanDate).toLocaleString('zh-CN')}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="glass-panel rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-cyber-text font-medium">扫描分布</span>
                    </div>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '8px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyber-red" />
                        <span className="text-cyber-muted">已检测 ({mockVTScan.positives})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyber-border" />
                        <span className="text-cyber-muted">未检测 ({mockVTScan.total - mockVTScan.positives})</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-cyber-muted text-sm">扫描ID</div>
                        <div className="text-cyber-text font-mono">{mockVTScan.scanId}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyVTLink}
                          className="p-2 hover:bg-cyber-border/50 rounded-lg transition-colors text-cyber-muted hover:text-cyber-text"
                        >
                          {copied ? <Check className="w-4 h-4 text-cyber-green" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <a
                          href={mockVTScan.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-cyber-border/50 rounded-lg transition-colors text-cyber-purple"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-xl p-6">
                <h3 className="text-cyber-text font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyber-purple" />
                  引擎检测详情
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(mockVTScan.scans).map(([engine, result]) => (
                    <div
                      key={engine}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        result.detected
                          ? 'bg-cyber-red/10 border-cyber-red/30'
                          : 'bg-cyber-green/10 border-cyber-green/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {result.detected ? (
                          <XCircle className="w-5 h-5 text-cyber-red" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-cyber-green" />
                        )}
                        <span className="text-cyber-text font-medium">{engine}</span>
                      </div>
                      <span className={`text-sm font-mono ${
                        result.detected ? 'text-cyber-red' : 'text-cyber-green'
                      }`}>
                        {result.detected ? result.result : 'Clean'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'detection' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-lg font-semibold text-cyber-text mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyber-green" />
              各类别检测率
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={detectionRateData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, '检测率']}
                  />
                  <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                    {detectionRateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-semibold text-cyber-text mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyber-purple" />
                总体检测性能
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-cyber-bg/50 rounded-lg p-4 text-center border border-cyber-green/30">
                  <div className="text-3xl font-bold text-cyber-green mb-1">98.1%</div>
                  <div className="text-cyber-muted text-sm">总体准确率</div>
                </div>
                <div className="bg-cyber-bg/50 rounded-lg p-4 text-center border border-cyber-cyan/30">
                  <div className="text-3xl font-bold text-cyber-cyan mb-1">2.3ms</div>
                  <div className="text-cyber-muted text-sm">平均响应时间</div>
                </div>
                <div className="bg-cyber-bg/50 rounded-lg p-4 text-center border border-cyber-purple/30">
                  <div className="text-3xl font-bold text-cyber-purple mb-1">1,247</div>
                  <div className="text-cyber-muted text-sm">已阻止攻击</div>
                </div>
                <div className="bg-cyber-bg/50 rounded-lg p-4 text-center border border-cyber-yellow/30">
                  <div className="text-3xl font-bold text-cyber-yellow mb-1">0.8%</div>
                  <div className="text-cyber-muted text-sm">误报率</div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-semibold text-cyber-text mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-cyber-yellow" />
                检测统计摘要
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-cyber-muted">键盘输入检测</span>
                    <span className="text-cyber-green">94.5%</span>
                  </div>
                  <div className="h-2 bg-cyber-border rounded-full overflow-hidden">
                    <div className="h-full w-[94.5%] bg-cyber-green rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-cyber-muted">快捷键序列检测</span>
                    <span className="text-cyber-cyan">87.2%</span>
                  </div>
                  <div className="h-2 bg-cyber-border rounded-full overflow-hidden">
                    <div className="h-full w-[87.2%] bg-cyber-cyan rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-cyber-muted">鼠标行为分析</span>
                    <span className="text-cyber-purple">72.8%</span>
                  </div>
                  <div className="h-2 bg-cyber-border rounded-full overflow-hidden">
                    <div className="h-full w-[72.8%] bg-cyber-purple rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-cyber-muted">Rubber Ducky 特征</span>
                    <span className="text-cyber-pink">98.1%</span>
                  </div>
                  <div className="h-2 bg-cyber-border rounded-full overflow-hidden">
                    <div className="h-full w-[98.1%] bg-cyber-pink rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-6">
              <h3 className="text-cyber-text font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyber-purple" />
                检测报告
              </h3>
              <div className="flex gap-3">
                <button className="flex-1 py-2.5 bg-cyber-purple/20 text-cyber-purple rounded-lg hover:bg-cyber-purple/30 transition-colors flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  导出 PDF
                </button>
                <button className="flex-1 py-2.5 bg-cyber-cyan/20 text-cyber-cyan rounded-lg hover:bg-cyber-cyan/30 transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  生成报告
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
