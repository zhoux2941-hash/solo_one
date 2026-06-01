import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Download,
  Trash2,
  RotateCcw,
  Terminal,
  Settings,
  HardDrive,
  Cpu,
  Clock,
  FileText,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import type { WindowsServiceStatus } from '@shared/types';

interface LogEntry {
  id: number;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

const initialLogs: LogEntry[] = [
  { id: 1, timestamp: new Date(Date.now() - 60000), level: 'info', message: '[SYSTEM] 服务管理器初始化完成' },
  { id: 2, timestamp: new Date(Date.now() - 55000), level: 'success', message: '[SERVICE] HID检测服务已启动' },
  { id: 3, timestamp: new Date(Date.now() - 50000), level: 'info', message: '[DETECT] 设备监控线程已启动' },
  { id: 4, timestamp: new Date(Date.now() - 45000), level: 'info', message: '[DB] 数据库连接成功' },
  { id: 5, timestamp: new Date(Date.now() - 40000), level: 'success', message: '[SIG] 签名规则加载完成: 47条规则' },
  { id: 6, timestamp: new Date(Date.now() - 35000), level: 'warn', message: '[WARN] 设备 /dev/hidraw2 信任度较低 (32%)' },
  { id: 7, timestamp: new Date(Date.now() - 30000), level: 'info', message: '[DETECT] 正在监控 3 个 HID 设备' },
  { id: 8, timestamp: new Date(Date.now() - 25000), level: 'error', message: '[ERROR] 签名更新检查失败: 网络超时' },
  { id: 9, timestamp: new Date(Date.now() - 20000), level: 'info', message: '[SYSTEM] 内存使用: 128MB / 512MB' },
  { id: 10, timestamp: new Date(Date.now() - 15000), level: 'success', message: '[DETECT] 检测到新设备接入: Logitech G Pro X' },
  { id: 11, timestamp: new Date(Date.now() - 10000), level: 'info', message: '[SYSTEM] CPU使用率: 2.3%' },
  { id: 12, timestamp: new Date(Date.now() - 5000), level: 'info', message: '[SYSTEM] 服务运行正常' },
];

export default function ServiceControl() {
  const [serviceStatus, setServiceStatus] = useState<WindowsServiceStatus>({
    installed: true,
    running: true,
    autoStart: true,
    processId: 12456,
    lastStart: new Date(Date.now() - 3600000 * 2),
    logPath: 'C:\\ProgramData\\HIDGuard\\logs\\service.log',
  });
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'config'>('status');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState({
    serviceName: 'HIDGuard Service',
    serviceDescription: 'HID设备安全监控与防护服务',
    autoStart: true,
    runAsSystem: true,
    enableRecovery: true,
    recoveryDelay: 60,
    maxRestarts: 3,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Date.now(),
        timestamp: new Date(),
        level: 'info',
        message: `[HEARTBEAT] 服务心跳 - ${new Date().toLocaleTimeString()}`,
      };
      if (serviceStatus.running) {
        setLogs((prev) => [...prev.slice(-100), newLog]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [serviceStatus.running]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleServiceAction = async (action: 'start' | 'stop' | 'restart') => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const now = new Date();
    let newLog: LogEntry;

    switch (action) {
      case 'start':
        setServiceStatus((prev) => ({ ...prev, running: true, lastStart: now, processId: Math.floor(Math.random() * 50000) + 10000 }));
        newLog = { id: Date.now(), timestamp: now, level: 'success', message: '[SERVICE] 服务启动成功' };
        break;
      case 'stop':
        setServiceStatus((prev) => ({ ...prev, running: false, processId: undefined }));
        newLog = { id: Date.now(), timestamp: now, level: 'info', message: '[SERVICE] 服务已停止' };
        break;
      case 'restart':
        setServiceStatus((prev) => ({ ...prev, running: false }));
        setTimeout(() => {
          setServiceStatus((prev) => ({ ...prev, running: true, lastStart: new Date(), processId: Math.floor(Math.random() * 50000) + 10000 }));
        }, 1000);
        newLog = { id: Date.now(), timestamp: now, level: 'info', message: '[SERVICE] 服务正在重启...' };
        break;
    }

    setLogs((prev) => [...prev, newLog!]);
    setIsLoading(false);
  };

  const handleInstallUninstall = async (install: boolean) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const now = new Date();
    if (install) {
      setServiceStatus((prev) => ({ ...prev, installed: true, running: true, lastStart: now }));
      setLogs((prev) => [...prev, { id: Date.now(), timestamp: now, level: 'success', message: '[SERVICE] 服务安装成功并已启动' }]);
    } else {
      setServiceStatus((prev) => ({ ...prev, installed: false, running: false, processId: undefined }));
      setLogs((prev) => [...prev, { id: Date.now(), timestamp: now, level: 'info', message: '[SERVICE] 服务已卸载' }]);
    }
    setIsLoading(false);
  };

  const copyLogs = () => {
    const logText = logs.map((l) => `[${l.timestamp.toLocaleString()}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-cyber-blue';
      case 'warn': return 'text-cyber-yellow';
      case 'error': return 'text-cyber-red';
      case 'success': return 'text-cyber-green';
      default: return 'text-cyber-muted';
    }
  };

  const formatUptime = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}小时 ${minutes}分钟`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cyber-text neon-text-purple mb-2">服务控制</h1>
        <p className="text-cyber-muted text-sm">管理 HID 安全检测服务的运行状态</p>
      </div>

      <div className="glass-panel rounded-xl p-1 mb-6 inline-flex">
        {[
          { id: 'status', label: '服务状态', icon: Cpu },
          { id: 'logs', label: '运行日志', icon: Terminal },
          { id: 'config', label: '服务配置', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'status' | 'logs' | 'config')}
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

      {activeTab === 'status' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel rounded-xl p-6 data-flow-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-cyber-text flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-cyber-purple" />
                服务状态卡片
              </h2>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                serviceStatus.running ? 'bg-cyber-green/20' : 'bg-cyber-muted/20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  serviceStatus.running ? 'bg-cyber-green animate-pulse' : 'bg-cyber-muted'
                }`} />
                <span className={`text-sm font-medium ${
                  serviceStatus.running ? 'text-cyber-green' : 'text-cyber-muted'
                }`}>
                  {serviceStatus.running ? '运行中' : '已停止'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-cyber-bg/50 rounded-lg p-4 border border-cyber-border">
                  <div className="text-cyber-muted text-sm mb-1">服务名称</div>
                  <div className="text-cyber-text font-mono">HIDGuardSvc</div>
                </div>
                <div className="bg-cyber-bg/50 rounded-lg p-4 border border-cyber-border">
                  <div className="text-cyber-muted text-sm mb-1">进程ID</div>
                  <div className="text-cyber-cyan font-mono">
                    {serviceStatus.processId || 'N/A'}
                  </div>
                </div>
                <div className="bg-cyber-bg/50 rounded-lg p-4 border border-cyber-border">
                  <div className="text-cyber-muted text-sm mb-1">运行时间</div>
                  <div className="text-cyber-green font-mono flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatUptime(serviceStatus.lastStart)}
                  </div>
                </div>
                <div className="bg-cyber-bg/50 rounded-lg p-4 border border-cyber-border">
                  <div className="text-cyber-muted text-sm mb-1">安装状态</div>
                  <div className={`font-mono flex items-center gap-2 ${
                    serviceStatus.installed ? 'text-cyber-green' : 'text-cyber-red'
                  }`}>
                    {serviceStatus.installed ? (
                      <><Check className="w-4 h-4" /> 已安装</>
                    ) : (
                      <><AlertCircle className="w-4 h-4" /> 未安装</>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-cyber-bg/50 rounded-lg p-4 border border-cyber-border">
                <div className="text-cyber-muted text-sm mb-2">服务性能</div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-cyber-muted">CPU 使用率</span>
                      <span className="text-cyber-text">2.3%</span>
                    </div>
                    <div className="h-2 bg-cyber-border rounded-full overflow-hidden">
                      <div className="h-full w-[2.3%] bg-cyber-green rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-cyber-muted">内存使用</span>
                      <span className="text-cyber-text">128 MB / 512 MB</span>
                    </div>
                    <div className="h-2 bg-cyber-border rounded-full overflow-hidden">
                      <div className="h-full w-[25%] bg-cyber-purple rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-cyber-muted">监控设备</span>
                      <span className="text-cyber-text">3 个设备</span>
                    </div>
                    <div className="h-2 bg-cyber-border rounded-full overflow-hidden">
                      <div className="h-full w-[60%] bg-cyber-cyan rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-semibold text-cyber-text mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-cyber-purple" />
                服务控制
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {serviceStatus.installed ? (
                  <>
                    <button
                      onClick={() => handleServiceAction('start')}
                      disabled={serviceStatus.running || isLoading}
                      className="flex items-center justify-center gap-2 py-3 bg-cyber-green/20 text-cyber-green rounded-lg hover:bg-cyber-green/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-cyber"
                    >
                      <Play className="w-4 h-4" />
                      启动服务
                    </button>
                    <button
                      onClick={() => handleServiceAction('stop')}
                      disabled={!serviceStatus.running || isLoading}
                      className="flex items-center justify-center gap-2 py-3 bg-cyber-red/20 text-cyber-red rounded-lg hover:bg-cyber-red/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-cyber"
                    >
                      <Square className="w-4 h-4" />
                      停止服务
                    </button>
                    <button
                      onClick={() => handleServiceAction('restart')}
                      disabled={!serviceStatus.running || isLoading}
                      className="flex items-center justify-center gap-2 py-3 bg-cyber-yellow/20 text-cyber-yellow rounded-lg hover:bg-cyber-yellow/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-cyber col-span-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      重启服务
                    </button>
                    <button
                      onClick={() => handleInstallUninstall(false)}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 py-3 bg-cyber-border/50 text-cyber-muted rounded-lg hover:bg-cyber-border hover:text-cyber-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-cyber col-span-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      卸载服务
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleInstallUninstall(true)}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 py-3 bg-cyber-purple text-white rounded-lg hover:bg-cyber-purple/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-cyber col-span-2"
                  >
                    <Download className="w-4 h-4" />
                    安装服务
                  </button>
                )}
              </div>

              {isLoading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-cyber-purple">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">正在执行操作...</span>
                </div>
              )}
            </div>

            <div className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-semibold text-cyber-text mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyber-purple" />
                快速信息
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 bg-cyber-bg/50 rounded-lg">
                  <div className="w-8 h-8 rounded bg-cyber-purple/20 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-cyber-purple" />
                  </div>
                  <div>
                    <div className="text-cyber-muted text-xs">日志路径</div>
                    <div className="text-cyber-text font-mono text-xs">{serviceStatus.logPath}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-cyber-bg/50 rounded-lg">
                  <div className="w-8 h-8 rounded bg-cyber-green/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-cyber-green" />
                  </div>
                  <div>
                    <div className="text-cyber-muted text-xs">自动启动</div>
                    <div className="text-cyber-text">{serviceStatus.autoStart ? '已启用' : '已禁用'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-cyber-bg/50 rounded-lg">
                  <div className="w-8 h-8 rounded bg-cyber-cyan/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-cyber-cyan" />
                  </div>
                  <div>
                    <div className="text-cyber-muted text-xs">上次启动</div>
                    <div className="text-cyber-text text-xs">
                      {serviceStatus.lastStart ? new Date(serviceStatus.lastStart).toLocaleString('zh-CN') : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="flex-1 flex flex-col glass-panel rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-cyber-border">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-cyber-green" />
              <span className="text-cyber-text font-medium">运行日志终端</span>
              <span className="text-cyber-muted text-sm">({logs.length} 条记录)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  autoScroll
                    ? 'bg-cyber-green/20 text-cyber-green'
                    : 'bg-cyber-border/50 text-cyber-muted hover:bg-cyber-border'
                }`}
              >
                {autoScroll ? '自动滚动' : '暂停滚动'}
              </button>
              <button
                onClick={copyLogs}
                className="px-3 py-1.5 text-sm bg-cyber-border/50 text-cyber-muted rounded-lg hover:bg-cyber-border hover:text-cyber-text transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-4 h-4 text-cyber-green" /> : <Copy className="w-4 h-4" />}
                {copied ? '已复制' : '复制'}
              </button>
              <button
                onClick={() => setLogs([])}
                className="px-3 py-1.5 text-sm bg-cyber-red/20 text-cyber-red rounded-lg hover:bg-cyber-red/30 transition-colors"
              >
                清空
              </button>
            </div>
          </div>
          <div
            ref={logContainerRef}
            className="flex-1 overflow-auto p-4 bg-black/50 font-mono text-sm"
          >
            {logs.length === 0 ? (
              <div className="text-cyber-muted text-center py-8">
                暂无日志记录
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-3">
                    <span className="text-cyber-muted shrink-0">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className={getLogColor(log.level)}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-cyber-border">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="输入命令 (help 查看帮助)..."
                className="flex-1 px-4 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-green font-mono text-sm"
              />
              <button className="px-4 py-2 bg-cyber-green/20 text-cyber-green rounded-lg hover:bg-cyber-green/30 transition-colors">
                执行
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="flex-1 glass-panel rounded-xl p-6 overflow-auto">
          <h2 className="text-lg font-semibold text-cyber-text mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyber-purple" />
            服务配置
          </h2>

          <div className="max-w-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-cyber-muted text-sm mb-2">服务名称</label>
                <input
                  type="text"
                  value={config.serviceName}
                  onChange={(e) => setConfig({ ...config, serviceName: e.target.value })}
                  className="w-full px-4 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-purple transition-colors"
                />
              </div>
              <div>
                <label className="block text-cyber-muted text-sm mb-2">服务描述</label>
                <input
                  type="text"
                  value={config.serviceDescription}
                  onChange={(e) => setConfig({ ...config, serviceDescription: e.target.value })}
                  className="w-full px-4 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-purple transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-cyber-bg/50 rounded-lg border border-cyber-border">
                <div>
                  <div className="text-cyber-text font-medium">自动启动</div>
                  <div className="text-cyber-muted text-sm">系统启动时自动运行服务</div>
                </div>
                <button
                  onClick={() => setConfig({ ...config, autoStart: !config.autoStart })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    config.autoStart ? 'bg-cyber-green' : 'bg-cyber-border'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    config.autoStart ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-cyber-bg/50 rounded-lg border border-cyber-border">
                <div>
                  <div className="text-cyber-text font-medium">以系统权限运行</div>
                  <div className="text-cyber-muted text-sm">使用 SYSTEM 账户获取最高权限</div>
                </div>
                <button
                  onClick={() => setConfig({ ...config, runAsSystem: !config.runAsSystem })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    config.runAsSystem ? 'bg-cyber-green' : 'bg-cyber-border'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    config.runAsSystem ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-cyber-bg/50 rounded-lg border border-cyber-border">
                <div>
                  <div className="text-cyber-text font-medium">故障自动恢复</div>
                  <div className="text-cyber-muted text-sm">服务异常退出时自动重启</div>
                </div>
                <button
                  onClick={() => setConfig({ ...config, enableRecovery: !config.enableRecovery })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    config.enableRecovery ? 'bg-cyber-green' : 'bg-cyber-border'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    config.enableRecovery ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {config.enableRecovery && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-cyber-purple/10 rounded-lg border border-cyber-purple/30">
                <div>
                  <label className="block text-cyber-muted text-sm mb-2">恢复延迟 (秒)</label>
                  <input
                    type="number"
                    value={config.recoveryDelay}
                    onChange={(e) => setConfig({ ...config, recoveryDelay: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-purple transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-cyber-muted text-sm mb-2">最大重启次数</label>
                  <input
                    type="number"
                    value={config.maxRestarts}
                    onChange={(e) => setConfig({ ...config, maxRestarts: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-purple transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button className="flex-1 py-3 bg-cyber-purple text-white rounded-lg hover:bg-cyber-purple/80 transition-colors btn-cyber">
                保存配置
              </button>
              <button className="px-6 py-3 border border-cyber-border text-cyber-text rounded-lg hover:bg-cyber-border/30 transition-colors">
                重置默认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
