import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import TimelineChart from '@/components/TimelineChart';
import { Clock } from 'lucide-react';
import dayjs from 'dayjs';

const METRIC_TYPES = [
  { label: '错误率', value: 'error_rate' },
  { label: '请求量', value: 'request_count' },
  { label: 'P99延迟', value: 'p99_latency' },
];

const TIME_RANGES = [
  { label: '近1小时', value: '1h' },
  { label: '近6小时', value: '6h' },
  { label: '近24小时', value: '24h' },
];

function getTimeRange(range: string) {
  const end = dayjs();
  let start = end;
  switch (range) {
    case '1h': start = end.subtract(1, 'hour'); break;
    case '6h': start = end.subtract(6, 'hour'); break;
    case '24h': start = end.subtract(24, 'hour'); break;
    default: start = end.subtract(1, 'hour'); break;
  }
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function TimelinePage() {
  const services = useStore((s) => s.services);
  const fetchServices = useStore((s) => s.fetchServices);
  const metricSeries = useStore((s) => s.metricSeries);
  const metricsLoading = useStore((s) => s.metricsLoading);
  const fetchTimeSeries = useStore((s) => s.fetchTimeSeries);
  const setTimeRange = useStore((s) => s.setTimeRange);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [metricType, setMetricType] = useState('error_rate');
  const [activeRange, setActiveRange] = useState('1h');

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const loadData = useCallback(async () => {
    if (selectedServices.length === 0) return;
    const range = getTimeRange(activeRange);
    setTimeRange(range);
    await fetchTimeSeries(selectedServices, metricType);
  }, [selectedServices, metricType, activeRange, fetchTimeSeries, setTimeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleServiceToggle = (name: string) => {
    setSelectedServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const handleRangeChange = (range: string) => {
    setActiveRange(range);
    setTimeRange(getTimeRange(range));
  };

  const handleBrushSelect = (start: string, end: string) => {
    setTimeRange({ start, end });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-cyber-panel border-b border-cyber-border p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Clock size={16} className="text-cyber-cyan" />
          <div className="flex gap-1">
            {TIME_RANGES.map((tr) => (
              <button
                key={tr.value}
                onClick={() => handleRangeChange(tr.value)}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  activeRange === tr.value
                    ? 'bg-cyber-cyan/20 text-cyber-cyan glow-cyan'
                    : 'text-cyber-muted hover:text-white hover:bg-cyber-bg'
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 ml-4">
            {METRIC_TYPES.map((mt) => (
              <button
                key={mt.value}
                onClick={() => setMetricType(mt.value)}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  metricType === mt.value
                    ? 'bg-cyber-cyan/20 text-cyber-cyan glow-cyan'
                    : 'text-cyber-muted hover:text-white hover:bg-cyber-bg'
                }`}
              >
                {mt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {services.map((s) => (
            <button
              key={s.name}
              onClick={() => handleServiceToggle(s.name)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all border ${
                selectedServices.includes(s.name)
                  ? 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/40 glow-cyan'
                  : 'bg-cyber-bg text-cyber-muted border-cyber-border hover:text-white'
              }`}
            >
              {s.name}
            </button>
          ))}
          {services.length === 0 && (
            <span className="text-xs text-cyber-muted">请先加载服务列表</span>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        {selectedServices.length === 0 ? (
          <div className="flex items-center justify-center h-full text-cyber-muted text-sm">
            请选择至少一个服务查看指标趋势
          </div>
        ) : (
          <TimelineChart
            metricSeries={metricSeries}
            loading={metricsLoading}
            onBrushSelect={handleBrushSelect}
          />
        )}
      </div>
    </div>
  );
}
