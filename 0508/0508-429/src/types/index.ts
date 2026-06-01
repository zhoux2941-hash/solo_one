export interface ServiceMetrics {
  request_count: number;
  error_rate: number;
  p99_latency: number;
}

export interface ServiceInstance {
  name: string;
  address: string;
  port: number;
  status: string;
  restart_count: number;
  labels: Record<string, string>;
}

export interface Service {
  name: string;
  instances: ServiceInstance[];
  source: string;
  version: string;
}

export interface TopologyNode {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error';
  metrics: ServiceMetrics;
}

export interface TopologyEdge {
  source: string;
  target: string;
  call_count: number;
  error_rate: number;
  avg_latency: number;
  health: 'healthy' | 'warning' | 'error';
}

export interface TopologyData {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export interface RootCauseEntry {
  service_name: string;
  correlation_score: number;
  event_type: string;
  event_time: string;
  description: string;
  recommendation: string;
}

export interface EventChainItem {
  service_name: string;
  event: string;
  time: string;
  impact: string;
}

export interface RootCauseAnalysis {
  service_name: string;
  anomaly_detected: string;
  root_causes: RootCauseEntry[];
  chain: EventChainItem[];
  conclusion: string;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface MetricSeries {
  service_name: string;
  metric_type: string;
  data_points: TimeSeriesPoint[];
}

export interface ChangeEvent {
  service_name: string;
  event_type: string;
  source: string;
  timestamp: string;
  details: Record<string, string>;
}

export interface AnalysisHistoryRecord {
  id: string;
  service_name: string;
  conclusion: string;
  created_at: string;
  root_causes: RootCauseEntry[];
}

export interface AnalysisRequest {
  service_name: string;
  time_range: { start: string; end: string };
}
