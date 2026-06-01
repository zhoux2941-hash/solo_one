import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Clock,
  Shield,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Usb,
  FileText,
  ExternalLink,
} from 'lucide-react';
import type { DetectionAlert, Severity, HIDDevice } from '@shared/types';

const mockAlerts: DetectionAlert[] = [
  {
    id: 'alert-001',
    timestamp: new Date(Date.now() - 300000),
    device: {
      vendorId: 0x046d,
      productId: 0xc31c,
      manufacturer: 'Logitech',
      productName: 'USB Keyboard',
      serialNumber: 'LOG-001-ABC',
      devicePath: '/dev/hidraw0',
      firstSeen: new Date(Date.now() - 86400000 * 5),
      trustScore: 45,
    },
    severity: 'high',
    reason: '检测到可疑的快捷键序列 - WIN+R快速执行',
    matchedSignatures: ['win_shortcut_suspicious', 'rapid_keystroke'],
    inputSequence: [],
    riskScore: 78,
    isReviewed: false,
  },
  {
    id: 'alert-002',
    timestamp: new Date(Date.now() - 1800000),
    device: {
      vendorId: 0x1532,
      productId: 0x0067,
      manufacturer: 'Razer',
      productName: 'Basilisk V3',
      serialNumber: 'RAZ-678-XYZ',
      devicePath: '/dev/hidraw1',
      firstSeen: new Date(Date.now() - 86400000 * 10),
      trustScore: 88,
    },
    severity: 'low',
    reason: '鼠标移动模式异常检测',
    matchedSignatures: ['mouse_movement_anomaly'],
    inputSequence: [],
    riskScore: 22,
    isReviewed: true,
  },
  {
    id: 'alert-003',
    timestamp: new Date(Date.now() - 3600000),
    device: {
      vendorId: 0x1234,
      productId: 0x5678,
      manufacturer: 'Unknown',
      productName: 'HID Device',
      serialNumber: '???',
      devicePath: '/dev/hidraw2',
      firstSeen: new Date(Date.now() - 120000),
      trustScore: 5,
    },
    severity: 'critical',
    reason: '未授权设备接入 - 检测到Rubber Ducky特征',
    matchedSignatures: ['rubber_ducky_detect', 'unknown_device', 'suspicious_vidpid'],
    inputSequence: [],
    riskScore: 95,
    isReviewed: false,
  },
  {
    id: 'alert-004',
    timestamp: new Date(Date.now() - 7200000),
    device: {
      vendorId: 0x093a,
      productId: 0x2510,
      manufacturer: 'PixArt',
      productName: 'Optical Mouse',
      serialNumber: 'PIX-000123',
      devicePath: '/dev/hidraw3',
      firstSeen: new Date(Date.now() - 86400000 * 2),
      trustScore: 52,
    },
    severity: 'medium',
    reason: '检测到异常点击频率',
    matchedSignatures: ['rapid_click_detection'],
    inputSequence: [],
    riskScore: 55,
    isReviewed: true,
  },
  {
    id: 'alert-005',
    timestamp: new Date(Date.now() - 86400000),
    device: {
      vendorId: 0x045e,
      productId: 0x07f5,
      manufacturer: 'Microsoft',
      productName: 'Sculpt Ergonomic',
      serialNumber: 'MSFT-SCULPT-001',
      devicePath: '/dev/hidraw4',
      firstSeen: new Date(Date.now() - 86400000 * 30),
      trustScore: 95,
    },
    severity: 'low',
    reason: '按键间隔方差低于阈值',
    matchedSignatures: ['typing_pattern_check'],
    inputSequence: [],
    riskScore: 15,
    isReviewed: false,
  },
];

const severityOptions: { value: Severity | 'all'; label: string; color: string }[] = [
  { value: 'all', label: '全部', color: 'text-cyber-muted' },
  { value: 'critical', label: '严重', color: 'text-cyber-red' },
  { value: 'high', label: '高危', color: 'text-cyber-orange' },
  { value: 'medium', label: '中危', color: 'text-cyber-yellow' },
  { value: 'low', label: '低危', color: 'text-cyber-green' },
];

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical':
      return 'bg-cyber-red text-white';
    case 'high':
      return 'bg-cyber-orange text-white';
    case 'medium':
      return 'bg-cyber-yellow text-black';
    case 'low':
      return 'bg-cyber-green text-black';
    default:
      return 'bg-cyber-muted text-white';
  }
}

function getSeverityBorder(severity: string) {
  switch (severity) {
    case 'critical':
      return 'border-cyber-red/50 hover:border-cyber-red';
    case 'high':
      return 'border-cyber-orange/50 hover:border-cyber-orange';
    case 'medium':
      return 'border-cyber-yellow/50 hover:border-cyber-yellow';
    case 'low':
      return 'border-cyber-green/50 hover:border-cyber-green';
    default:
      return 'border-cyber-border hover:border-cyber-purple';
  }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatTimeAgo(date: Date | string) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

export default function EventQuery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<DetectionAlert | null>(null);
  const [reviewedFilter, setReviewedFilter] = useState<'all' | 'reviewed' | 'unreviewed'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'risk'>('time');

  const filteredAlerts = useMemo(() => {
    return mockAlerts
      .filter((alert) => {
        const matchesSearch =
          alert.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.device.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.device.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;

        const matchesReviewed =
          reviewedFilter === 'all' ||
          (reviewedFilter === 'reviewed' && alert.isReviewed) ||
          (reviewedFilter === 'unreviewed' && !alert.isReviewed);

        return matchesSearch && matchesSeverity && matchesReviewed;
      })
      .sort((a, b) => {
        if (sortBy === 'risk') {
          return b.riskScore - a.riskScore;
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [searchQuery, selectedSeverity, reviewedFilter, sortBy]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cyber-text neon-text-purple mb-2">事件查询</h1>
        <p className="text-cyber-muted text-sm">浏览和分析检测到的安全事件</p>
      </div>

      <div className="glass-panel rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
              <input
                type="text"
                placeholder="搜索事件原因、设备名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-purple focus:ring-1 focus:ring-cyber-purple/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-text"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as Severity | 'all')}
              className="px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-purple cursor-pointer"
            >
              {severityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={reviewedFilter}
              onChange={(e) => setReviewedFilter(e.target.value as 'all' | 'reviewed' | 'unreviewed')}
              className="px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-purple cursor-pointer"
            >
              <option value="all">全部状态</option>
              <option value="unreviewed">未审核</option>
              <option value="reviewed">已审核</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'time' | 'risk')}
              className="px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-purple cursor-pointer"
            >
              <option value="time">按时间排序</option>
              <option value="risk">按风险排序</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                showFilters
                  ? 'bg-cyber-purple/20 border-cyber-purple text-cyber-purple'
                  : 'bg-cyber-bg border-cyber-border text-cyber-text hover:border-cyber-purple'
              }`}
            >
              <Filter className="w-4 h-4" />
              高级筛选
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-cyber-border grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-cyber-muted text-sm mb-2">开始日期</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-purple"
              />
            </div>
            <div>
              <label className="block text-cyber-muted text-sm mb-2">结束日期</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-purple"
              />
            </div>
            <div>
              <label className="block text-cyber-muted text-sm mb-2">设备路径</label>
              <input
                type="text"
                placeholder="/dev/hidrawX"
                className="w-full px-3 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-purple"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-cyber-muted text-sm">
          共找到 <span className="text-cyber-purple font-bold">{filteredAlerts.length}</span> 条记录
        </span>
        <div className="flex items-center gap-2">
          <span className="text-cyber-muted text-sm">批量操作:</span>
          <button className="px-3 py-1.5 text-sm bg-cyber-purple/20 text-cyber-purple rounded-lg hover:bg-cyber-purple/30 transition-colors">
            全部标记已读
          </button>
          <button className="px-3 py-1.5 text-sm bg-cyber-border/50 text-cyber-muted rounded-lg hover:bg-cyber-border transition-colors">
            导出CSV
          </button>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-cyber-surface/50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-cyber-muted text-xs font-medium uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-cyber-muted text-xs font-medium uppercase tracking-wider">时间</th>
                <th className="px-4 py-3 text-left text-cyber-muted text-xs font-medium uppercase tracking-wider">严重程度</th>
                <th className="px-4 py-3 text-left text-cyber-muted text-xs font-medium uppercase tracking-wider">设备</th>
                <th className="px-4 py-3 text-left text-cyber-muted text-xs font-medium uppercase tracking-wider">事件原因</th>
                <th className="px-4 py-3 text-left text-cyber-muted text-xs font-medium uppercase tracking-wider">风险分</th>
                <th className="px-4 py-3 text-left text-cyber-muted text-xs font-medium uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border">
              {filteredAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  className={`transition-colors hover:bg-cyber-purple/5 cursor-pointer ${
                    !alert.isReviewed ? 'bg-cyber-purple/5' : ''
                  }`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <td className="px-4 py-3">
                    {alert.isReviewed ? (
                      <CheckCircle className="w-5 h-5 text-cyber-green" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-cyber-yellow animate-pulse" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-cyber-text text-sm font-mono">{formatTimeAgo(alert.timestamp)}</div>
                    <div className="text-cyber-muted text-xs">{formatDate(alert.timestamp)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Usb className="w-4 h-4 text-cyber-cyan" />
                      <div>
                        <div className="text-cyber-text text-sm">{alert.device.productName}</div>
                        <div className="text-cyber-muted text-xs">{alert.device.manufacturer}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-cyber-text text-sm max-w-xs truncate">{alert.reason}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {alert.matchedSignatures.slice(0, 2).map((sig) => (
                        <span key={sig} className="px-1.5 py-0.5 bg-cyber-border/50 text-cyber-muted text-xs rounded">
                          {sig}
                        </span>
                      ))}
                      {alert.matchedSignatures.length > 2 && (
                        <span className="text-cyber-muted text-xs">+{alert.matchedSignatures.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-lg font-bold ${
                          alert.riskScore >= 80
                            ? 'text-cyber-red'
                            : alert.riskScore >= 50
                            ? 'text-cyber-yellow'
                            : 'text-cyber-green'
                        }`}
                      >
                        {alert.riskScore}
                      </div>
                      <div className="w-16 h-2 bg-cyber-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${alert.riskScore}%`,
                            backgroundColor:
                              alert.riskScore >= 80 ? '#ef4444' : alert.riskScore >= 50 ? '#f59e0b' : '#10b981',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlert(alert);
                      }}
                      className="p-2 hover:bg-cyber-purple/20 rounded-lg transition-colors text-cyber-purple"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAlerts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-cyber-muted">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p>没有找到匹配的事件</p>
              <p className="text-sm mt-1">尝试调整筛选条件</p>
            </div>
          )}
        </div>
      </div>

      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedAlert(null)} />
          <div className="relative w-full max-w-xl glass-panel h-full overflow-auto data-flow-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-cyber-text">事件详情</h2>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 hover:bg-cyber-border/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-cyber-muted" />
                </button>
              </div>

              <div className={`p-4 rounded-xl border ${getSeverityBorder(selectedAlert.severity)} bg-cyber-bg/50 mb-6`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(selectedAlert.severity)}`}>
                        {selectedAlert.severity.toUpperCase()}
                      </span>
                      {selectedAlert.isReviewed ? (
                        <span className="flex items-center gap-1 text-cyber-green text-xs">
                          <CheckCircle className="w-3 h-3" /> 已审核
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-cyber-yellow text-xs">
                          <XCircle className="w-3 h-3" /> 未审核
                        </span>
                      )}
                    </div>
                    <p className="text-cyber-text font-medium">{selectedAlert.reason}</p>
                  </div>
                  <div
                    className={`text-3xl font-bold ${
                      selectedAlert.riskScore >= 80
                        ? 'text-cyber-red neon-text-red'
                        : selectedAlert.riskScore >= 50
                        ? 'text-cyber-yellow'
                        : 'text-cyber-green'
                    }`}
                  >
                    {selectedAlert.riskScore}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-cyber-muted mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> 时间信息
                  </h3>
                  <div className="glass-panel rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">检测时间</span>
                      <span className="text-cyber-text font-mono">{formatDate(selectedAlert.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyber-muted">事件ID</span>
                      <span className="text-cyber-cyan font-mono text-sm">{selectedAlert.id}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-cyber-muted mb-3 flex items-center gap-2">
                    <Usb className="w-4 h-4" /> 设备信息
                  </h3>
                  <div className="glass-panel rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyber-purple/20 flex items-center justify-center">
                        <Usb className="w-5 h-5 text-cyber-purple" />
                      </div>
                      <div>
                        <p className="text-cyber-text font-medium">{selectedAlert.device.productName}</p>
                        <p className="text-cyber-muted text-sm">{selectedAlert.device.manufacturer}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-cyber-muted">设备路径</span>
                        <p className="text-cyber-text font-mono">{selectedAlert.device.devicePath}</p>
                      </div>
                      <div>
                        <span className="text-cyber-muted">序列号</span>
                        <p className="text-cyber-text font-mono">{selectedAlert.device.serialNumber}</p>
                      </div>
                      <div>
                        <span className="text-cyber-muted">VID:PID</span>
                        <p className="text-cyber-text font-mono">
                          {selectedAlert.device.vendorId.toString(16).padStart(4, '0')}:
                          {selectedAlert.device.productId.toString(16).padStart(4, '0')}
                        </p>
                      </div>
                      <div>
                        <span className="text-cyber-muted">信任度</span>
                        <p
                          className={`font-bold ${
                            (selectedAlert.device.trustScore || 0) >= 70
                              ? 'text-cyber-green'
                              : (selectedAlert.device.trustScore || 0) >= 40
                              ? 'text-cyber-yellow'
                              : 'text-cyber-red'
                          }`}
                        >
                          {selectedAlert.device.trustScore}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-cyber-muted mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> 匹配签名
                  </h3>
                  <div className="glass-panel rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedAlert.matchedSignatures.map((sig) => (
                        <span
                          key={sig}
                          className="px-3 py-1.5 bg-cyber-purple/20 text-cyber-purple rounded-lg text-sm font-mono"
                        >
                          {sig}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-cyber-muted mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> 输入序列
                  </h3>
                  <div className="glass-panel rounded-lg p-4 bg-cyber-bg/80">
                    <pre className="text-cyber-green font-mono text-xs overflow-x-auto">
                      {`// 输入序列数据
[KEY]  WIN  (0x53)
[KEY]  R    (0x15)
[DELAY] 150ms
[STRING] "cmd"
[KEY]  ENTER`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button className="flex-1 py-2.5 bg-cyber-purple text-white rounded-lg hover:bg-cyber-purple/80 transition-colors btn-cyber flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  标记已审核
                </button>
                <button className="flex-1 py-2.5 border border-cyber-border text-cyber-text rounded-lg hover:bg-cyber-border/30 transition-colors flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  查看完整日志
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
