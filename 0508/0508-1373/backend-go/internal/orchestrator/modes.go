package orchestrator

import (
	"context"
	"math"
	"time"

	"llm-load-test/internal/worker"
)

type FixedQPSEngine struct {
	targetQPS float64
}

func NewFixedQPSEngine(qps int) *FixedQPSEngine {
	return &FixedQPSEngine{
		targetQPS: float64(qps),
	}
}

func (e *FixedQPSEngine) Start(ctx context.Context, runner *LoadTestRunner) error {
	if e.targetQPS <= 0 {
		return nil
	}

	interval := time.Second / time.Duration(e.targetQPS)
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
		}
	}
}

func (e *FixedQPSEngine) GetCurrentQPS(elapsed time.Duration) float64 {
	return e.targetQPS
}

type LinearGrowthEngine struct {
	startQPS   float64
	endQPS     float64
	duration   time.Duration
}

func NewLinearGrowthEngine(startQPS, endQPS int, durationSeconds int64) *LinearGrowthEngine {
	return &LinearGrowthEngine{
		startQPS: float64(startQPS),
		endQPS:   float64(endQPS),
		duration: time.Duration(durationSeconds) * time.Second,
	}
}

func (e *LinearGrowthEngine) Start(ctx context.Context, runner *LoadTestRunner) error {
	startTime := time.Now()
	ticker := time.NewTicker(10 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			elapsed := time.Since(startTime)
			if elapsed >= e.duration {
				return nil
			}
			currentQPS := e.GetCurrentQPS(elapsed)
			if currentQPS > 0 {
				interval := time.Second / time.Duration(currentQPS)
				time.Sleep(interval)
			}
		}
	}
}

func (e *LinearGrowthEngine) GetCurrentQPS(elapsed time.Duration) float64 {
	progress := float64(elapsed) / float64(e.duration)
	if progress > 1 {
		progress = 1
	}
	return e.startQPS + (e.endQPS-e.startQPS)*progress
}

type BurstEngine struct {
	baseQPS        float64
	burstMultiplier float64
	burstAt        time.Duration
	burstActive    bool
}

func NewBurstEngine(baseQPS int, burstMultiplier float64, burstAt time.Duration) *BurstEngine {
	return &BurstEngine{
		baseQPS:         float64(baseQPS),
		burstMultiplier: burstMultiplier,
		burstAt:         burstAt,
		burstActive:     false,
	}
}

func (e *BurstEngine) Start(ctx context.Context, runner *LoadTestRunner) error {
	startTime := time.Now()
	ticker := time.NewTicker(10 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			elapsed := time.Since(startTime)

			if !e.burstActive && elapsed >= e.burstAt {
				e.burstActive = true
			}

			currentQPS := e.GetCurrentQPS(elapsed)
			if currentQPS > 0 {
				interval := time.Second / time.Duration(currentQPS)
				time.Sleep(interval)
			}
		}
	}
}

func (e *BurstEngine) GetCurrentQPS(elapsed time.Duration) float64 {
	if e.burstActive || elapsed >= e.burstAt {
		return e.baseQPS * e.burstMultiplier
	}
	return e.baseQPS
}

type ReplayEngine struct {
	speedMultiplier float64
	firstTimestamp  *time.Time
	preloadedLogs   []*worker.Task
}

func NewReplayEngine(speed float64) *ReplayEngine {
	return &ReplayEngine{
		speedMultiplier: speed,
	}
}

func NewReplayEngineWithLogs(speed float64, logs []*worker.Task) *ReplayEngine {
	return &ReplayEngine{
		speedMultiplier: speed,
		preloadedLogs:   logs,
	}
}

func (e *ReplayEngine) Start(ctx context.Context, runner *LoadTestRunner) error {
	startTime := time.Now()

	go func() {
		if len(e.preloadedLogs) > 0 {
			e.startWithPreloadedLogs(ctx, runner, startTime)
			return
		}
		e.startWithLiveStream(ctx, runner, startTime)
	}()

	<-ctx.Done()
	return nil
}

func (e *ReplayEngine) startWithPreloadedLogs(ctx context.Context, runner *LoadTestRunner, startTime time.Time) {
	var firstLogTime *time.Time

	for i, task := range e.preloadedLogs {
		select {
		case <-ctx.Done():
			return
		default:
		}

		ts := task.RequestLog.Timestamp.Time

		if firstLogTime == nil {
			firstLogTime = &ts
			e.firstTimestamp = &ts
		}

		elapsedLogTime := ts.Sub(*firstLogTime)
		adjustedLogTime := time.Duration(float64(elapsedLogTime) / e.speedMultiplier)

		elapsedTestTime := time.Since(startTime)
		sleepDuration := adjustedLogTime - elapsedTestTime

		if sleepDuration > 0 {
			select {
			case <-ctx.Done():
				return
			case <-time.After(sleepDuration):
			}
		}

		select {
		case <-ctx.Done():
			return
		case runner.TaskQueue <- task:
		}

		_ = i
	}
}

func (e *ReplayEngine) startWithLiveStream(ctx context.Context, runner *LoadTestRunner, startTime time.Time) {
	var taskBuffer []*worker.Task
	var lastLogTime *time.Time

	for {
		select {
		case <-ctx.Done():
			return
		case task, ok := <-runner.TaskQueue:
			if !ok {
				return
			}

			ts := task.RequestLog.Timestamp.Time

			if e.firstTimestamp == nil {
				e.firstTimestamp = &ts
				lastLogTime = &ts
				taskBuffer = append(taskBuffer, task)
				continue
			}

			logInterval := ts.Sub(*lastLogTime)
			adjustedInterval := time.Duration(float64(logInterval) / e.speedMultiplier)

			_ = adjustedInterval

			elapsedTestTime := time.Since(startTime)
			elapsedLogTime := ts.Sub(*e.firstTimestamp)
			adjustedLogTime := time.Duration(float64(elapsedLogTime) / e.speedMultiplier)

			sleepDuration := adjustedLogTime - elapsedTestTime
			if sleepDuration > 0 {
				select {
				case <-ctx.Done():
					return
				case <-time.After(sleepDuration):
				}
			}

			lastLogTime = &ts
			taskBuffer = append(taskBuffer, task)

			for len(taskBuffer) > 0 {
				select {
				case <-ctx.Done():
					return
				case runner.TaskQueue <- taskBuffer[0]:
					taskBuffer = taskBuffer[1:]
				default:
				}
			}
		}
	}
}

func (e *ReplayEngine) GetCurrentQPS(elapsed time.Duration) float64 {
	return float64(math.NaN())
}
