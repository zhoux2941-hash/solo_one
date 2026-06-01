package worker

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"llm-load-test/internal/models"
)

type Worker struct {
	ID           string
	TestID       string
	BaseURL      string
	APIKey       string
	Client       *http.Client
	Status       string
	mu           sync.Mutex
	requestCount int64
}

type Task struct {
	RequestLog *models.RequestLog
	StartTime  time.Time
	Target     models.ABTestTarget
}

type WorkerMetricsCallback func(*models.RequestMetrics)

func NewWorker(testID, baseURL, apiKey string, timeout time.Duration) *Worker {
	if timeout == 0 {
		timeout = 120 * time.Second
	}
	return &Worker{
		ID:     uuid.New().String(),
		TestID: testID,
		BaseURL: baseURL,
		APIKey: apiKey,
		Client: &http.Client{
			Timeout: timeout,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 100,
				IdleConnTimeout:     90 * time.Second,
			},
		},
		Status: "ready",
	}
}

func (w *Worker) ProcessTask(ctx context.Context, task *Task, maxRetries int) *models.RequestMetrics {
	w.mu.Lock()
	w.requestCount++
	w.mu.Unlock()

	retryCount := 0
	var lastErr error

	for retryCount <= maxRetries {
		metrics := w.executeRequest(ctx, task.RequestLog)
		metrics.RetryCount = retryCount
		metrics.RequestID = task.RequestLog.ID
		metrics.Target = task.Target

		if metrics.Success {
			return metrics
		}

		retryCount++
		lastErr = fmt.Errorf("%s: %s", metrics.ErrorType, metrics.ErrorMessage)

		if retryCount <= maxRetries {
			backoff := time.Duration(retryCount*retryCount) * 100 * time.Millisecond
			select {
			case <-ctx.Done():
				metrics.ErrorType = "cancelled"
				metrics.ErrorMessage = ctx.Err().Error()
				return metrics
			case <-time.After(backoff):
			}
		}
	}

	metrics := &models.RequestMetrics{
		TestID:       w.TestID,
		WorkerID:     w.ID,
		Timestamp:    time.Now(),
		Success:      false,
		ErrorType:    "max_retries_exceeded",
		ErrorMessage: fmt.Sprintf("Max retries exceeded: %v", lastErr),
		RetryCount:   retryCount,
	}
	return metrics
}

func (w *Worker) executeRequest(ctx context.Context, log *models.RequestLog) *models.RequestMetrics {
	metrics := &models.RequestMetrics{
		TestID:         w.TestID,
		WorkerID:       w.ID,
		Timestamp:      time.Now(),
		CompletionType: log.CompletionType,
	}

	var url string
	var payload interface{}

	switch log.CompletionType {
	case models.ChatCompletion:
		url = fmt.Sprintf("%s/v1/chat/completions", w.BaseURL)
		payload = w.buildChatCompletionPayload(log)
	case models.TextCompletion:
		url = fmt.Sprintf("%s/v1/completions", w.BaseURL)
		payload = w.buildTextCompletionPayload(log)
	default:
		metrics.ErrorType = "invalid_completion_type"
		metrics.ErrorMessage = fmt.Sprintf("Unknown completion type: %s", log.CompletionType)
		return metrics
	}

	body, err := json.Marshal(payload)
	if err != nil {
		metrics.ErrorType = "payload_error"
		metrics.ErrorMessage = err.Error()
		return metrics
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(body))
	if err != nil {
		metrics.ErrorType = "request_error"
		metrics.ErrorMessage = err.Error()
		return metrics
	}

	req.Header.Set("Content-Type", "application/json")
	if w.APIKey != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", w.APIKey))
	}
	for k, v := range log.Headers {
		req.Header.Set(k, v)
	}

	startTime := time.Now()
	firstTokenTime := time.Time{}
	var lastTokenTime time.Time
	tokenCount := 0

	if log.Stream {
		return w.executeStreamRequest(req, startTime, metrics, &firstTokenTime, &lastTokenTime, &tokenCount)
	}

	return w.executeNonStreamRequest(req, startTime, metrics)
}

func (w *Worker) buildChatCompletionPayload(log *models.RequestLog) map[string]interface{} {
	payload := map[string]interface{}{
		"model":    log.Model,
		"messages": log.Messages,
		"stream":   log.Stream,
	}
	if log.Temperature != nil {
		payload["temperature"] = *log.Temperature
	}
	if log.MaxTokens != nil {
		payload["max_tokens"] = *log.MaxTokens
	}
	if log.TopP != nil {
		payload["top_p"] = *log.TopP
	}
	if log.FrequencyPenalty != nil {
		payload["frequency_penalty"] = *log.FrequencyPenalty
	}
	if log.PresencePenalty != nil {
		payload["presence_penalty"] = *log.PresencePenalty
	}
	return payload
}

func (w *Worker) buildTextCompletionPayload(log *models.RequestLog) map[string]interface{} {
	payload := map[string]interface{}{
		"model":  log.Model,
		"prompt": log.Prompt,
		"stream": log.Stream,
	}
	if log.Temperature != nil {
		payload["temperature"] = *log.Temperature
	}
	if log.MaxTokens != nil {
		payload["max_tokens"] = *log.MaxTokens
	}
	return payload
}

func (w *Worker) executeStreamRequest(
	req *http.Request,
	startTime time.Time,
	metrics *models.RequestMetrics,
	firstTokenTime *time.Time,
	lastTokenTime *time.Time,
	tokenCount *int,
) *models.RequestMetrics {
	resp, err := w.Client.Do(req)
	if err != nil {
		metrics.ErrorType = "connection_error"
		metrics.ErrorMessage = err.Error()
		metrics.TotalLatency = float64(time.Since(startTime).Milliseconds())
		return metrics
	}
	defer resp.Body.Close()

	metrics.StatusCode = resp.StatusCode
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		metrics.Success = false
		metrics.ErrorType = "http_error"
		metrics.ErrorMessage = string(body)
		metrics.TotalLatency = float64(time.Since(startTime).Milliseconds())
		return metrics
	}

	var fullResponse string
	decoder := NewStreamDecoder(resp.Body)

	for {
		chunk, err := decoder.Decode()
		if err != nil {
			if err == io.EOF {
				break
			}
			metrics.ErrorType = "stream_error"
			metrics.ErrorMessage = err.Error()
			metrics.TotalLatency = float64(time.Since(startTime).Milliseconds())
			return metrics
		}

		if firstTokenTime.IsZero() && chunk.HasContent() {
			*firstTokenTime = time.Now()
			metrics.TTFT = float64(firstTokenTime.Sub(startTime).Milliseconds())
		}

		if chunk.HasContent() {
			*tokenCount++
			*lastTokenTime = time.Now()
			fullResponse += chunk.Content
		}
	}

	endTime := time.Now()
	metrics.TotalLatency = float64(endTime.Sub(startTime).Milliseconds())

	if *tokenCount > 1 {
		firstTokenLatency := firstTokenTime.Sub(startTime)
		remainingLatency := endTime.Sub(*firstTokenTime)
		metrics.TPOT = float64(remainingLatency.Milliseconds()) / float64(*tokenCount-1)
	} else if *tokenCount == 1 {
		metrics.TPOT = 0
	}

	metrics.ResponseLength = len(fullResponse)
	metrics.TokenCount = *tokenCount
	metrics.OutputTokens = *tokenCount
	metrics.Success = true

	return metrics
}

func (w *Worker) executeNonStreamRequest(
	req *http.Request,
	startTime time.Time,
	metrics *models.RequestMetrics,
) *models.RequestMetrics {
	resp, err := w.Client.Do(req)
	if err != nil {
		metrics.ErrorType = "connection_error"
		metrics.ErrorMessage = err.Error()
		metrics.TotalLatency = float64(time.Since(startTime).Milliseconds())
		return metrics
	}
	defer resp.Body.Close()

	metrics.StatusCode = resp.StatusCode
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		metrics.Success = false
		metrics.ErrorType = "http_error"
		metrics.ErrorMessage = string(body)
		metrics.TotalLatency = float64(time.Since(startTime).Milliseconds())
		return metrics
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		metrics.ErrorType = "read_error"
		metrics.ErrorMessage = err.Error()
		metrics.TotalLatency = float64(time.Since(startTime).Milliseconds())
		return metrics
	}

	endTime := time.Now()
	metrics.TotalLatency = float64(endTime.Sub(startTime).Milliseconds())
	metrics.TTFT = metrics.TotalLatency

	var response struct {
		Choices []struct {
			Text         string `json:"text"`
			Message      struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Usage struct {
			PromptTokens     int `json:"prompt_tokens"`
			CompletionTokens int `json:"completion_tokens"`
			TotalTokens      int `json:"total_tokens"`
		} `json:"usage"`
	}

	if err := json.Unmarshal(body, &response); err == nil {
		metrics.PromptTokens = response.Usage.PromptTokens
		metrics.OutputTokens = response.Usage.CompletionTokens
		metrics.TokenCount = response.Usage.TotalTokens

		for _, choice := range response.Choices {
			if choice.Message.Content != "" {
				metrics.ResponseLength += len(choice.Message.Content)
			}
			if choice.Text != "" {
				metrics.ResponseLength += len(choice.Text)
			}
		}
	}

	metrics.Success = true
	return metrics
}

func (w *Worker) GetStatus() *models.WorkerStatus {
	w.mu.Lock()
	defer w.mu.Unlock()
	return &models.WorkerStatus{
		ID:            w.ID,
		TestID:        w.TestID,
		Status:        w.Status,
		TotalRequests: w.requestCount,
		LastHeartbeat: time.Now(),
	}
}

type WorkerPool struct {
	workers     map[string]*Worker
	mu          sync.RWMutex
	testID      string
	baseURL     string
	apiKey      string
	timeout     time.Duration
	maxRetries  int
}

func NewWorkerPool(testID, baseURL, apiKey string, timeout time.Duration, maxRetries int) *WorkerPool {
	return &WorkerPool{
		workers:    make(map[string]*Worker),
		testID:     testID,
		baseURL:    baseURL,
		apiKey:     apiKey,
		timeout:    timeout,
		maxRetries: maxRetries,
	}
}

func (wp *WorkerPool) ScaleUp(count int) []string {
	wp.mu.Lock()
	defer wp.mu.Unlock()

	newIDs := make([]string, 0, count)
	for i := 0; i < count; i++ {
		worker := NewWorker(wp.testID, wp.baseURL, wp.apiKey, wp.timeout)
		wp.workers[worker.ID] = worker
		newIDs = append(newIDs, worker.ID)
	}
	return newIDs
}

func (wp *WorkerPool) ScaleDown(count int) []string {
	wp.mu.Lock()
	defer wp.mu.Unlock()

	removedIDs := make([]string, 0, count)
	for id := range wp.workers {
		if len(removedIDs) >= count {
			break
		}
		delete(wp.workers, id)
		removedIDs = append(removedIDs, id)
	}
	return removedIDs
}

func (wp *WorkerPool) GetWorker(id string) (*Worker, bool) {
	wp.mu.RLock()
	defer wp.mu.RUnlock()
	worker, exists := wp.workers[id]
	return worker, exists
}

func (wp *WorkerPool) GetAllWorkers() []*Worker {
	wp.mu.RLock()
	defer wp.mu.RUnlock()
	workers := make([]*Worker, 0, len(wp.workers))
	for _, w := range wp.workers {
		workers = append(workers, w)
	}
	return workers
}

func (wp *WorkerPool) Size() int {
	wp.mu.RLock()
	defer wp.mu.RUnlock()
	return len(wp.workers)
}

func (wp *WorkerPool) Close() {
	wp.mu.Lock()
	defer wp.mu.Unlock()
	wp.workers = make(map[string]*Worker)
}

func (wp *WorkerPool) GetWorkerStatuses() []*models.WorkerStatus {
	wp.mu.RLock()
	defer wp.mu.RUnlock()
	statuses := make([]*models.WorkerStatus, 0, len(wp.workers))
	for _, w := range wp.workers {
		statuses = append(statuses, w.GetStatus())
	}
	return statuses
}
