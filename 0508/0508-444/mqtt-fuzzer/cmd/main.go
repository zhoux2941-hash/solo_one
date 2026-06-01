package main

import (
	"context"
	"flag"
	"fmt"
	"mqtt-fuzzer/internal/api"
	"mqtt-fuzzer/internal/fuzzer"
	"mqtt-fuzzer/internal/report"
	"mqtt-fuzzer/internal/storage"
	"os"
	"os/signal"
	"syscall"

	"gopkg.in/yaml.v3"
)

func main() {
	configPath := flag.String("config", "configs/config.yaml", "Path to configuration file")
	dbPath := flag.String("db", "fuzzer.db", "Path to SQLite database file")
	apiAddr := flag.String("api", ":8080", "API server listen address")
	runOnce := flag.Bool("run-once", false, "Run fuzzing once and exit")
	reportSession := flag.String("report", "", "Generate report for session ID")
	flag.Parse()

	config, err := loadConfig(*configPath)
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	store, err := storage.NewStorage(*dbPath)
	if err != nil {
		fmt.Printf("Failed to open database: %v\n", err)
		os.Exit(1)
	}
	defer store.Close()

	if *reportSession != "" {
		if err := generateAndPrintReport(store, *reportSession); err != nil {
			fmt.Printf("Failed to generate report: %v\n", err)
			os.Exit(1)
		}
		return
	}

	engine := fuzzer.NewEngine(config, store)

	if *runOnce {
		runFuzzingOnce(engine, store)
		return
	}

	apiServer := api.NewServer(config, engine, store)

	go func() {
		fmt.Printf("MQTT Fuzzer API Server starting on %s\n", *apiAddr)
		fmt.Println("Available endpoints:")
		fmt.Println("  POST /api/v1/test/start    - Start fuzzing test")
		fmt.Println("  POST /api/v1/test/stop     - Stop fuzzing test")
		fmt.Println("  GET  /api/v1/test/status   - Get current status")
		fmt.Println("  GET  /api/v1/test/progress - Get test progress")
		fmt.Println("  GET  /api/v1/test/:sessionId/report   - Get test report")
		fmt.Println("  GET  /api/v1/test/:sessionId/export   - Export full report")
		fmt.Println("  GET  /api/v1/test/:sessionId/crashes  - Get crash details")
		fmt.Println()
		if err := apiServer.Start(*apiAddr); err != nil {
			fmt.Printf("API server error: %v\n", err)
		}
	}()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	fmt.Println("\nShutting down...")
	if engine.IsRunning() {
		engine.Stop()
	}
	apiServer.Shutdown(context.Background())
	fmt.Println("Goodbye!")
}

func loadConfig(path string) (*fuzzer.Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config: %w", err)
	}

	var config fuzzer.Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}

	return &config, nil
}

func runFuzzingOnce(engine *fuzzer.Engine, store *storage.Storage) {
	fmt.Println("Starting MQTT Fuzzing Test...")
	sessionID, err := engine.Start(context.Background())
	if err != nil {
		fmt.Printf("Failed to start fuzzing: %v\n", err)
		return
	}

	fmt.Printf("Test session started: %s\n", sessionID)

	ticker := make(chan struct{})
	go func() {
		for engine.IsRunning() {
			progress, completed, total := engine.GetProgress()
			fmt.Printf("\rProgress: %.2f%% (%d/%d)", progress, completed, total)
		}
		close(ticker)
	}()

	<-ticker
	fmt.Println("\nTest completed!")

	if err := generateAndPrintReport(store, sessionID); err != nil {
		fmt.Printf("Failed to generate report: %v\n", err)
	}
}

func generateAndPrintReport(store *storage.Storage, sessionID string) error {
	r, err := report.GenerateReport(store, sessionID)
	if err != nil {
		return err
	}

	r.PrintSummary()

	filename := fmt.Sprintf("report-%s.json", sessionID)
	if err := r.SaveToFile(filename); err != nil {
		fmt.Printf("Warning: failed to save report: %v\n", err)
	} else {
		fmt.Printf("Full report saved to: %s\n", filename)
	}

	return nil
}
