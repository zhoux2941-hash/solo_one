package api

import (
	"context"
	"mqtt-fuzzer/internal/fuzzer"
	"mqtt-fuzzer/internal/storage"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Server struct {
	engine  *fuzzer.Engine
	storage *storage.Storage
	router  *gin.Engine
	httpSrv *http.Server
	config  *fuzzer.Config
}

func NewServer(config *fuzzer.Config, fuzzEngine *fuzzer.Engine, store *storage.Storage) *Server {
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	s := &Server{
		engine:  fuzzEngine,
		storage: store,
		router:  router,
		config:  config,
	}

	s.setupRoutes()
	return s
}

func (s *Server) setupRoutes() {
	api := s.router.Group("/api/v1")
	{
		api.POST("/test/start", s.StartTest)
		api.POST("/test/stop", s.StopTest)
		api.GET("/test/status", s.GetStatus)
		api.GET("/test/progress", s.GetProgress)
		api.GET("/test/:sessionId/report", s.GetReport)
		api.GET("/test/:sessionId/export", s.ExportReport)
		api.GET("/test/:sessionId/crashes", s.GetCrashes)
	}
}

func (s *Server) Start(addr string) error {
	s.httpSrv = &http.Server{
		Addr:    addr,
		Handler: s.router,
	}
	return s.httpSrv.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	if s.httpSrv != nil {
		return s.httpSrv.Shutdown(ctx)
	}
	return nil
}

type StartTestRequest struct {
	TargetHost          string   `json:"target_host"`
	TargetPort          int      `json:"target_port"`
	MQTTVersion         string   `json:"mqtt_version"`
	ConcurrentConnections int    `json:"concurrent_connections"`
	Timeout             int      `json:"timeout"`
	TestIterations      int      `json:"test_iterations"`
	EnabledPacketTypes  []string `json:"enabled_packet_types"`
}

func (s *Server) StartTest(c *gin.Context) {
	var req StartTestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TargetHost != "" {
		s.config.TargetHost = req.TargetHost
	}
	if req.TargetPort > 0 {
		s.config.TargetPort = req.TargetPort
	}
	if req.MQTTVersion != "" {
		s.config.MQTTVersion = req.MQTTVersion
	}
	if req.ConcurrentConnections > 0 {
		s.config.ConcurrentConnections = req.ConcurrentConnections
	}
	if req.Timeout > 0 {
		s.config.Timeout = fuzzer.Duration(req.Timeout)
	}
	if req.TestIterations > 0 {
		s.config.TestIterations = req.TestIterations
	}
	if len(req.EnabledPacketTypes) > 0 {
		s.config.EnabledPacketTypes = req.EnabledPacketTypes
	}

	sessionID, err := s.engine.Start(context.Background())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     "started",
		"session_id": sessionID,
	})
}

func (s *Server) StopTest(c *gin.Context) {
	if err := s.engine.Stop(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "stopped"})
}

func (s *Server) GetStatus(c *gin.Context) {
	sessionID := s.engine.SessionID()
	var session *storage.TestSession

	if sessionID != "" {
		s, err := s.storage.GetSession(sessionID)
		if err == nil {
			session = s
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"running":  s.engine.IsRunning(),
		"session":  session,
	})
}

func (s *Server) GetProgress(c *gin.Context) {
	progress, completed, total := s.engine.GetProgress()

	c.JSON(http.StatusOK, gin.H{
		"progress":           progress,
		"completed_cases":    completed,
		"total_cases":        total,
		"running":            s.engine.IsRunning(),
		"session_id":         s.engine.SessionID(),
		"active_connections": s.engine.ActiveConnections(),
	})
}

func (s *Server) GetReport(c *gin.Context) {
	sessionID := c.Param("sessionId")

	session, err := s.storage.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	stats, err := s.storage.GetMutationStats(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resultCounts, err := s.storage.GetResultCounts(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	crashes, err := s.storage.GetCrashRecords(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session":        session,
		"mutation_stats": stats,
		"result_counts":  resultCounts,
		"critical_crashes": crashes,
	})
}

func (s *Server) ExportReport(c *gin.Context) {
	sessionID := c.Param("sessionId")

	session, err := s.storage.GetSession(sessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	stats, err := s.storage.GetMutationStats(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resultCounts, err := s.storage.GetResultCounts(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	crashes, err := s.storage.GetCrashRecords(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	records, err := s.storage.GetRecordsBySession(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Type", "application/json")
	c.Header("Content-Disposition", "attachment; filename=report-"+sessionID+".json")
	c.JSON(http.StatusOK, gin.H{
		"session":        session,
		"summary":        resultCounts,
		"mutation_stats": stats,
		"critical_crashes": crashes,
		"all_records":    records,
	})
}

func (s *Server) GetCrashes(c *gin.Context) {
	sessionID := c.Param("sessionId")

	crashes, err := s.storage.GetCrashRecords(sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"count":   len(crashes),
		"crashes": crashes,
	})
}
