package orchestrator

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"llm-load-test/internal/collector"
	"llm-load-test/internal/models"
	"llm-load-test/internal/worker"
	ws "llm-load-test/internal/websocket"
)

type Orchestrator struct {
	tests        map[string]*LoadTestRunner
	mu           sync.RWMutex
	wsServer     *ws.Server
	kafkaLogs    <-chan *models.RequestLog
}

type LoadTestRunner struct {
	Test         *models.LoadTest
	Config       models.LoadTestConfig
	WorkerPool   *worker.WorkerPool
	Collector    *collector.MetricsCollector
	Ctx          context.Context
	Cancel       context.CancelFunc
	TaskQueue    chan *worker.Task
	MetricsChan  chan *models.RequestMetrics
	mu           sync.Mutex
	wg           sync.WaitGroup
	modeEngine   ModeEngine
	startTime    time.Time
	preloadedLogs []*worker.Task
}

type ModeEngine interface {
	Start(ctx context.Context, runner *LoadTestRunner) error
	GetCurrentQPS(elapsed time.Duration) float64
}

func NewOrchestrator(wsServer *ws.Server, kafkaLogs <-chan *models.RequestLog) *Orchestrator {
	return &Orchestrator{
		tests:     make(map[string]*LoadTestRunner),
		wsServer:  wsServer,
		kafkaLogs: kafkaLogs,
	}
}

func (o *Orchestrator) StartTest(config models.LoadTestConfig) (*models.LoadTest, error) {
	o.mu.Lock()
	defer o.mu.Unlock()

	testID := uuid.New().String()
	config.ID = testID

	now := time.Now()
	test := &models.LoadTest{
		ID:        testID,
		Config:    config,
		Status:    models.StatusPending,
		CreatedAt: now,
		UpdatedAt: now,
	}

	timeout := time.Duration(config.RequestTimeout) * time.Second
	if timeout == 0 {
		timeout = 120 * time.Second
	}
	maxRetries := config.MaxRetries
	if maxRetries == 0 {
		maxRetries = 3
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(config.Duration)*time.Second)

	workerPool := worker.NewWorkerPool(
		testID,
		config.TargetURL,
		config.APIKey,
		timeout,
		maxRetries,
	)
	workerPool.ScaleUp(config.WorkerCount)

	workerIDs := make([]string, 0, config.WorkerCount)
	for _, w := range workerPool.GetAllWorkers() {
		workerIDs = append(workerIDs, w.ID)
	}
	test.WorkerIDs = workerIDs

	runner := &LoadTestRunner{
		Test:        test,
		Config:      config,
		WorkerPool:  workerPool,
		Collector:   collector.NewMetricsCollector(testID),
		Ctx:         ctx,
		Cancel:      cancel,
		TaskQueue:   make(chan *worker.Task, 10000),
		MetricsChan: make(chan *models.RequestMetrics, 10000),
	}

	if err := runner.initModeEngine(); err != nil {
		cancel()
		return nil, err
	}

	o.tests[testID] = runner
	go o.runTest(runner)

	return test, nil
}

func (o *Orchestrator) StartTestWithPreloadedLogs(config models.LoadTestConfig, preloadedLogs []*worker.Task) (*models.LoadTest, error) {
	o.mu.Lock()
	defer o.mu.Unlock()

	testID := uuid.New().String()
	config.ID = testID

	now := time.Now()
	test := &models.LoadTest{
		ID:        testID,
		Config:    config,
		Status:    models.StatusPending,
		CreatedAt: now,
		UpdatedAt: now,
	}

	timeout := time.Duration(config.RequestTimeout) * time.Second
	if timeout == 0 {
		timeout = 120 * time.Second
	}
	maxRetries := config.MaxRetries
	if maxRetries == 0 {
		maxRetries = 3
	}

	testDuration := config.Duration
	if testDuration == 0 {
		testDuration = 3600
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(testDuration)*time.Second)

	workerPool := worker.NewWorkerPool(
		testID,
		config.TargetURL,
		config.APIKey,
		timeout,
		maxRetries,
	)
	workerPool.ScaleUp(config.WorkerCount)

	workerIDs := make([]string, 0, config.WorkerCount)
	for _, w := range workerPool.GetAllWorkers() {
		workerIDs = append(workerIDs, w.ID)
	}
	test.WorkerIDs = workerIDs

	runner := &LoadTestRunner{
		Test:          test,
		Config:        config,
		WorkerPool:    workerPool,
		Collector:     collector.NewMetricsCollector(testID),
		Ctx:           ctx,
		Cancel:        cancel,
		TaskQueue:     make(chan *worker.Task, len(preloadedLogs)+1000),
		MetricsChan:   make(chan *models.RequestMetrics, 10000),
		preloadedLogs: preloadedLogs,
	}

	if err := runner.initModeEngine(preloadedLogs); err != nil {
		cancel()
		return nil, err
	}

	o.tests[testID] = runner
	go o.runTestWithPreloadedLogs(runner)

	return test, nil
}

func (o *Orchestrator) runTestWithPreloadedLogs(runner *LoadTestRunner) {
	runner.Test.Status = models.StatusRunning
	now := time.Now()
	runner.Test.StartTime = &now
	runner.Test.UpdatedAt = now
	runner.startTime = now

	o.wsServer.BroadcastTestStatus(runner.Test)

	pushInterval := 5 * time.Second
	go collector.StartAggregationRoutine(
		runner.Ctx,
		runner.Collector,
		pushInterval,
		func(agg *models.AggregatedMetrics) {
			agg.TargetQPS = runner.modeEngine.GetCurrentQPS(time.Since(runner.startTime))
			o.wsServer.BroadcastMetrics(agg)
		},
	)

	go o.processMetrics(runner)
	go o.startWorkers(runner)
	go o.reportWorkerStatus(runner)

	if err := runner.modeEngine.Start(runner.Ctx, runner); err != nil {
		runner.Test.Error = err.Error()
	}

	<-runner.Ctx.Done()

	runner.mu.Lock()
	if runner.Test.Status == models.StatusRunning {
		runner.Test.Status = models.StatusCompleted
	}
	now = time.Now()
	runner.Test.EndTime = &now
	runner.Test.UpdatedAt = now
	runner.mu.Unlock()

	close(runner.TaskQueue)
	runner.wg.Wait()
	close(runner.MetricsChan)

	runner.WorkerPool.Close()

	o.wsServer.BroadcastTestStatus(runner.Test)
}

func (o *Orchestrator) runTest(runner *LoadTestRunner) {
	runner.Test.Status = models.StatusRunning
	now := time.Now()
	runner.Test.StartTime = &now
	runner.Test.UpdatedAt = now
	runner.startTime = now

	o.wsServer.BroadcastTestStatus(runner.Test)

	pushInterval := 5 * time.Second
	go collector.StartAggregationRoutine(
		runner.Ctx,
		runner.Collector,
		pushInterval,
		func(agg *models.AggregatedMetrics) {
			agg.TargetQPS = runner.modeEngine.GetCurrentQPS(time.Since(runner.startTime))
			o.wsServer.BroadcastMetrics(agg)
		},
	)

	go o.processMetrics(runner)
	go o.distributeTasks(runner)
	go o.startWorkers(runner)
	go o.reportWorkerStatus(runner)

	if err := runner.modeEngine.Start(runner.Ctx, runner); err != nil {
		runner.Test.Error = err.Error()
	}

	<-runner.Ctx.Done()

	runner.mu.Lock()
	if runner.Test.Status == models.StatusRunning {
		runner.Test.Status = models.StatusCompleted
	}
	now = time.Now()
	runner.Test.EndTime = &now
	runner.Test.UpdatedAt = now
	runner.mu.Unlock()

	close(runner.TaskQueue)
	runner.wg.Wait()
	close(runner.MetricsChan)

	runner.WorkerPool.Close()

	o.wsServer.BroadcastTestStatus(runner.Test)
}

func (o *Orchestrator) processMetrics(runner *LoadTestRunner) {
	for metrics := range runner.MetricsChan {
		runner.Collector.Collect(metrics)
	}
}

func (o *Orchestrator) distributeTasks(runner *LoadTestRunner) {
	var logsBuffer []*models.RequestLog
	bufferMu := sync.Mutex{}

	go func() {
		for log := range o.kafkaLogs {
			bufferMu.Lock()
			if len(logsBuffer) < 10000 {
				logsBuffer = append(logsBuffer, log)
			}
			bufferMu.Unlock()
		}
	}()

	logIndex := 0
	ticker := time.NewTicker(1 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-runner.Ctx.Done():
			return
		case <-ticker.C:
			bufferMu.Lock()
			if logIndex >= len(logsBuffer) {
				bufferMu.Unlock()
				if len(logsBuffer) == 0 {
					time.Sleep(10 * time.Millisecond)
				}
				continue
			}
			log := logsBuffer[logIndex]
			logIndex++
			bufferMu.Unlock()

			task := &worker.Task{
				RequestLog: log,
				StartTime:  time.Now(),
			}

			select {
			case runner.TaskQueue <- task:
			case <-runner.Ctx.Done():
				return
			}
		}
	}
}

func (o *Orchestrator) startWorkers(runner *LoadTestRunner) {
	workers := runner.WorkerPool.GetAllWorkers()
	for _, w := range workers {
		runner.wg.Add(1)
		go func(wr *worker.Worker) {
			defer runner.wg.Done()
			for task := range runner.TaskQueue {
				metrics := wr.ProcessTask(runner.Ctx, task, runner.Config.MaxRetries)
				select {
				case runner.MetricsChan <- metrics:
				case <-runner.Ctx.Done():
					return
				}
			}
		}(w)
	}
}

func (o *Orchestrator) reportWorkerStatus(runner *LoadTestRunner) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-runner.Ctx.Done():
			return
		case <-ticker.C:
			statuses := runner.WorkerPool.GetWorkerStatuses()
			for _, status := range statuses {
				o.wsServer.BroadcastWorkerStatus(status)
			}
		}
	}
}

func (o *Orchestrator) StopTest(testID string) error {
	o.mu.RLock()
	runner, exists := o.tests[testID]
	o.mu.RUnlock()

	if !exists {
		return fmt.Errorf("test not found: %s", testID)
	}

	runner.mu.Lock()
	runner.Test.Status = models.StatusStopped
	now := time.Now()
	runner.Test.EndTime = &now
	runner.Test.UpdatedAt = now
	runner.mu.Unlock()

	runner.Cancel()
	o.wsServer.BroadcastTestStatus(runner.Test)

	return nil
}

func (o *Orchestrator) ScaleWorkers(testID string, newCount int) error {
	o.mu.RLock()
	runner, exists := o.tests[testID]
	o.mu.RUnlock()

	if !exists {
		return fmt.Errorf("test not found: %s", testID)
	}

	currentCount := runner.WorkerPool.Size()
	if newCount > currentCount {
		newIDs := runner.WorkerPool.ScaleUp(newCount - currentCount)
		for _, id := range newIDs {
			w, _ := runner.WorkerPool.GetWorker(id)
			runner.wg.Add(1)
			go func(wr *worker.Worker) {
				defer runner.wg.Done()
				for task := range runner.TaskQueue {
					metrics := wr.ProcessTask(runner.Ctx, task, runner.Config.MaxRetries)
					select {
					case runner.MetricsChan <- metrics:
					case <-runner.Ctx.Done():
						return
					}
				}
			}(w)
		}
	} else if newCount < currentCount {
		runner.WorkerPool.ScaleDown(currentCount - newCount)
	}

	runner.mu.Lock()
	workerIDs := make([]string, 0, runner.WorkerPool.Size())
	for _, w := range runner.WorkerPool.GetAllWorkers() {
		workerIDs = append(workerIDs, w.ID)
	}
	runner.Test.WorkerIDs = workerIDs
	runner.Test.Config.WorkerCount = newCount
	runner.Test.UpdatedAt = time.Now()
	runner.mu.Unlock()

	o.wsServer.BroadcastTestStatus(runner.Test)
	return nil
}

func (o *Orchestrator) GetTest(testID string) (*models.LoadTest, error) {
	o.mu.RLock()
	defer o.mu.RUnlock()

	runner, exists := o.tests[testID]
	if !exists {
		return nil, fmt.Errorf("test not found: %s", testID)
	}
	return runner.Test, nil
}

func (o *Orchestrator) GetAllTests() []*models.LoadTest {
	o.mu.RLock()
	defer o.mu.RUnlock()

	tests := make([]*models.LoadTest, 0, len(o.tests))
	for _, runner := range o.tests {
		tests = append(tests, runner.Test)
	}
	return tests
}

func (o *Orchestrator) GetTestResult(testID string) (*models.TestResult, error) {
	o.mu.RLock()
	runner, exists := o.tests[testID]
	o.mu.RUnlock()

	if !exists {
		return nil, fmt.Errorf("test not found: %s", testID)
	}

	if runner.Test.Status != models.StatusCompleted && runner.Test.Status != models.StatusStopped {
		return nil, fmt.Errorf("test not finished")
	}

	result := runner.Collector.GetFinalResult(runner.Config)

	metricsHistory := o.wsServer.GetTestMetrics(testID)
	timeSeries := make([]models.TimeSeriesPoint, 0, len(metricsHistory))
	for _, m := range metricsHistory {
		point := models.TimeSeriesPoint{
			Timestamp:       m.Timestamp,
			QPS:             m.ActualQPS,
			ErrorRate:       m.ErrorRate,
			TTFTP95:         m.TTFTPercentiles["P95"],
			TPOTP95:         m.TPOTPercentiles["P95"],
			TotalLatencyP95: m.TotalPercentiles["P95"],
		}
		timeSeries = append(timeSeries, point)
	}
	result.TimeSeries = timeSeries

	return result, nil
}

func (r *LoadTestRunner) initModeEngine(preloadedLogs ...[]*worker.Task) error {
	if len(preloadedLogs) > 0 && len(preloadedLogs[0]) > 0 {
		r.preloadedLogs = preloadedLogs[0]
		r.modeEngine = NewReplayEngineWithLogs(r.Config.ReplaySpeed, r.preloadedLogs)
		return nil
	}

	switch r.Config.Mode {
	case models.FixedQPSMode:
		r.modeEngine = NewFixedQPSEngine(r.Config.FixedQPS)
	case models.LinearGrowthMode:
		r.modeEngine = NewLinearGrowthEngine(
			r.Config.LinearStartQPS,
			r.Config.LinearEndQPS,
			r.Config.Duration,
		)
	case models.BurstMode:
		baseQPS := r.Config.FixedQPS
		if baseQPS == 0 {
			baseQPS = 10
		}
		r.modeEngine = NewBurstEngine(
			baseQPS,
			r.Config.BurstMultiplier,
			time.Duration(r.Config.BurstAtSeconds)*time.Second,
		)
	case models.ReplayMode:
		speed := r.Config.ReplaySpeed
		if speed == 0 {
			speed = 1.0
		}
		r.modeEngine = NewReplayEngine(speed)
	default:
		return fmt.Errorf("unknown mode: %s", r.Config.Mode)
	}
	return nil
}
