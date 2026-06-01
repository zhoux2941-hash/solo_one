import { useEffect, useState, useCallback } from 'react';
import TopologyGraph from '@/components/TopologyGraph';
import HealthPanel from '@/components/HealthPanel';
import ServiceDrawer from '@/components/ServiceDrawer';
import { useStore } from '@/store/useStore';
import dayjs from 'dayjs';
import { RefreshCw } from 'lucide-react';

const TIME_RANGES = [
  { label: '近1小时', value: '1h' },
  { label: '近6小时', value: '6h' },
  { label: '近24小时', value: '24h' },
  { label: '自定义', value: 'custom' },
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

export default function TopologyPage() {
  const fetchTopology = useStore((s) => s.fetchTopology);
  const setTimeRange = useStore((s) => s.setTimeRange);
  const topologyLoading = useStore((s) => s.topologyLoading);
  const selectedService = useStore((s) => s.selectedService);
  const [activeRange, setActiveRange] = useState('1h');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const range = getTimeRange(activeRange);
    setTimeRange(range);
    await fetchTopology();
  }, [activeRange, fetchTopology, setTimeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTopology();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchTopology]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTopology();
    setRefreshing(false);
  };

  const handleRangeChange = (range: string) => {
    setActiveRange(range);
    if (range !== 'custom') {
      setTimeRange(getTimeRange(range));
    }
  };

  return (
    <div className="flex h-full relative">
      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-cyber-panel border-b border-cyber-border flex items-center px-4 gap-3">
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
          <button
            onClick={handleRefresh}
            className="ml-auto p-1.5 rounded-lg text-cyber-muted hover:text-cyber-cyan hover:bg-cyber-bg transition-all"
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          {topologyLoading && (
            <span className="text-xs text-cyber-cyan animate-pulse">加载中...</span>
          )}
        </div>
        <div className="flex-1">
          <TopologyGraph />
        </div>
      </div>
      <HealthPanel />
      {selectedService && <ServiceDrawer />}
    </div>
  );
}
