import { create } from 'zustand';
import type {
  TopologyData,
  RootCauseAnalysis,
  AnalysisHistoryRecord,
  MetricSeries,
  Service,
} from '@/types';
import * as api from '@/api/client';
import dayjs from 'dayjs';

interface TimeRange {
  start: string;
  end: string;
}

interface AppStore {
  topology: TopologyData | null;
  topologyLoading: boolean;
  selectedService: string | null;
  highlightedNodes: Set<string>;
  timeRange: TimeRange;
  rootCauseResult: RootCauseAnalysis | null;
  analysisLoading: boolean;
  analysisHistory: AnalysisHistoryRecord[];
  analysisHistoryTotal: number;
  metricSeries: MetricSeries[];
  metricsLoading: boolean;
  services: Service[];
  servicesLoading: boolean;

  setTopology: (data: TopologyData | null) => void;
  setSelectedService: (name: string | null) => void;
  setHighlightedNodes: (nodes: Set<string>) => void;
  setTimeRange: (range: TimeRange) => void;
  setRootCauseResult: (result: RootCauseAnalysis | null) => void;

  fetchTopology: () => Promise<void>;
  fetchServices: () => Promise<void>;
  analyzeRootCause: (serviceName: string) => Promise<void>;
  fetchTimeSeries: (
    services: string[],
    metricType: string,
    step?: string
  ) => Promise<void>;
  fetchHistory: (limit?: number, offset?: number) => Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  topology: null,
  topologyLoading: false,
  selectedService: null,
  highlightedNodes: new Set(),
  timeRange: {
    start: dayjs().subtract(1, 'hour').toISOString(),
    end: dayjs().toISOString(),
  },
  rootCauseResult: null,
  analysisLoading: false,
  analysisHistory: [],
  analysisHistoryTotal: 0,
  metricSeries: [],
  metricsLoading: false,
  services: [],
  servicesLoading: false,

  setTopology: (data) => set({ topology: data }),
  setSelectedService: (name) => set({ selectedService: name }),
  setHighlightedNodes: (nodes) => set({ highlightedNodes: nodes }),
  setTimeRange: (range) => set({ timeRange: range }),
  setRootCauseResult: (result) => set({ rootCauseResult: result }),

  fetchTopology: async () => {
    set({ topologyLoading: true });
    try {
      const { timeRange } = get();
      const data = await api.fetchTopology(timeRange.start, timeRange.end);
      set({ topology: data, topologyLoading: false });
    } catch (err) {
      console.error('获取拓扑数据失败:', err);
      set({ topologyLoading: false });
    }
  },

  fetchServices: async () => {
    set({ servicesLoading: true });
    try {
      const data = await api.fetchServices();
      set({ services: data, servicesLoading: false });
    } catch (err) {
      console.error('获取服务列表失败:', err);
      set({ servicesLoading: false });
    }
  },

  analyzeRootCause: async (serviceName: string) => {
    set({ analysisLoading: true, rootCauseResult: null });
    try {
      const { timeRange } = get();
      const result = await api.fetchRootCauseAnalysis({
        service_name: serviceName,
        time_range: timeRange,
      });
      set({ rootCauseResult: result, analysisLoading: false });
    } catch (err) {
      console.error('根因分析失败:', err);
      set({ analysisLoading: false });
    }
  },

  fetchTimeSeries: async (services, metricType, step = '1m') => {
    set({ metricsLoading: true });
    try {
      const { timeRange } = get();
      const data = await api.fetchTimeSeries(
        services,
        metricType,
        timeRange.start,
        timeRange.end,
        step
      );
      set({ metricSeries: data, metricsLoading: false });
    } catch (err) {
      console.error('获取指标数据失败:', err);
      set({ metricsLoading: false });
    }
  },

  fetchHistory: async (limit = 10, offset = 0) => {
    try {
      const data = await api.fetchAnalysisHistory(limit, offset);
      set({ analysisHistory: data.records, analysisHistoryTotal: data.total });
    } catch (err) {
      console.error('获取分析历史失败:', err);
    }
  },
}));
