import { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Activity,
  AlertTriangle,
  Usb,
  Clock,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Zap,
  Radio,
  ListTree,
  ChevronRight,
  Search,
  Filter,
  Play,
  Pause,
  Trash2,
  Download,
} from 'lucide-react';
import type { HIDDevice, HIDInputEvent, DetectionAlert, Severity } from '@shared/types';

const mockDevices: HIDDevice[] = [
  {
    id: 1,
    vendorId: 0x046d,
    productId: 0xc31c,
    manufacturer: 'Logitech',
    productName: 'G Pro X Keyboard',
    serialNumber: 'LOG123456789',
    devicePath: '/dev/hidraw0',
    firstSeen: new Date(Date.now() - 86400000 * 3),
    lastSeen: new Date(),
    isBlocked: false,
    trustScore: 92,
  },
  {
    id: 2,
    vendorId: 0x1532,
    productId: 0x0067,
    manufacturer: 'Razer',
    productName: 'Basilisk V3 Mouse',
    serialNumber: 'RAZ987654321',
    devicePath: '/dev/hidraw1',
    firstSeen: new Date(Date.now() - 86400000 * 7),
    lastSeen: new Date(),
    isBlocked: false,
    trustScore: 88,
  },
  {
    id: 3,
    vendorId: 0x1234,
    productId: 0x5678,
    manufacturer: 'Unknown',
    productName: 'USB Input Device',
    serialNumber: '???',
    devicePath: '/dev/hidraw2',
    firstSeen: new Date(Date.now() - 60000),
    lastSeen: new Date(),
    isBlocked: true,
    trustScore: 15,
  },
  {
    id: 4,
    vendorId: 0x093a,
    productId: 0x2510,
    manufacturer: 'PixArt',
    productName: 'Optical Mouse',
    serialNumber: 'PIX00012345',
    devicePath: '/dev/hidraw3',
    firstSeen: new Date(Date.now() - 3600000 * 2),
    lastSeen: new Date(),
    isBlocked: false,
    trustScore: 45,
  },
];

const mockEvents: HIDInputEvent[] = [
  {
    id: '1',
    timestamp: new Date(),
    devicePath: '/dev/hidraw0',
    type: 'keyboard',
    keyCode: 42,
    keyName: 'Shift',
    isModifier: true,
    rawData: [0, 42, 0, 0, 0, 0, 0, 0],
    processingTimeMs: 0.5,
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 100),
    devicePath: '/dev/hidraw0',
    type: 'keyboard',
    keyCode: 28,
    keyName: 'L',
    rawData: [0, 0, 28, 0, 0, 0, 0, 0],
    processingTimeMs: 0.3,
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 200),
    devicePath: '/dev/hidraw1',
    type: 'mouse',
    mouseX: 15,
    mouseY: -8,
    rawData: [1, 15, 248, 0, 0, 0, 0, 0],
    processingTimeMs: 0.2,
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 300),
    devicePath: '/dev/hidraw2',
    type: 'keyboard',
    keyCode: 29,
    keyName: 'Ctrl',
    isModifier: true,
    modifiers: ['LEFT_CTRL'],
    rawData: [0, 29, 0, 0, 0, 0, 0, 0],
    processingTimeMs: 0.4,
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 400),
    devicePath: '/dev/hidraw2',
    type: 'keyboard',
    keyCode: 47,
    keyName: 'V',
    rawData: [0, 0, 47, 0, 0, 0, 0, 0],
    processingTimeMs: 0.3,
  },
];

const mockAlerts: DetectionAlert[] = [
  {
    id: 'alert-1',
    timestamp: new Date(),
    device: mockDevices[2],
    severity: 'critical',
    reason: '检测到可疑设备 - 输入速率异常 (1500按键/秒)',
    matchedSignatures: ['rubber_ducky_detect', 'suspicious_timing'],
    inputSequence: [],
    riskScore: 95,
  },
  {
    id: 'alert-2',
    timestamp: new Date(Date.now() - 30000),
    device: mockDevices[3],
    severity: 'high',
    reason: '检测到快捷键序列: Ctrl+C, Ctrl+V 快速重复',
    matchedSignatures: ['clipboard_suspicious'],
    inputSequence: [],
    riskScore: 72,
  },
  {
    id: 'alert-3',
    timestamp: new Date(Date.now() - 60000),
    device: mockDevices[0],
    severity: 'medium',
    reason: '鼠标移动模式异常 - 完美直线',
    matchedSignatures: ['mouse_movement_anomaly'],
    inputSequence: [],
    riskScore: 45,
  },
  {
    id: 'alert-4',
    timestamp: new Date(Date.now() - 300000),
    device: mockDevices[1],
    severity: 'low',
    reason: '新设备首次连接',
    matchedSignatures: ['new_device'],
    inputSequence: [],
    riskScore: 20,
  },
];

const eventTypes = [
  { type: 'all', label: '全部事件' },
  { type: 'keyboard', label: '键盘事件' },
  { type: 'mouse', label: '鼠标事件' },
];

const severityFilters = [
  { value: 'all', label: '所有级别' },
  { value: 'critical', label: '严重' },
  { value: 'high', label: '高危' },
  { value: 'medium', label: '中危' },
  { value: 'low', label: '低危' },
];

function getSeverityColor(severity: Severity) {
  switch (severity) {
    case 'low':
      return 'text-cyber-green bg-cyber-green/20 border-cyber-green/30';
    case 'medium':
      return 'text-cyber-yellow bg-cyber-yellow/20 border-cyber-yellow/30';
    case 'high':
      return 'text-cyber-orange bg-cyber-orange/20 border-cyber-orange/30';
    case 'critical':
      return 'text-cyber-red bg-cyber-red/20 border-cyber-red/30 neon-glow-red';
  }
}

function getDeviceById(devicePath: string): HIDDevice | undefined {
  return mockDevices.find((d) => d.devicePath === devicePath);
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('zh-CN', { hour12: false });
}

export default function DetectionMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<HIDDevice | null>(null);
  const [events, setEvents] = useState<HIDInputEvent[]>(mockEvents);
  const [alerts] = useState<DetectionAlert[]>(mockAlerts);
  const [eventFilter, setEventFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<DetectionAlert | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const newEvent: HIDInputEvent = {
        id: `event-${Date.now()}`,
        timestamp: new Date(),
        devicePath: '/dev/hidraw0',
        type: Math.random() > 0.5 ? 'keyboard' : 'mouse',
        keyCode: Math.floor(Math.random() * 100),
        keyName: ['A', 'B', 'C', 'Shift', 'Ctrl', 'Enter'][Math.floor(Math.random() * 6)],
        isModifier: Math.random() > 0.8,
        mouseX: Math.floor(Math.random() * 20) - 10,
        mouseY: Math.floor(Math.random() * 20) - 10,
        rawData: [Math.floor(Math.random() * 255), 0, 0, 0, 0, 0, 0, 0],
        processingTimeMs: Math.random() * 0.5,
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 100));
    }, 1500);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const filteredEvents = events.filter((e) => {
    if (eventFilter !== 'all' && e.type !== eventFilter) return false;
    if (selectedDevice && e.devicePath !== selectedDevice.devicePath) return false;
    return true;
  });

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        a.reason.toLowerCase().includes(query) ||
        a.device.productName.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleBlockDevice = (device: HIDDevice) => {
    console.log('Blocking device:', device.devicePath);
  };

  const getAnomalyScore = (device: HIDDevice): number => {
    return 100 - (device.trustScore || 50);
  };

  const getAnomalyColor = (score: number) => {
    if (score >= 70) return 'text-cyber-red';
    if (score >= 40) return 'text-cyber-yellow';
    return 'text-cyber-green';
  };

  const getAnomalyBg = (score: number) => {
    if (score >= 70) return 'bg-cyber-red';
    if (score >= 40) return 'bg-cyber-yellow';
    return 'bg-cyber-green';
  };

  return (
    <div className="h-full flex flex-col cyber-grid">
      <div className="px-6 py-4 border-b border-cyber-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-cyber-red/20">
              <Shield className="text-cyber-red" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-cyber-text neon-text-red">
                检测监控
              </h1>
              <p className="text-cyber-muted text-sm">实时监控 HID 设备输入并检测异常行为</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-surface border border-cyber-border">
              <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-cyber-green animate-pulse' : 'bg-cyber-muted'}`} />
              <span className="text-sm text-cyber-muted">
                {isMonitoring ? '监控中' : '已暂停'}
              </span>
            </div>
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors btn-cyber ${
                isMonitoring
                  ? 'bg-cyber-red/20 text-cyber-red border border-cyber-red/30 hover:bg-cyber-red/30'
                  : 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30 hover:bg-cyber-green/30'
              }`}
            >
              {isMonitoring ? <Pause size={16} /> : <Play size={16} />}
              {isMonitoring ? '暂停监控' : '开始监控'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-text hover:border-cyber-cyan/50 transition-colors btn-cyber">
              <Download size={16} />
              导出日志
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r border-cyber-border bg-cyber-bg/30 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-cyber-border">
            <h3 className="text-sm font-semibold text-cyber-text mb-3 flex items-center gap-2">
              <Usb className="text-cyber-cyan" size={16} />
              连接的设备
              <span className="ml-auto text-xs text-cyber-muted">{mockDevices.length}</span>
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {mockDevices.map((device) => (
              <button
                key={device.id}
                onClick={() => setSelectedDevice(device)}
                className={`w-full p-3 rounded-lg border transition-all text-left ${
                  selectedDevice?.devicePath === device.devicePath
                    ? 'bg-cyber-purple/20 border-cyber-purple/50'
                    : 'bg-cyber-surface/30 border-cyber-border hover:border-cyber-muted'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          device.isBlocked ? 'bg-cyber-red' : 'bg-cyber-green animate-pulse'
                        }`}
                      />
                      <p className="text-sm font-medium text-cyber-text truncate">
                        {device.productName}
                      </p>
                    </div>
                    <p className="text-xs text-cyber-muted mt-1 truncate">
                      {device.manufacturer}
                    </p>
                  </div>
                  {device.isBlocked && (
                    <span className="text-xs bg-cyber-red/20 text-cyber-red px-2 py-0.5 rounded">
                      已阻止
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-cyber-muted">
                    <Activity size={12} />
                    异常评分
                  </div>
                  <span className={`font-bold ${getAnomalyColor(getAnomalyScore(device))}`}>
                    {getAnomalyScore(device)}
                  </span>
                </div>
                <div className="mt-1 h-1 bg-cyber-border rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getAnomalyBg(getAnomalyScore(device))}`}
                    style={{ width: `${getAnomalyScore(device)}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-1/2 border-b border-cyber-border flex flex-col overflow-hidden">
            <div className="px-4 py-2 bg-cyber-surface/10 border-b border-cyber-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Radio className="text-cyber-cyan" size={14} />
                  <span className="text-sm text-cyber-text font-medium">实时事件流</span>
                  <span className="text-xs text-cyber-muted">({filteredEvents.length})</span>
                </div>
                <div className="flex gap-1">
                  {eventTypes.map((t) => (
                    <button
                      key={t.type}
                      onClick={() => setEventFilter(t.type)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        eventFilter === t.type
                          ? 'bg-cyber-purple text-white'
                          : 'bg-cyber-surface text-cyber-muted hover:text-cyber-text'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedDevice && (
                  <span className="text-xs text-cyber-purple bg-cyber-purple/10 px-2 py-0.5 rounded">
                    {selectedDevice.productName}
                  </span>
                )}
                <button
                  onClick={() => setEvents([])}
                  className="text-xs text-cyber-muted hover:text-cyber-red flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  清空
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto font-mono text-xs">
              {filteredEvents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-cyber-muted">
                  <ListTree className="mb-2 opacity-50" size={32} />
                  <p className="text-sm">暂无事件数据</p>
                </div>
              ) : (
                <div className="p-2 space-y-0.5">
                  {filteredEvents.map((event) => {
                    const device = getDeviceById(event.devicePath);
                    return (
                      <div
                        key={event.id}
                        className={`flex items-center gap-3 py-1 px-2 rounded hover:bg-cyber-surface/30 ${
                          event.type === 'keyboard' ? 'border-l-2 border-cyber-purple' : 'border-l-2 border-cyber-cyan'
                        }`}
                      >
                        <span className="text-cyber-muted/50 w-20 shrink-0">
                          {formatTime(event.timestamp)}
                        </span>
                        <span
                          className={`w-16 shrink-0 px-1 py-0.5 rounded text-center ${
                            event.type === 'keyboard'
                              ? 'bg-cyber-purple/20 text-cyber-purple'
                              : 'bg-cyber-cyan/20 text-cyber-cyan'
                          }`}
                        >
                          {event.type.toUpperCase()}
                        </span>
                        <span className="text-cyber-text font-medium w-12 shrink-0">
                          {event.keyName || `${event.mouseX},${event.mouseY}`}
                        </span>
                        <span className="text-cyber-muted truncate flex-1">
                          {device?.productName}
                        </span>
                        <span className="text-cyber-muted/50 text-right w-16 shrink-0">
                          {event.processingTimeMs?.toFixed(2)}ms
                        </span>
                      </div>
                    );
                  })}
                  <div ref={eventsEndRef} />
                </div>
              )}
            </div>
          </div>

          <div className="h-1/2 flex flex-col overflow-hidden">
            <div className="px-4 py-2 bg-cyber-surface/10 border-b border-cyber-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-cyber-red" size={14} />
                  <span className="text-sm text-cyber-text font-medium">检测告警</span>
                  <span className="text-xs text-cyber-muted">({filteredAlerts.length})</span>
                </div>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-cyber-surface border border-cyber-border text-cyber-muted text-xs px-2 py-1 rounded"
                >
                  {severityFilters.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-cyber-muted" size={12} />
                <input
                  type="text"
                  placeholder="搜索告警..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1 bg-cyber-surface border border-cyber-border text-cyber-text text-xs rounded terminal-input w-48"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {filteredAlerts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-cyber-muted">
                  <CheckCircle className="mb-2 text-cyber-green opacity-50" size={32} />
                  <p className="text-sm">暂无告警</p>
                </div>
              ) : (
                <div className="divide-y divide-cyber-border/50">
                  {filteredAlerts.map((alert) => (
                    <button
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className={`w-full p-3 text-left hover:bg-cyber-surface/30 transition-colors ${
                        selectedAlert?.id === alert.id ? 'bg-cyber-surface/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-3 h-3 rounded-full ${
                            alert.severity === 'critical'
                              ? 'bg-cyber-red animate-pulse'
                              : alert.severity === 'high'
                              ? 'bg-cyber-orange'
                              : alert.severity === 'medium'
                              ? 'bg-cyber-yellow'
                              : 'bg-cyber-green'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(
                                alert.severity
                              )}`}
                            >
                              {alert.severity.toUpperCase()}
                            </span>
                            <span className="text-xs text-cyber-muted flex items-center gap-1">
                              <Clock size={10} />
                              {formatTime(alert.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-cyber-text line-clamp-1">{alert.reason}</p>
                          <p className="text-xs text-cyber-muted mt-1">
                            {alert.device.productName} · 风险分 {alert.riskScore}
                          </p>
                        </div>
                        <ChevronRight className="text-cyber-muted" size={16} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-72 border-l border-cyber-border bg-cyber-bg/30 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-cyber-border">
            <h3 className="text-sm font-semibold text-cyber-text mb-2 flex items-center gap-2">
              <Zap className="text-cyber-yellow" size={16} />
              异常评分详情
            </h3>
            <p className="text-xs text-cyber-muted">
              {selectedDevice ? selectedDevice.productName : '选择设备查看详情'}
            </p>
          </div>

          {selectedDevice && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-cyber-muted">综合异常评分</span>
                  <span className={`text-3xl font-bold ${getAnomalyColor(getAnomalyScore(selectedDevice))}`}>
                    {getAnomalyScore(selectedDevice)}
                  </span>
                </div>
                <div className="h-3 bg-cyber-border rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getAnomalyBg(getAnomalyScore(selectedDevice))} transition-all duration-500`}
                    style={{ width: `${getAnomalyScore(selectedDevice)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-cyber-muted mt-1">
                  <span>安全</span>
                  <span>危险</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-cyber-surface/30 border border-cyber-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-cyber-muted">输入速率</span>
                    <span className="text-sm font-medium text-cyber-cyan">正常</span>
                  </div>
                  <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
                    <div className="h-full bg-cyber-cyan w-1/3" />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-cyber-surface/30 border border-cyber-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-cyber-muted">快捷键密度</span>
                    <span className="text-sm font-medium text-cyber-yellow">偏高</span>
                  </div>
                  <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
                    <div className="h-full bg-cyber-yellow w-1/2" />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-cyber-surface/30 border border-cyber-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-cyber-muted">设备信任度</span>
                    <span className="text-sm font-medium text-cyber-green">已知设备</span>
                  </div>
                  <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
                    <div className="h-full bg-cyber-green w-4/5" />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-cyber-surface/30 border border-cyber-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-cyber-muted">行为模式</span>
                    <span className="text-sm font-medium text-cyber-purple">可疑</span>
                  </div>
                  <div className="h-1.5 bg-cyber-border rounded-full overflow-hidden">
                    <div className="h-full bg-cyber-purple w-2/3" />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-cyber-surface/30 border border-cyber-border">
                <h4 className="text-xs font-medium text-cyber-text mb-2">设备信息</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-cyber-muted">厂商</span>
                    <span className="text-cyber-text">{selectedDevice.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-muted">产品</span>
                    <span className="text-cyber-text">{selectedDevice.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-muted">VID:PID</span>
                    <span className="text-cyber-text font-mono">
                      {selectedDevice.vendorId.toString(16).padStart(4, '0')}:
                      {selectedDevice.productId.toString(16).padStart(4, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-muted">首次出现</span>
                    <span className="text-cyber-text">
                      {new Date(selectedDevice.firstSeen).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleBlockDevice(selectedDevice)}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedDevice.isBlocked
                      ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30'
                      : 'bg-cyber-red/20 text-cyber-red border border-cyber-red/30'
                  }`}
                >
                  {selectedDevice.isBlocked ? (
                    <>
                      <CheckCircle size={14} />
                      已阻止
                    </>
                  ) : (
                    <>
                      <Ban size={14} />
                      阻止设备
                    </>
                  )}
                </button>
                <button className="px-3 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-cyber-text transition-colors">
                  <Eye size={16} />
                </button>
              </div>
            </div>
          )}

          {!selectedDevice && (
            <div className="flex-1 flex flex-col items-center justify-center text-cyber-muted p-4">
              <Usb className="mb-3 opacity-30" size={48} />
              <p className="text-sm text-center">从左侧列表选择设备</p>
              <p className="text-xs text-center mt-1">查看异常评分和设备详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
