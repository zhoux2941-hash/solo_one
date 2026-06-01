package models

import (
	"encoding/json"
	"fmt"
	"math"
	"strings"
	"time"
)

type CompletionType string

const (
	TextCompletion CompletionType = "text_completion"
	ChatCompletion CompletionType = "chat_completion"
)

type LoadTestMode string

const (
	FixedQPSMode     LoadTestMode = "fixed_qps"
	LinearGrowthMode LoadTestMode = "linear_growth"
	BurstMode        LoadTestMode = "burst"
	ReplayMode       LoadTestMode = "replay"
)

type TestStatus string

const (
	StatusPending   TestStatus = "pending"
	StatusRunning   TestStatus = "running"
	StatusPaused    TestStatus = "paused"
	StatusCompleted TestStatus = "completed"
	StatusFailed    TestStatus = "failed"
	StatusStopped   TestStatus = "stopped"
)

type FlexibleTime struct {
	time.Time
}

func (ft *FlexibleTime) UnmarshalJSON(data []byte) error {
	dataStr := strings.TrimSpace(string(data))
	if dataStr == `""` || dataStr == `null` {
		ft.Time = time.Time{}
		return nil
	}

	if dataStr[0] == '"' {
		unquoted := dataStr[1 : len(dataStr)-1]
		for _, layout := range []string{
			time.RFC3339Nano,
			time.RFC3339,
			"2006-01-02T15:04:05Z07:00",
			"2006-01-02T15:04:05Z",
			"2006-01-02 15:04:05.999999999",
			"2006-01-02 15:04:05",
		} {
			if t, err := time.Parse(layout, unquoted); err == nil {
				ft.Time = t
				return nil
			}
		}
		return fmt.Errorf("cannot parse timestamp string: %s", unquoted)
	}

	var num float64
	if err := json.Unmarshal(data, &num); err != nil {
		return fmt.Errorf("timestamp is neither string nor number: %s", dataStr)
	}

	if num > float64(math.MaxInt64) || num < float64(math.MinInt64) {
		return fmt.Errorf("timestamp number out of int64 range: %v", num)
	}

	intVal := int64(num)

	switch {
	case intVal > 1e18:
		ft.Time = time.Unix(0, intVal)
	case intVal > 1e15:
		ft.Time = time.UnixMilli(intVal)
	case intVal > 1e12:
		ft.Time = time.UnixMilli(intVal)
	case intVal > 1e9:
		ft.Time = time.Unix(intVal, 0)
	default:
		ft.Time = time.Unix(intVal, 0)
	}
	return nil
}

func (ft FlexibleTime) MarshalJSON() ([]byte, error) {
	return ft.Time.MarshalJSON()
}

type RequestLog struct {
	ID              string            `json:"id"`
	Timestamp       FlexibleTime      `json:"timestamp"`
	CompletionType  CompletionType    `json:"completion_type"`
	Model           string            `json:"model"`
	Prompt          string            `json:"prompt,omitempty"`
	Messages        []ChatMessage     `json:"messages,omitempty"`
	Temperature     *float64          `json:"temperature,omitempty"`
	MaxTokens       *int              `json:"max_tokens,omitempty"`
	TopP            *float64          `json:"top_p,omitempty"`
	FrequencyPenalty *float64         `json:"frequency_penalty,omitempty"`
	PresencePenalty *float64          `json:"presence_penalty,omitempty"`
	Stream          bool              `json:"stream"`
	Headers         map[string]string `json:"headers,omitempty"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type LoadTestConfig struct {
	ID               string            `json:"id"`
	Name             string            `json:"name"`
	Description      string            `json:"description,omitempty"`
	TargetURL        string            `json:"target_url"`
	APIKey           string            `json:"api_key,omitempty"`
	CompletionType   CompletionType    `json:"completion_type"`
	Mode             LoadTestMode      `json:"mode"`
	Duration         int64             `json:"duration_seconds"`
	WorkerCount      int               `json:"worker_count"`
	FixedQPS         int               `json:"fixed_qps,omitempty"`
	LinearStartQPS   int               `json:"linear_start_qps,omitempty"`
	LinearEndQPS     int               `json:"linear_end_qps,omitempty"`
	BurstMultiplier  float64           `json:"burst_multiplier,omitempty"`
	BurstAtSeconds   int64             `json:"burst_at_seconds,omitempty"`
	ReplaySpeed      float64           `json:"replay_speed,omitempty"`
	RequestTimeout   int64             `json:"request_timeout_seconds,omitempty"`
	MaxRetries       int               `json:"max_retries,omitempty"`
	CustomHeaders    map[string]string `json:"custom_headers,omitempty"`
	Model            string            `json:"model,omitempty"`
}

type LoadTest struct {
	ID         string            `json:"id"`
	Config     LoadTestConfig    `json:"config"`
	Status     TestStatus        `json:"status"`
	StartTime  *time.Time        `json:"start_time,omitempty"`
	EndTime    *time.Time        `json:"end_time,omitempty"`
	WorkerIDs  []string          `json:"worker_ids"`
	Error      string            `json:"error,omitempty"`
	CreatedAt  time.Time         `json:"created_at"`
	UpdatedAt  time.Time         `json:"updated_at"`
}

type RequestMetrics struct {
	TestID         string         `json:"test_id"`
	WorkerID       string         `json:"worker_id"`
	RequestID      string         `json:"request_id"`
	Target         ABTestTarget   `json:"target,omitempty"`
	Timestamp      time.Time      `json:"timestamp"`
	TTFT           float64        `json:"ttft_ms"`
	TPOT           float64        `json:"tpot_ms"`
	TotalLatency   float64        `json:"total_latency_ms"`
	ResponseLength int            `json:"response_length"`
	TokenCount     int            `json:"token_count"`
	PromptTokens   int            `json:"prompt_tokens"`
	OutputTokens   int            `json:"output_tokens"`
	StatusCode     int            `json:"status_code"`
	Success        bool           `json:"success"`
	ErrorType      string         `json:"error_type,omitempty"`
	ErrorMessage   string         `json:"error_message,omitempty"`
	RetryCount     int            `json:"retry_count"`
	CompletionType CompletionType `json:"completion_type"`
}

type AggregatedMetrics struct {
	TestID            string                `json:"test_id"`
	Timestamp         time.Time             `json:"timestamp"`
	WindowSeconds     int                   `json:"window_seconds"`
	TotalRequests     int64                 `json:"total_requests"`
	SuccessRequests   int64                 `json:"success_requests"`
	FailedRequests    int64                 `json:"failed_requests"`
	ErrorRate         float64               `json:"error_rate"`
	ActualQPS         float64               `json:"actual_qps"`
	TargetQPS         float64               `json:"target_qps,omitempty"`
	TTFTPercentiles   map[string]float64    `json:"ttft_percentiles"`
	TPOTPercentiles   map[string]float64    `json:"tpot_percentiles"`
	TotalPercentiles  map[string]float64    `json:"total_percentiles"`
	LengthPercentiles map[string]float64    `json:"length_percentiles"`
	TokenPercentiles  map[string]float64    `json:"token_percentiles"`
	StatusCodes       map[int]int64         `json:"status_codes"`
	ErrorTypes        map[string]int64      `json:"error_types"`
	AverageRetryCount float64               `json:"avg_retry_count"`
}

type WorkerStatus struct {
	ID            string    `json:"id"`
	TestID        string    `json:"test_id,omitempty"`
	Status        string    `json:"status"`
	CurrentQPS    float64   `json:"current_qps"`
	TotalRequests int64     `json:"total_requests"`
	CPUUsage      float64   `json:"cpu_usage,omitempty"`
	MemoryUsage   float64   `json:"memory_usage,omitempty"`
	LastHeartbeat time.Time `json:"last_heartbeat"`
}

type ABTestConfig struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description,omitempty"`
	ConfigA     LoadTestConfig `json:"config_a"`
	ConfigB     LoadTestConfig `json:"config_b"`
	CreatedAt   time.Time      `json:"created_at"`
}

type ABTestResult struct {
	ID             string           `json:"id"`
	Config         ABTestConfig     `json:"config"`
	ResultA        *TestResult      `json:"result_a"`
	ResultB        *TestResult      `json:"result_b"`
	Comparison     *TestComparison  `json:"comparison"`
	Status         TestStatus       `json:"status"`
	StartTime      *time.Time       `json:"start_time,omitempty"`
	EndTime        *time.Time       `json:"end_time,omitempty"`
	CreatedAt      time.Time        `json:"created_at"`
}

type TestResult struct {
	TestID           string           `json:"test_id"`
	Config           LoadTestConfig   `json:"config"`
	StartTime        time.Time        `json:"start_time"`
	EndTime          time.Time        `json:"end_time"`
	DurationSeconds  float64          `json:"duration_seconds"`
	TotalRequests    int64            `json:"total_requests"`
	SuccessRequests  int64            `json:"success_requests"`
	FailedRequests   int64            `json:"failed_requests"`
	ErrorRate        float64          `json:"error_rate"`
	AverageQPS       float64          `json:"average_qps"`
	TTFT             PercentileData   `json:"ttft"`
	TPOT             PercentileData   `json:"tpot"`
	TotalLatency     PercentileData   `json:"total_latency"`
	ResponseLength   PercentileData   `json:"response_length"`
	TokenCount       PercentileData   `json:"token_count"`
	StatusCodes      map[int]int64    `json:"status_codes"`
	ErrorTypes       map[string]int64 `json:"error_types"`
	TimeSeries       []TimeSeriesPoint `json:"time_series"`
}

type PercentileData struct {
	Min    float64            `json:"min"`
	Max    float64            `json:"max"`
	Avg    float64            `json:"avg"`
	P50    float64            `json:"p50"`
	P90    float64            `json:"p90"`
	P95    float64            `json:"p95"`
	P99    float64            `json:"p99"`
}

type TimeSeriesPoint struct {
	Timestamp      time.Time `json:"timestamp"`
	QPS            float64   `json:"qps"`
	ErrorRate      float64   `json:"error_rate"`
	TTFTP95        float64   `json:"ttft_p95"`
	TPOTP95        float64   `json:"tpot_p95"`
	TotalLatencyP95 float64  `json:"total_latency_p95"`
}

type TestComparison struct {
	QPSDifference        float64 `json:"qps_difference_pct"`
	ErrorRateDifference  float64 `json:"error_rate_difference_pct"`
	TTFTP95Improvement   float64 `json:"ttft_p95_improvement_pct"`
	TPOTP95Improvement   float64 `json:"tpot_p95_improvement_pct"`
	TotalP95Improvement  float64 `json:"total_latency_p95_improvement_pct"`
	IsBetter             string  `json:"is_better"`
}

type ABTestTarget string

const (
	TargetA ABTestTarget = "A"
	TargetB ABTestTarget = "B"
)

func HashRequestID(requestID string) ABTestTarget {
	var hash uint32 = 2166136261
	for i := 0; i < len(requestID); i++ {
		hash ^= uint32(requestID[i])
		hash *= 16777619
	}
	if hash%2 == 0 {
		return TargetA
	}
	return TargetB
}
