import type {
  TopologyData,
  Service,
  RootCauseAnalysis,
  AnalysisRequest,
  AnalysisHistoryRecord,
  MetricSeries,
  ChangeEvent,
} from '@/types';

const BASE_URL = 'http://localhost:8001';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API请求失败: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function fetchTopology(start: string, end: string): Promise<TopologyData> {
  return request<TopologyData>(`/api/topology?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
}

export function fetchServices(): Promise<Service[]> {
  return request<Service[]>('/api/services');
}

export function fetchServiceDetail(name: string): Promise<Service> {
  return request<Service>(`/api/services/${encodeURIComponent(name)}`);
}

export function fetchRootCauseAnalysis(req: AnalysisRequest): Promise<RootCauseAnalysis> {
  return request<RootCauseAnalysis>('/api/analysis/root-cause', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

export function fetchAnalysisHistory(
  limit: number = 10,
  offset: number = 0
): Promise<{ total: number; records: AnalysisHistoryRecord[] }> {
  return request<{ total: number; records: AnalysisHistoryRecord[] }>(
    `/api/analysis/history?limit=${limit}&offset=${offset}`
  );
}

export function fetchTimeSeries(
  services: string[],
  metricType: string,
  start: string,
  end: string,
  step: string = '1m'
): Promise<MetricSeries[]> {
  const params = new URLSearchParams({
    services: services.join(','),
    metric_type: metricType,
    start,
    end,
    step,
  });
  return request<MetricSeries[]>(`/api/metrics/timeseries?${params}`);
}

export function fetchChangeEvents(
  serviceName: string,
  start: string,
  end: string
): Promise<ChangeEvent[]> {
  return request<ChangeEvent[]>(
    `/api/events/changes?service_name=${encodeURIComponent(serviceName)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
  );
}
