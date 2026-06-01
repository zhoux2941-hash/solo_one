import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useStore } from '@/store/useStore';
import { X, Activity, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

type MetricTab = 'request_count' | 'error_rate' | 'p99_latency';

const TAB_CONFIG: { key: MetricTab; label: string; icon: React.ReactNode; unit: string }[] = [
  { key: 'request_count', label: '请求量', icon: <Activity size={14} />, unit: '次' },
  { key: 'error_rate', label: '错误率', icon: <AlertTriangle size={14} />, unit: '%' },
  { key: 'p99_latency', label: '延迟', icon: <Clock size={14} />, unit: 'ms' },
];

function MiniChart({ data, tab }: { data: any[]; tab: MetricTab }) {
  const unit = TAB_CONFIG.find((t) => t.key === tab)?.unit || '';
  const option = {
    backgroundColor: 'transparent',
    grid: { top: 10, right: 10, bottom: 20, left: 40 },
    xAxis: {
      type: 'category' as const,
      data: data.map((d) => dayjs(d.timestamp).format('HH:mm')),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    series: [
      {
        type: 'line' as const,
        data: data.map((d) => d.value),
        smooth: true,
        lineStyle: { color: '#22d3ee', width: 2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(34,211,238,0.3)' }, { offset: 1, color: 'rgba(34,211,238,0)' }] } },
        symbol: 'none',
      },
    ],
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: (p: any) => `${p[0].name}<br/>${p[0].value} ${unit}`,
    },
  };

  return <ReactECharts option={option} style={{ height: 120 }} />;
}

export default function ServiceDrawer() {
  const navigate = useNavigate();
  const selectedService = useStore((s) => s.selectedService);
  const setSelectedService = useStore((s) => s.setSelectedService);
  const topology = useStore((s) => s.topology);
  const metricSeries = useStore((s) => s.metricSeries);
  const fetchTimeSeries = useStore((s) => s.fetchTimeSeries);

  const [activeTab, setActiveTab] = useState<MetricTab>('request_count');

  const node = topology?.nodes.find((n) => n.id === selectedService);
  const serviceMetrics = metricSeries.filter(
    (m) => m.service_name === selectedService && m.metric_type === activeTab
  );

  useEffect(() => {
    if (selectedService) {
      fetchTimeSeries([selectedService], activeTab);
    }
  }, [selectedService, activeTab, fetchTimeSeries]);

  if (!selectedService || !node) return null;

  const statusColor =
    node.status === 'healthy'
      ? 'bg-cyber-success'
      : node.status === 'warning'
      ? 'bg-cyber-warning'
      : 'bg-cyber-danger';

  const statusLabel =
    node.status === 'healthy' ? '健康' : node.status === 'warning' ? '告警' : '异常';

  const chartData = serviceMetrics.length > 0
    ? serviceMetrics[0].data_points.map((p) => ({ timestamp: p.timestamp, value: p.value }))
    : [];

  return (
    <div className="absolute right-0 top-0 h-full w-[320px] bg-cyber-panel border-l border-cyber-border z-20 animate-slide-in-right overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-cyber-border">
        <h3 className="text-lg font-semibold text-cyber-cyan">{node.name}</h3>
        <button onClick={() => setSelectedService(null)} className="text-cyber-muted hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
          <span className="text-sm">{statusLabel}</span>
        </div>

        {node.metrics && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-cyber-bg rounded-lg p-2 text-center">
              <div className="text-cyber-muted">请求量</div>
              <div className="text-white font-medium">{node.metrics.request_count}</div>
            </div>
            <div className="bg-cyber-bg rounded-lg p-2 text-center">
              <div className="text-cyber-muted">错误率</div>
              <div className="text-white font-medium">{node.metrics.error_rate}%</div>
            </div>
            <div className="bg-cyber-bg rounded-lg p-2 text-center">
              <div className="text-cyber-muted">P99</div>
              <div className="text-white font-medium">{node.metrics.p99_latency}ms</div>
            </div>
          </div>
        )}

        <div className="flex gap-1">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all ${
                activeTab === tab.key
                  ? 'bg-cyber-cyan/20 text-cyber-cyan glow-cyan'
                  : 'bg-cyber-bg text-cyber-muted hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <MiniChart data={chartData} tab={activeTab} />

        <button
          onClick={() => navigate(`/analysis?service=${selectedService}`)}
          className="w-full py-2 rounded-lg bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30 transition-all glow-cyan text-sm font-medium"
        >
          分析根因
        </button>
      </div>
    </div>
  );
}
