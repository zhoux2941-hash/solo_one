export type CompletionType = 'text_completion' | 'chat_completion';
export type LoadTestMode = 'fixed_qps' | 'linear_growth' | 'burst' | 'replay';
export type TestStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'stopped';

export type Timestamp = string | number;

export function parseTimestamp(ts: Timestamp): Date {
  if (typeof ts === 'string') {
    return new Date(ts);
  }

  const num = ts;

  if (num > 1e18) {
    return new Date(num / 1e6);
  }
  if (num > 1e15) {
    return new Date(num);
  }
  if (num > 1e12) {
    return new Date(num);
  }
  if (num > 1e9) {
    return new Date(num * 1000);
  }
  return new Date(num * 1000);
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface RequestLog {
  id: string;
  timestamp: Timestamp;
  completion_type: CompletionType;
  model: string;
  prompt?: string;
  messages?: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream: boolean;
}

export interface LoadTestConfig {
  id?: string;
  name: string;
  description?: string;
  target_url: string;
  api_key?: string;
  completion_type: CompletionType;
  mode: LoadTestMode;
  duration_seconds: number;
  worker_count: number;
  fixed_qps?: number;
  linear_start_qps?: number;
  linear_end_qps?: number;
  burst_multiplier?: number;
  burst_at_seconds?: number;
  replay_speed?: number;
  request_timeout_seconds?: number;
  max_retries?: number;
  custom_headers?: Record<string, string>;
  model?: string;
}

export interface LoadTest {
  id: string;
  config: LoadTestConfig;
  status: TestStatus;
  start_time?: string;
  end_time?: string;
  worker_ids: string[];
  error?: string;
  created_at: string;
  updated_at: string;
}

export type ABTestTarget = 'A' | 'B';

export interface RequestMetrics {
  test_id: string;
  worker_id: string;
  request_id: string;
  target?: ABTestTarget;
  timestamp: Timestamp;
  ttft_ms: number;
  tpot_ms: number;
  total_latency_ms: number;
  response_length: number;
  token_count: number;
  prompt_tokens: number;
  output_tokens: number;
  status_code: number;
  success: boolean;
  error_type?: string;
  error_message?: string;
  retry_count: number;
  completion_type: CompletionType;
}

export interface AggregatedMetrics {
  test_id: string;
  timestamp: Timestamp;
  window_seconds: number;
  total_requests: number;
  success_requests: number;
  failed_requests: number;
  error_rate: number;
  actual_qps: number;
  target_qps?: number;
  ttft_percentiles: Record<string, number>;
  tpot_percentiles: Record<string, number>;
  total_percentiles: Record<string, number>;
  length_percentiles: Record<string, number>;
  token_percentiles: Record<string, number>;
  status_codes: Record<string, number>;
  error_types: Record<string, number>;
  avg_retry_count: number;
}

export interface WorkerStatus {
  id: string;
  test_id?: string;
  status: string;
  current_qps: number;
  total_requests: number;
  cpu_usage?: number;
  memory_usage?: number;
  last_heartbeat: string;
}

export interface PercentileData {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface TimeSeriesPoint {
  timestamp: Timestamp;
  qps: number;
  error_rate: number;
  ttft_p95: number;
  tpot_p95: number;
  total_latency_p95: number;
}

export interface TestResult {
  test_id: string;
  config: LoadTestConfig;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  total_requests: number;
  success_requests: number;
  failed_requests: number;
  error_rate: number;
  average_qps: number;
  ttft: PercentileData;
  tpot: PercentileData;
  total_latency: PercentileData;
  response_length: PercentileData;
  token_count: PercentileData;
  status_codes: Record<string, number>;
  error_types: Record<string, number>;
  time_series: TimeSeriesPoint[];
}

export interface ABTestConfig {
  id: string;
  name: string;
  description?: string;
  config_a: LoadTestConfig;
  config_b: LoadTestConfig;
  created_at: string;
}

export interface TestComparison {
  qps_difference_pct: number;
  error_rate_difference_pct: number;
  ttft_p95_improvement_pct: number;
  tpot_p95_improvement_pct: number;
  total_latency_p95_improvement_pct: number;
  is_better: string;
}

export interface ABTestResult {
  id: string;
  config: ABTestConfig;
  result_a?: TestResult;
  result_b?: TestResult;
  comparison?: TestComparison;
  status: TestStatus;
  start_time?: string;
  end_time?: string;
  created_at: string;
}
