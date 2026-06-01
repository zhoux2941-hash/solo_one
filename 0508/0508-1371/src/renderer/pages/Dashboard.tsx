import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Activity,
  Shield,
  Zap,
  AlertTriangle,
  Usb,
  Clock,
  TrendingUp,
  Eye,
} from 'lucide-react';
import type { DetectionAlert, HIDDevice } from '@shared/types';

const mockAlertData = [
  { time: '00:00', alerts: 2, blocked: 1 },
  { time: '04:00', alerts: 1, blocked: 1 },
  { time: '08:00', alerts: 5, blocked: 3 },
  { time: '12:00', alerts: 8, blocked: 6 },
  { time: '16:00', alerts: 4, blocked: 3 },
  { time: '20:00', alerts: 3, blocked: 2 },
  { time: '24:00', alerts: 2, blocked: 1 },
];

const mockDeviceData = [
  { name: '键盘', count: 12, color: '#8b5cf6' },
  { name: '鼠标', count: 8, color: '#06b6d4' },
  { name: '存储设备', count: 5, color: '#10b981' },
  { name: '其他', count: 3, color: '#f59e0b' },
];

const mockSeverityData = [
  { name: '低危', value: 15, color: '#10b981' },
  { name: '中危', value: 8, color: '#f59e0b' },
  { name: '高危', value: 4, color: '#f97316' },
  { name: '严重', value: 2, color: '#ef4444' },
];

const mockRecentAlerts: DetectionAlert[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 60000),
    device: {
      vendorId: 0x046d,
      productId: 0xc31c,
      manufacturer: 'Logitech',
      productName: 'USB Keyboard',
      serialNumber: 'ABC123',
      devicePath: '/dev/hidraw0',
      firstSeen: new Date(),
      trustScore: 35,
    },
    severity: 'high',
    reason: '检测到可疑的快捷键序列',
    matchedSignatures: ['win_shortcut_suspicious'],
    inputSequence: [],
    riskScore: 75,
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 300000),
    device: {
      vendorId: 0x0a5c,
      productId: 0x4503,
      manufacturer: 'Razer',
      productName: 'DeathAdder',
      serialNumber: 'RAZ001',
      devicePath: '/dev/hidraw1',
      firstSeen: new Date(),
      trustScore: 85,
    },
    severity: 'low',
    reason: '鼠标移动模式异常',
    matchedSignatures: ['mouse_movement_anomaly'],
    inputSequence: [],
    riskScore: 25,
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 600000),
    device: {
      vendorId: 0x1234,
      productId: 0x5678,
      manufacturer: 'Unknown',
      productName: 'HID Device',
      serialNumber: '???',
      devicePath: '/dev/hidraw2',
      firstSeen: new Date(),
      trustScore: 10,
    },
    severity: 'critical',
    reason: '未授权设备接入 - 检测到Rubber Ducky特征',
    matchedSignatures: ['rubber_ducky_detect', 'unknown_device'],
    inputSequence: [],
    riskScore: 95,
  },
];

const mockActiveDevices: HIDDevice[] = [
  {
    vendorId: 0x046d,
    productId: 0xc31c,
    manufacturer: 'Logitech',
    productName: 'G Pro X Keyboard',
    serialNumber: 'LOG12345',
    devicePath: '/dev/hidraw0',
    firstSeen: new Date(Date.now() - 86400000 * 3),
    trustScore: 92,
  },
  {
    vendorId: 0x1532,
    productId: 0x0067,
    manufacturer: 'Razer',
    productName: 'Basilisk V3',
    serialNumber: 'RAZ67890',
    devicePath: '/dev/hidraw1',
    firstSeen: new Date(Date.now() - 86400000 * 7),
    trustScore: 88,
  },
  {
    vendorId: 0x093a,
    productId: 0x2510,
    manufacturer: 'PixArt',
    productName: 'Optical Mouse',
    serialNumber: 'PIX00001',
    devicePath: '/dev/hidraw2',
    firstSeen: new Date(Date.now() - 3600000),
    trustScore: 45,
  },
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  return (
    <div className="glass-panel rounded-xl p-5 card-hover relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-cyber-muted text-sm mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {trend && (
            <div className="flex items-center mt-2 text-xs text-cyber-green">
              <TrendingUp size={12} className="mr-1" />
              {trend}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
          {icon}
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-1 opacity-50"
        style={{
          background: `linear-gradient(90deg, transparent, ${color.includes('green') ? '#10b981' : color.includes('red') ? '#ef4444' : color.includes('purple') ? '#8b5cf6' : '#06b6d4'}, transparent)`,
        }}
      />
    </div>
  );
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'low':
      return 'text-cyber-green';
    case 'medium':
      return 'text-cyber-yellow';
    case 'high':
      return 'text-cyber-orange';
    case 'critical':
      return 'text-cyber-red';
    default:
      return 'text-cyber-muted';
  }
}

function getSeverityBg(severity: string) {
  switch (severity) {
    case 'low':
      return 'bg-cyber-green/20 border-cyber-green/30';
    case 'medium':
      return 'bg-cyber-yellow/20 border-cyber-yellow/30';
    case 'high':
      return 'bg-cyber-orange/20 border-cyber-orange/30';
    case 'critical':
      return 'bg-cyber-red/20 border-cyber-red/30';
    default:
      return 'bg-cyber-muted/20 border-cyber-muted/30';
  }
}

function formatTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full overflow-auto cyber-grid p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-cyber-text neon-text-purple">
              系统仪表板
            </h1>
            <p className="text-cyber-muted text-sm mt-1">
              实时监控 HID 设备安全状态
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-cyber-green">
              <Activity size={16} className="animate-pulse" />
              <span className="text-sm font-medium">系统运行中</span>
            </div>
            <div className="text-cyber-muted text-xs mt-1">
              {currentTime.toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="活跃设备"
          value={mockActiveDevices.length}
          icon={<Usb className="text-cyber-cyan" size={24} />}
          trend="+2 今日"
          color="text-cyber-cyan"
        />
        <StatCard
          title="今日告警"
          value={23}
          icon={<AlertTriangle className="text-cyber-yellow" size={24} />}
          trend="-12% 较昨日"
          color="text-cyber-yellow"
        />
        <StatCard
          title="已阻止攻击"
          value={17}
          icon={<Shield className="text-cyber-green" size={24} />}
          trend="+5 新增"
          color="text-cyber-green"
        />
        <StatCard
          title="威胁评分"
          value="中等"
          icon={<Zap className="text-cyber-orange" size={24} />}
          color="text-cyber-orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cyber-text">告警趋势</h2>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyber-purple" />
                <span className="text-cyber-muted">检测到</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyber-green" />
                <span className="text-cyber-muted">已阻止</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockAlertData}>
                <defs>
                  <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="alerts"
                  stroke="#8b5cf6"
                  fill="url(#colorAlerts)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  stroke="#10b981"
                  fill="url(#colorBlocked)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <h2 className="text-lg font-semibold text-cyber-text mb-4">设备类型分布</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockDeviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {mockDeviceData.map((entry, index) => (
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
          <div className="grid grid-cols-2 gap-2 mt-2">
            {mockDeviceData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-cyber-muted">{item.name}</span>
                <span className="text-cyber-text ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cyber-text">最近告警</h2>
            <button className="text-cyber-purple text-sm hover:underline flex items-center gap-1">
              <Eye size={14} />
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {mockRecentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getSeverityBg(alert.severity)} transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${getSeverityColor(alert.severity)} bg-opacity-20`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-cyber-muted text-xs flex items-center gap-1">
                        <Clock size={10} />
                        {formatTime(alert.timestamp)}
                      </span>
                    </div>
                    <p className="text-cyber-text text-sm mt-2">{alert.reason}</p>
                    <p className="text-cyber-muted text-xs mt-1">
                      {alert.device.manufacturer} {alert.device.productName}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: alert.riskScore >= 80 ? '#ef4444' : alert.riskScore >= 50 ? '#f59e0b' : '#10b981' }}>
                      {alert.riskScore}
                    </div>
                    <div className="text-xs text-cyber-muted">风险分</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cyber-text">活跃设备</h2>
            <div className="flex items-center gap-2 text-cyber-green text-sm">
              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              {mockActiveDevices.length} 在线
            </div>
          </div>
          <div className="space-y-3">
            {mockActiveDevices.map((device, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-cyber-border bg-cyber-bg/50 transition-all hover:border-cyber-purple/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyber-surface flex items-center justify-center">
                      <Usb className="text-cyber-cyan" size={20} />
                    </div>
                    <div>
                      <p className="text-cyber-text text-sm font-medium">
                        {device.productName}
                      </p>
                      <p className="text-cyber-muted text-xs">
                        {device.manufacturer}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-bold ${
                        device.trustScore! >= 70
                          ? 'text-cyber-green'
                          : device.trustScore! >= 40
                          ? 'text-cyber-yellow'
                          : 'text-cyber-red'
                      }`}
                    >
                      {device.trustScore}%
                    </div>
                    <p className="text-xs text-cyber-muted">信任度</p>
                  </div>
                </div>
                <div className="mt-2 h-1 bg-cyber-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${device.trustScore}%`,
                      backgroundColor:
                        device.trustScore! >= 70
                          ? '#10b981'
                          : device.trustScore! >= 40
                          ? '#f59e0b'
                          : '#ef4444',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 glass-panel rounded-xl p-5">
        <h2 className="text-lg font-semibold text-cyber-text mb-4">威胁严重程度分布</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockSeverityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {mockSeverityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
