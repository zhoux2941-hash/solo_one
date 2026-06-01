import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import EventTimeline from '@/components/EventTimeline';
import CausePanel from '@/components/CausePanel';
import { Search, Loader2 } from 'lucide-react';
import { fetchChangeEvents } from '@/api/client';
import type { ChangeEvent } from '@/types';
import dayjs from 'dayjs';

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

export default function AnalysisPage() {
  const [searchParams] = useSearchParams();
  const serviceParam = searchParams.get('service');

  const services = useStore((s) => s.services);
  const fetchServices = useStore((s) => s.fetchServices);
  const analyzeRootCause = useStore((s) => s.analyzeRootCause);
  const analysisLoading = useStore((s) => s.analysisLoading);
  const rootCauseResult = useStore((s) => s.rootCauseResult);
  const setTimeRange = useStore((s) => s.setTimeRange);

  const [selectedService, setSelectedService] = useState(serviceParam || '');
  const [activeRange, setActiveRange] = useState('1h');
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    if (serviceParam) setSelectedService(serviceParam);
  }, [serviceParam]);

  const loadEvents = useCallback(async () => {
    if (!selectedService) return;
    setEventsLoading(true);
    try {
      const range = getTimeRange(activeRange);
      const data = await fetchChangeEvents(selectedService, range.start, range.end);
      setEvents(data);
    } catch {
      setEvents([]);
    }
    setEventsLoading(false);
  }, [selectedService, activeRange]);

  const handleAnalyze = async () => {
    if (!selectedService) return;
    const range = getTimeRange(activeRange);
    setTimeRange(range);
    await analyzeRootCause(selectedService);
    loadEvents();
  };

  const handleRangeChange = (range: string) => {
    setActiveRange(range);
    setTimeRange(getTimeRange(range));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 bg-cyber-panel border-b border-cyber-border flex items-center px-4 gap-3">
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="bg-cyber-bg border border-cyber-border rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-cyber-cyan"
        >
          <option value="">选择服务</option>
          {services.map((s) => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>

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
          onClick={handleAnalyze}
          disabled={!selectedService || analysisLoading}
          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium glow-cyan"
        >
          {analysisLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          分析
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[45%] border-r border-cyber-border overflow-y-auto">
          <div className="p-3 border-b border-cyber-border">
            <h3 className="text-sm font-semibold text-cyber-muted">变更事件</h3>
          </div>
          <EventTimeline events={events} loading={eventsLoading} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 border-b border-cyber-border">
            <h3 className="text-sm font-semibold text-cyber-muted">根因分析</h3>
          </div>
          <CausePanel />
        </div>
      </div>
    </div>
  );
}
