package orchestrator

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"
	"llm-load-test/internal/collector"
	"llm-load-test/internal/models"
	"llm-load-test/internal/worker"
	ws "llm-load-test/internal/websocket"
)

type ABTestOrchestrator struct {
	abTests    map[string]*ABTestRunner
	mu         sync.RWMutex
	wsServer   *ws.Server
	kafkaLogs  <-chan *models.RequestLog
}

type ABTestRunner struct {
	Test            *models.ABTestResult
	Config          models.ABTestConfig
	WorkerPoolA     *worker.WorkerPool
	WorkerPoolB     *worker.WorkerPool
	CollectorA      *collector.MetricsCollector
	CollectorB      *collector.MetricsCollector
	Ctx             context.Context
	Cancel          context.CancelFunc
	TaskQueueA      chan *worker.Task
	TaskQueueB      chan *worker.Task
	MetricsChanA    chan *models.RequestMetrics
	MetricsChanB    chan *models.RequestMetrics
	mu              sync.Mutex
	wg              sync.WaitGroup
	modeEngine      ModeEngine
	startTime       time.Time
	preloadedLogs   []*worker.Task
}

func NewABTestOrchestrator(wsServer *ws.Server, kafkaLogs <-chan *models.RequestLog) *ABTestOrchestrator {
	return &ABTestOrchestrator{
		abTests:   make(map[string]*ABTestRunner),
		wsServer:  wsServer,
		kafkaLogs: kafkaLogs,
	}
}

func (o *ABTestOrchestrator) StartABTest(config models.ABTestConfig, preloadedLogs []*worker.Task) (*models.ABTestResult, error) {
	o.mu.Lock()
	defer o.mu.Unlock()

	testID := config.ID
	if testID == "" {
		testID = uuid.New().String()
	}
	config.ID = testID

	now := time.Now()
	test := &models.ABTestResult{
		ID:        testID,
		Config:    config,
		Status:    models.StatusPending,
		CreatedAt: now,
	}

	timeout := time.Duration(config.ConfigA.RequestTimeout) * time.Second
	if timeout == 0 {
		timeout = 120 * time.Second
	}
	maxRetries := config.ConfigA.MaxRetries
	if maxRetries == 0 {
		maxRetries = 3
	}

	testDuration := config.ConfigA.Duration
	if testDuration == 0 {
		testDuration = 3600
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(testDuration)*time.Second)

	workerPoolA := worker.NewWorkerPool(
		testID+"-a",
		config.ConfigA.TargetURL,
		config.ConfigA.APIKey,
		timeout,
		maxRetries,
	)
	workerPoolA.ScaleUp(config.ConfigA.WorkerCount)

	workerPoolB := worker.NewWorkerPool(
		testID+"-b",
		config.ConfigB.TargetURL,
		config.ConfigB.APIKey,
		timeout,
		maxRetries,
	)
	workerPoolB.ScaleUp(config.ConfigB.WorkerCount)

	runner := &ABTestRunner{
		Test:          test,
		Config:        config,
		WorkerPoolA:   workerPoolA,
		WorkerPoolB:   workerPoolB,
		CollectorA:    collector.NewMetricsCollector(testID + "-a"),
		CollectorB:    collector.NewMetricsCollector(testID + "-b"),
		Ctx:           ctx,
		Cancel:        cancel,
		TaskQueueA:    make(chan *worker.Task, len(preloadedLogs)+1000),
		TaskQueueB:    make(chan *worker.Task, len(preloadedLogs)+1000),
		MetricsChanA:  make(chan *models.RequestMetrics, 10000),
		MetricsChanB:  make(chan *models.RequestMetrics, 10000),
		preloadedLogs: preloadedLogs,
	}

	if err := runner.initModeEngine(preloadedLogs); err != nil {
		cancel()
		return nil, err
	}

	o.abTests[testID] = runner
	go o.runABTest(runner)

	return test, nil
}

func (r *ABTestRunner) initModeEngine(preloadedLogs []*worker.Task) error {
	if len(preloadedLogs) > 0 {
		r.preloadedLogs = preloadedLogs
		r.modeEngine = NewReplayEngineWithLogs(r.Config.ConfigA.ReplaySpeed, r.preloadedLogs)
		return nil
	}

	switch r.Config.ConfigA.Mode {
	case models.FixedQPSMode:
		r.modeEngine = NewFixedQPSEngine(r.Config.ConfigA.FixedQPS)
	case models.LinearGrowthMode:
		r.modeEngine = NewLinearGrowthEngine(
			r.Config.ConfigA.LinearStartQPS,
			r.Config.ConfigA.LinearEndQPS,
			r.Config.ConfigA.Duration,
		)
	case models.BurstMode:
		baseQPS := r.Config.ConfigA.FixedQPS
		if baseQPS == 0 {
			baseQPS = 10
		}
		r.modeEngine = NewBurstEngine(
			baseQPS,
			r.Config.ConfigA.BurstMultiplier,
			time.Duration(r.Config.ConfigA.BurstAtSeconds)*time.Second,
		)
	case models.ReplayMode:
		speed := r.Config.ConfigA.ReplaySpeed
		if speed == 0 {
			speed = 1.0
		}
		r.modeEngine = NewReplayEngine(speed)
	default:
		return nil
	}
	return nil
}

func (o *ABTestOrchestrator) runABTest(runner *ABTestRunner) {
	runner.Test.Status = models.StatusRunning
	now := time.Now()
	runner.Test.StartTime = &now
	runner.startTime = now

	o.wsServer.BroadcastTestStatus(&models.LoadTest{
		ID:     runner.Test.ID,
		Status: runner.Test.Status,
		Config: runner.Config.ConfigA,
	})

	pushInterval := 5 * time.Second

	go collector.StartAggregationRoutine(
		runner.Ctx,
		runner.CollectorA,
		pushInterval,
		func(agg *models.AggregatedMetrics) {
			agg.TargetQPS = runner.modeEngine.GetCurrentQPS(time.Since(runner.startTime))
			o.wsServer.BroadcastMetrics(agg)
		},
	)

	go collector.StartAggregationRoutine(
		runner.Ctx,
		runner.CollectorB,
		pushInterval,
		func(agg *models.AggregatedMetrics) {
			agg.TargetQPS = runner.modeEngine.GetCurrentQPS(time.Since(runner.startTime))
			o.wsServer.BroadcastMetrics(agg)
		},
	)

	go o.processMetrics(runner, models.TargetA)
	go o.processMetrics(runner, models.TargetB)
	go o.distributeTasks(runner)
	go o.startWorkers(runner, models.TargetA)
	go o.startWorkers(runner, models.TargetB)

	<-runner.Ctx.Done()

	runner.mu.Lock()
	if runner.Test.Status == models.StatusRunning {
		runner.Test.Status = models.StatusCompleted
	}
	now = time.Now()
	runner.Test.EndTime = &now
	runner.mu.Unlock()

	close(runner.TaskQueueA)
	close(runner.TaskQueueB)
	runner.wg.Wait()
	close(runner.MetricsChanA)
	close(runner.MetricsChanB)

	runner.WorkerPoolA.Close()
	runner.WorkerPoolB.Close()

	o.wsServer.BroadcastTestStatus(&models.LoadTest{
		ID:     runner.Test.ID,
		Status: runner.Test.Status,
		Config: runner.Config.ConfigA,
	})
}

func (o *ABTestOrchestrator) processMetrics(runner *ABTestRunner, target models.ABTestTarget) {
	var metricsChan chan *models.RequestMetrics
	var collector *collector.MetricsCollector

	if target == models.TargetA {
		metricsChan = runner.MetricsChanA
		collector = runner.CollectorA
	} else {
		metricsChan = runner.MetricsChanB
		collector = runner.CollectorB
	}

	for metrics := range metricsChan {
		collector.Collect(metrics)
	}
}

func (o *ABTestOrchestrator) distributeTasks(runner *ABTestRunner) {
	speed := runner.Config.ConfigA.ReplaySpeed
	if speed == 0 {
		speed = 1.0
	}

	if len(runner.preloadedLogs) > 0 {
		var firstLogTime *time.Time
		startTime := time.Now()

		for _, task := range runner.preloadedLogs {
			select {
			case <-runner.Ctx.Done():
				return
			default:
			}

			ts := task.RequestLog.Timestamp.Time

			if firstLogTime == nil {
				firstLogTime = &ts
			}

			elapsedLogTime := ts.Sub(*firstLogTime)
			adjustedLogTime := time.Duration(float64(elapsedLogTime) / speed)

			elapsedTestTime := time.Since(startTime)
			sleepDuration := adjustedLogTime - elapsedTestTime

			if sleepDuration > 0 {
				select {
				case <-runner.Ctx.Done():
					return
				case <-time.After(sleepDuration):
				}
			}

			taskA := &worker.Task{
				RequestLog: task.RequestLog,
				StartTime:  time.Now(),
				Target:     models.TargetA,
			}
			taskB := &worker.Task{
				RequestLog: task.RequestLog,
				StartTime:  time.Now(),
				Target:     models.TargetB,
			}

			assignedTarget := models.HashRequestID(task.RequestLog.ID)
			if assignedTarget == models.TargetA {
				select {
				case runner.TaskQueueA <- taskA:
				case <-runner.Ctx.Done():
					return
				}
				select {
				case runner.TaskQueueB <- taskB:
				case <-runner.Ctx.Done():
					return
				}
			} else {
				select {
				case runner.TaskQueueB <- taskB:
				case <-runner.Ctx.Done():
					return
				}
				select {
				case runner.TaskQueueA <- taskA:
				case <-runner.Ctx.Done():
					return
				}
			}
		}
		return
	}

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

			taskA := &worker.Task{
				RequestLog: log,
				StartTime:  time.Now(),
				Target:     models.TargetA,
			}
			taskB := &worker.Task{
				RequestLog: log,
				StartTime:  time.Now(),
				Target:     models.TargetB,
			}

			assignedTarget := models.HashRequestID(log.ID)
			if assignedTarget == models.TargetA {
				select {
				case runner.TaskQueueA <- taskA:
				case <-runner.Ctx.Done():
					return
				}
				select {
				case runner.TaskQueueB <- taskB:
				case <-runner.Ctx.Done():
					return
				}
			} else {
				select {
				case runner.TaskQueueB <- taskB:
				case <-runner.Ctx.Done():
					return
				}
				select {
				case runner.TaskQueueA <- taskA:
				case <-runner.Ctx.Done():
					return
				}
			}
		}
	}
}

func (o *ABTestOrchestrator) startWorkers(runner *ABTestRunner, target models.ABTestTarget) {
	var workerPool *worker.WorkerPool
	var taskQueue chan *worker.Task
	var metricsChan chan *models.RequestMetrics
	var maxRetries int

	if target == models.TargetA {
		workerPool = runner.WorkerPoolA
		taskQueue = runner.TaskQueueA
		metricsChan = runner.MetricsChanA
		maxRetries = runner.Config.ConfigA.MaxRetries
	} else {
		workerPool = runner.WorkerPoolB
		taskQueue = runner.TaskQueueB
		metricsChan = runner.MetricsChanB
		maxRetries = runner.Config.ConfigB.MaxRetries
	}

	workers := workerPool.GetAllWorkers()
	for _, w := range workers {
		runner.wg.Add(1)
		go func(wr *worker.Worker) {
			defer runner.wg.Done()
			for task := range taskQueue {
				metrics := wr.ProcessTask(runner.Ctx, task, maxRetries)
				select {
				case metricsChan <- metrics:
				case <-runner.Ctx.Done():
					return
				}
			}
		}(w)
	}
}

func (o *ABTestOrchestrator) GetABTest(testID string) (*models.ABTestResult, error) {
	o.mu.RLock()
	defer o.mu.RUnlock()

	runner, exists := o.abTests[testID]
	if !exists {
		return nil, nil
	}

	if runner.Test.Status == models.StatusCompleted || runner.Test.Status == models.StatusStopped {
		if runner.Test.ResultA == nil {
			resultA := runner.CollectorA.GetFinalResult(runner.Config.ConfigA)
			resultB := runner.CollectorB.GetFinalResult(runner.Config.ConfigB)
			runner.Test.ResultA = resultA
			runner.Test.ResultB = resultB
			runner.Test.Comparison = calculateComparison(resultA, resultB)
		}
	}

	return runner.Test, nil
}

func (o *ABTestOrchestrator) StopABTest(testID string) error {
	o.mu.Lock()
	defer o.mu.Unlock()

	runner, exists := o.abTests[testID]
	if !exists {
		return nil
	}

	runner.mu.Lock()
	if runner.Test.Status == models.StatusRunning {
		runner.Test.Status = models.StatusStopped
	}
	runner.mu.Unlock()

	runner.Cancel()
	return nil
}

func (o *ABTestOrchestrator) ListABTests() []*models.ABTestResult {
	o.mu.RLock()
	defer o.mu.RUnlock()

	results := make([]*models.ABTestResult, 0, len(o.abTests))
	for _, runner := range o.abTests {
		result := *runner.Test
		results = append(results, &result)
	}
	return results
}

func calculateComparison(a, b *models.TestResult) *models.TestComparison {
	qpsDiff := (b.AverageQPS - a.AverageQPS) / a.AverageQPS * 100
	errDiff := b.ErrorRate - a.ErrorRate
	ttftDiff := (b.TTFT.P95 - a.TTFT.P95) / a.TTFT.P95 * 100
	tpotDiff := (b.TPOT.P95 - a.TPOT.P95) / a.TPOT.P95 * 100
	totalDiff := (b.TotalLatency.P95 - a.TotalLatency.P95) / a.TotalLatency.P95 * 100

	score := 0.0
	score += qpsDiff * 0.3
	score -= errDiff * 10
	score -= ttftDiff * 0.2
	score -= tpotDiff * 0.2
	score -= totalDiff * 0.3

	winner := "版本 A"
	if score > 0 {
		winner = "版本 B"
	} else if score == 0 {
		winner = "平局"
	}

	return &models.TestComparison{
		QPSDifference:       qpsDiff,
		ErrorRateDifference: errDiff,
		TTFTP95Improvement:  ttftDiff,
		TPOTP95Improvement:  tpotDiff,
		TotalP95Improvement: totalDiff,
		IsBetter:            winner,
	}
}
