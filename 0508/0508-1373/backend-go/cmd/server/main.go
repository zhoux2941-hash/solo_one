package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"

	"llm-load-test/internal/api"
	"llm-load-test/internal/kafka"
	"llm-load-test/internal/models"
	"llm-load-test/internal/orchestrator"
	ws "llm-load-test/internal/websocket"
)

func main() {
	loadConfig()

	wsServer := ws.NewServer()
	wsServer.Start()

	var logsChan <-chan *models.RequestLog

	kafkaConsumer, err := kafka.NewConsumer()
	if err != nil {
		log.Printf("Warning: Failed to create Kafka consumer, using mock consumer: %v", err)
		mockConsumer := kafka.NewMockConsumer()
		ctx := context.Background()
		mockConsumer.Start(ctx)
		logsChan = mockConsumer.LogsChannel()
	} else {
		ctx := context.Background()
		if err := kafkaConsumer.Start(ctx); err != nil {
			log.Printf("Warning: Failed to start Kafka consumer, using mock: %v", err)
			mockConsumer := kafka.NewMockConsumer()
			mockConsumer.Start(ctx)
			logsChan = mockConsumer.LogsChannel()
		} else {
			logsChan = kafkaConsumer.LogsChannel()
		}
	}

	orch := orchestrator.NewOrchestrator(wsServer, logsChan)
	abOrch := orchestrator.NewABTestOrchestrator(wsServer, logsChan)
	handler := api.NewHandler(orch, abOrch, logsChan)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	apiV1 := r.Group("/api/v1")
	{
		tests := apiV1.Group("/tests")
		{
			tests.POST("", handler.CreateTest)
			tests.GET("", handler.ListTests)
			tests.GET("/:id", handler.GetTest)
			tests.POST("/:id/stop", handler.StopTest)
			tests.POST("/:id/scale", handler.ScaleWorkers)
			tests.GET("/:id/result", handler.GetTestResult)
			tests.POST("/:id/report", handler.GenerateReport)
		}

		abTests := apiV1.Group("/ab-tests")
		{
			abTests.POST("", handler.CreateABTest)
			abTests.GET("", handler.ListABTests)
			abTests.GET("/:id", handler.GetABTest)
			abTests.POST("/:id/report", handler.GenerateABReport)
		}

		apiV1.GET("/metrics", handler.GetMetrics)
	}

	r.GET("/ws", func(c *gin.Context) {
		wsServer.HandleWebSocket(c.Writer, c.Request)
	})

	port := viper.GetString("server.port")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	go func() {
		log.Printf("Server starting on port %s...", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	if kafkaConsumer != nil {
		kafkaConsumer.Close()
	}

	log.Println("Server exited gracefully")
}

func loadConfig() {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./config")
	viper.AddConfigPath("/etc/llm-load-test")
	viper.AddConfigPath(".")

	viper.AutomaticEnv()
	viper.SetEnvPrefix("LLM_LOAD_TEST")

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Warning: No config file found, using defaults: %v", err)
	}
}
