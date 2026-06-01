package collector

import (
	"context"
	"math"
	"sort"
	"sync"
	"time"

	"github.com/spf13/viper"
	"llm-load-test/internal/models"
)

type MetricsCollector struct {
	metrics       map[string][]float64
	rawMetrics    []*models.RequestMetrics
	mu            sync.RWMutex
	testID        string
	windowStart   time.Time
	percentiles   []int
	windowSeconds int
}

func NewMetricsCollector(testID string) *MetricsCollector {
	percentiles := viper.GetIntSlice("metrics.percentiles")
	if len(percentiles) == 0 {
		percentiles = []int{50, 90, 95, 99}
	}
	interval := viper.GetDuration("metrics.push_interval")
	if interval == 0 {
		interval = 5 * time.Second
	}

	return &MetricsCollector{
		metrics:       make(map[string][]float64),
		rawMetrics:    make([]*models.RequestMetrics, 0, 10000),
		testID:        testID,
		windowStart:   time.Now(),
		percentiles:   percentiles,
		windowSeconds: int(interval.Seconds()),
	}
}

func (mc *MetricsCollector) Collect(metric *models.RequestMetrics) {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	mc.rawMetrics = append(mc.rawMetrics, metric)

	mc.metrics["ttft"] = append(mc.metrics["ttft"], metric.TTFT)
	mc.metrics["tpot"] = append(mc.metrics["tpot"], metric.TPOT)
	mc.metrics["total"] = append(mc.metrics["total"], metric.TotalLatency)
	mc.metrics["length"] = append(mc.metrics["length"], float64(metric.ResponseLength))
	mc.metrics["tokens"] = append(mc.metrics["tokens"], float64(metric.TokenCount))
}

func (mc *MetricsCollector) Aggregate() *models.AggregatedMetrics {
	mc.mu.RLock()
	defer mc.mu.RUnlock()

	totalRequests := len(mc.rawMetrics)
	if totalRequests == 0 {
		return nil
	}

	now := time.Now()
	elapsed := now.Sub(mc.windowStart).Seconds()
	if elapsed < 1 {
		elapsed = 1
	}

	var successCount, failedCount int64
	var totalRetryCount int
	statusCodes := make(map[int]int64)
	errorTypes := make(map[string]int64)

	for _, m := range mc.rawMetrics {
		if m.Success {
			successCount++
		} else {
			failedCount++
			if m.ErrorType != "" {
				errorTypes[m.ErrorType]++
			}
		}
		statusCodes[m.StatusCode]++
		totalRetryCount += m.RetryCount
	}

	errorRate := float64(failedCount) / float64(totalRequests) * 100
	actualQPS := float64(totalRequests) / elapsed

	aggregated := &models.AggregatedMetrics{
		TestID:            mc.testID,
		Timestamp:         now,
		WindowSeconds:     mc.windowSeconds,
		TotalRequests:     int64(totalRequests),
		SuccessRequests:   successCount,
		FailedRequests:    failedCount,
		ErrorRate:         errorRate,
		ActualQPS:         actualQPS,
		TTFTPercentiles:   mc.calculatePercentiles("ttft"),
		TPOTPercentiles:   mc.calculatePercentiles("tpot"),
		TotalPercentiles:  mc.calculatePercentiles("total"),
		LengthPercentiles: mc.calculatePercentiles("length"),
		TokenPercentiles:  mc.calculatePercentiles("tokens"),
		StatusCodes:       statusCodes,
		ErrorTypes:        errorTypes,
		AverageRetryCount: float64(totalRetryCount) / float64(totalRequests),
	}

	return aggregated
}

func (mc *MetricsCollector) calculatePercentiles(key string) map[string]float64 {
	values, exists := mc.metrics[key]
	if !exists || len(values) == 0 {
		return nil
	}

	sorted := make([]float64, len(values))
	copy(sorted, values)
	sort.Float64s(sorted)

	result := make(map[string]float64)
	for _, p := range mc.percentiles {
		result[percentileKey(p)] = calculatePercentile(sorted, p)
	}

	return result
}

func calculatePercentile(sortedValues []float64, percentile int) float64 {
	if len(sortedValues) == 0 {
		return 0
	}
	if len(sortedValues) == 1 {
		return sortedValues[0]
	}

	index := (float64(percentile) / 100.0) * float64(len(sortedValues)-1)
	lower := int(math.Floor(index))
	upper := int(math.Ceil(index))

	if lower == upper {
		return sortedValues[lower]
	}

	weight := index - float64(lower)
	return sortedValues[lower]*(1-weight) + sortedValues[upper]*weight
}

func percentileKey(p int) string {
	return "P" + string(rune('0'+p/10)) + string(rune('0'+p%10))
}

func (mc *MetricsCollector) ResetWindow() {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	mc.metrics = make(map[string][]float64)
	mc.rawMetrics = mc.rawMetrics[:0]
	mc.windowStart = time.Now()
}

func (mc *MetricsCollector) GetFinalResult(config models.LoadTestConfig) *models.TestResult {
	mc.mu.RLock()
	defer mc.mu.RUnlock()

	if len(mc.rawMetrics) == 0 {
		return nil
	}

	var startTime, endTime time.Time
	var successCount, failedCount int64
	statusCodes := make(map[int]int64)
	errorTypes := make(map[string]int64)

	var allTTFT, allTPOT, allTotal, allLength, allTokens []float64

	for i, m := range mc.rawMetrics {
		if i == 0 {
			startTime = m.Timestamp
		}
		endTime = m.Timestamp

		if m.Success {
			successCount++
		} else {
			failedCount++
			if m.ErrorType != "" {
				errorTypes[m.ErrorType]++
			}
		}
		statusCodes[m.StatusCode]++

		allTTFT = append(allTTFT, m.TTFT)
		allTPOT = append(allTPOT, m.TPOT)
		allTotal = append(allTotal, m.TotalLatency)
		allLength = append(allLength, float64(m.ResponseLength))
		allTokens = append(allTokens, float64(m.TokenCount))
	}

	duration := endTime.Sub(startTime).Seconds()
	if duration < 1 {
		duration = 1
	}

	totalRequests := len(mc.rawMetrics)

	return &models.TestResult{
		TestID:          mc.testID,
		Config:          config,
		StartTime:       startTime,
		EndTime:         endTime,
		DurationSeconds: duration,
		TotalRequests:   int64(totalRequests),
		SuccessRequests: successCount,
		FailedRequests:  failedCount,
		ErrorRate:       float64(failedCount) / float64(totalRequests) * 100,
		AverageQPS:      float64(totalRequests) / duration,
		TTFT:            calcPercentileData(allTTFT),
		TPOT:            calcPercentileData(allTPOT),
		TotalLatency:    calcPercentileData(allTotal),
		ResponseLength:  calcPercentileData(allLength),
		TokenCount:      calcPercentileData(allTokens),
		StatusCodes:     statusCodes,
		ErrorTypes:      errorTypes,
	}
}

func calcPercentileData(values []float64) models.PercentileData {
	if len(values) == 0 {
		return models.PercentileData{}
	}

	sorted := make([]float64, len(values))
	copy(sorted, values)
	sort.Float64s(sorted)

	var sum float64
	for _, v := range sorted {
		sum += v
	}

	return models.PercentileData{
		Min: sorted[0],
		Max: sorted[len(sorted)-1],
		Avg: sum / float64(len(sorted)),
		P50: calculatePercentile(sorted, 50),
		P90: calculatePercentile(sorted, 90),
		P95: calculatePercentile(sorted, 95),
		P99: calculatePercentile(sorted, 99),
	}
}

func StartAggregationRoutine(
	ctx context.Context,
	collector *MetricsCollector,
	pushInterval time.Duration,
	pushCallback func(*models.AggregatedMetrics),
) {
	ticker := time.NewTicker(pushInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			aggregated := collector.Aggregate()
			if aggregated != nil {
				pushCallback(aggregated)
			}
			collector.ResetWindow()
		}
	}
}
