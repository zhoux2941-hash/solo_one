package api

import (
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"llm-load-test/internal/models"
	"llm-load-test/internal/orchestrator"
	"llm-load-test/internal/report"
	"llm-load-test/internal/worker"
)

type Handler struct {
	orchestrator  *orchestrator.Orchestrator
	abOrchestrator *orchestrator.ABTestOrchestrator
	reportGen     *report.Generator
	abTests       map[string]*models.ABTestResult
	kafkaLogs     <-chan *models.RequestLog
}

func NewHandler(orch *orchestrator.Orchestrator, abOrch *orchestrator.ABTestOrchestrator, kafkaLogs <-chan *models.RequestLog) *Handler {
	return &Handler{
		orchestrator:  orch,
		abOrchestrator: abOrch,
		reportGen:     report.NewGenerator(),
		abTests:       make(map[string]*models.ABTestResult),
		kafkaLogs:     kafkaLogs,
	}
}

func (h *Handler) preloadLogs(count int) []*worker.Task {
	logs := make([]*models.RequestLog, 0, count)
	timeout := time.After(10 * time.Second)

	for len(logs) < count {
		select {
		case log, ok := <-h.kafkaLogs:
			if !ok {
				return h.convertLogsToTasks(logs)
			}
			logs = append(logs, log)
		case <-timeout:
			return h.convertLogsToTasks(logs)
		}
	}

	return h.convertLogsToTasks(logs)
}

func (h *Handler) convertLogsToTasks(logs []*models.RequestLog) []*worker.Task {
	sort.Slice(logs, func(i, j int) bool {
		return logs[i].Timestamp.Time.Before(logs[j].Timestamp.Time)
	})

	tasks := make([]*worker.Task, len(logs))
	for i, log := range logs {
		tasks[i] = &worker.Task{
			RequestLog: log,
			StartTime:  log.Timestamp.Time,
		}
	}
	return tasks
}

func (h *Handler) CreateTest(c *gin.Context) {
	var config models.LoadTestConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if config.TargetURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "target_url is required"})
		return
	}
	if config.Duration <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "duration must be positive"})
		return
	}
	if config.WorkerCount <= 0 {
		config.WorkerCount = 5
	}

	test, err := h.orchestrator.StartTest(config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, test)
}

func (h *Handler) ListTests(c *gin.Context) {
	tests := h.orchestrator.GetAllTests()
	c.JSON(http.StatusOK, tests)
}

func (h *Handler) GetTest(c *gin.Context) {
	testID := c.Param("id")
	test, err := h.orchestrator.GetTest(testID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, test)
}

func (h *Handler) StopTest(c *gin.Context) {
	testID := c.Param("id")
	if err := h.orchestrator.StopTest(testID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "test stopped"})
}

func (h *Handler) ScaleWorkers(c *gin.Context) {
	testID := c.Param("id")
	var req struct {
		WorkerCount int `json:"worker_count"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.WorkerCount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "worker_count must be positive"})
		return
	}

	if err := h.orchestrator.ScaleWorkers(testID, req.WorkerCount); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "workers scaled"})
}

func (h *Handler) GetTestResult(c *gin.Context) {
	testID := c.Param("id")
	result, err := h.orchestrator.GetTestResult(testID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *Handler) GenerateReport(c *gin.Context) {
	testID := c.Param("id")
	result, err := h.orchestrator.GetTestResult(testID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reportPath, err := h.reportGen.GenerateReport(result)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"report_path": reportPath})
}

func (h *Handler) CreateABTest(c *gin.Context) {
	var config models.ABTestConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.ID = uuid.New().String()
	config.CreatedAt = time.Now()

	preloadedLogs := h.preloadLogs(10000)
	if len(preloadedLogs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to preload test logs from Kafka"})
		return
	}

	abResult, err := h.abOrchestrator.StartABTest(config, preloadedLogs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.abTests[config.ID] = abResult

	c.JSON(http.StatusCreated, abResult)
}

func (h *Handler) GetABTest(c *gin.Context) {
	testID := c.Param("id")
	abResult, err := h.abOrchestrator.GetABTest(testID)
	if err != nil || abResult == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "AB test not found"})
		return
	}
	if abResult.Status == models.StatusCompleted || abResult.Status == models.StatusStopped {
		h.abTests[testID] = abResult
	}
	c.JSON(http.StatusOK, abResult)
}

func (h *Handler) GenerateABReport(c *gin.Context) {
	testID := c.Param("id")
	abResult, err := h.abOrchestrator.GetABTest(testID)
	if err != nil || abResult == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "AB test not found"})
		return
	}
	if abResult.Status != models.StatusCompleted && abResult.Status != models.StatusStopped {
		c.JSON(http.StatusBadRequest, gin.H{"error": "AB test not completed"})
		return
	}

	reportPath, err := h.reportGen.GenerateABReport(abResult)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"report_path": reportPath})
}

func (h *Handler) ListABTests(c *gin.Context) {
	results := h.abOrchestrator.ListABTests()
	c.JSON(http.StatusOK, results)
}

func (h *Handler) GetMetrics(c *gin.Context) {
	testID := c.Query("test_id")
	if testID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "test_id is required"})
		return
	}
	test, err := h.orchestrator.GetTest(testID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"test": test})
}
