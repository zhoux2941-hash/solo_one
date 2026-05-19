//go:build ignore
// +build ignore

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"sync/atomic"
	"time"
)

const (
	baseURL      = "http://localhost:8080"
	concurrent   = 100
	duration     = 30 * time.Second
)

var (
	successCount int64
	failCount    int64
	tooManyReq   int64
)

func createConfig(appID, namespace, key string) error {
	config := map[string]interface{}{
		"app_id":      appID,
		"namespace":   namespace,
		"key":         key,
		"value":       fmt.Sprintf("host: localhost\nport: %d", time.Now().UnixNano()),
		"format":      "yaml",
		"environment": "dev",
		"operator":    "test",
	}

	data, _ := json.Marshal(config)
	resp, err := http.Post(baseURL+"/api/v1/configs", "application/json", bytes.NewBuffer(data))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusTooManyRequests {
		atomic.AddInt64(&tooManyReq, 1)
		return fmt.Errorf("too many requests")
	}

	if resp.StatusCode != http.StatusOK {
		atomic.AddInt64(&failCount, 1)
		return fmt.Errorf("status: %d", resp.StatusCode)
	}

	atomic.AddInt64(&successCount, 1)
	return nil
}

func updateConfig(appID, namespace, key string) error {
	config := map[string]interface{}{
		"app_id":      appID,
		"namespace":   namespace,
		"key":         key,
		"value":       fmt.Sprintf("host: localhost\nport: %d", time.Now().UnixNano()),
		"format":      "yaml",
		"environment": "dev",
		"operator":    "test",
		"change_desc": "update",
	}

	data, _ := json.Marshal(config)
	req, _ := http.NewRequest(http.MethodPut, baseURL+"/api/v1/configs", bytes.NewBuffer(data))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		atomic.AddInt64(&failCount, 1)
		return fmt.Errorf("status: %d", resp.StatusCode)
	}

	atomic.AddInt64(&successCount, 1)
	return nil
}

func longPollWorker(id int, wg *sync.WaitGroup, stopChan <-chan struct{}) {
	defer wg.Done()

	client := &http.Client{
		Timeout: 35 * time.Second,
	}

	reqBody := map[string]interface{}{
		"app_id":      "stress-test",
		"namespace":   "default",
		"environment": "dev",
		"last_version": map[string]int64{
			"database": 0,
		},
	}

	for {
		select {
		case <-stopChan:
			return
		default:
			data, _ := json.Marshal(reqBody)
			req, _ := http.NewRequest(http.MethodPost, baseURL+"/api/v1/long-poll", bytes.NewBuffer(data))
			req.Header.Set("Content-Type", "application/json")

			resp, err := client.Do(req)
			if err != nil {
				atomic.AddInt64(&failCount, 1)
				time.Sleep(100 * time.Millisecond)
				continue
			}

			if resp.StatusCode == http.StatusTooManyRequests {
				atomic.AddInt64(&tooManyReq, 1)
			} else if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusNotModified {
				atomic.AddInt64(&successCount, 1)
			} else {
				atomic.AddInt64(&failCount, 1)
			}
			resp.Body.Close()
		}
	}
}

func main() {
	fmt.Println("Starting stress test...")
	fmt.Printf("Concurrent: %d, Duration: %v\n", concurrent, duration)

	fmt.Println("\n1. Creating initial config...")
	err := createConfig("stress-test", "default", "database")
	if err != nil {
		fmt.Printf("Failed to create config: %v\n", err)
	}

	fmt.Println("\n2. Starting long-poll workers...")
	var wg sync.WaitGroup
	stopChan := make(chan struct{})

	for i := 0; i < concurrent; i++ {
		wg.Add(1)
		go longPollWorker(i, &wg, stopChan)
	}

	fmt.Println("\n3. Starting rapid config updates (100/s)...")
	ticker := time.NewTicker(10 * time.Millisecond)
	updateCount := 0
	go func() {
		for range ticker.C {
			err := updateConfig("stress-test", "default", "database")
			if err == nil {
				updateCount++
			}
		}
	}()

	fmt.Println("\n4. Monitoring metrics...")
	metricsTicker := time.NewTicker(5 * time.Second)
	go func() {
		for range metricsTicker.C {
			resp, err := http.Get(baseURL + "/metrics")
			if err == nil {
				var result map[string]interface{}
				json.NewDecoder(resp.Body).Decode(&result)
				resp.Body.Close()
				fmt.Printf("  [Metrics] Active Connections: %v\n", result["active_connections"])
			}
		}
	}()

	time.Sleep(duration)

	ticker.Stop()
	metricsTicker.Stop()
	close(stopChan)
	wg.Wait()

	fmt.Println("\n=== Test Results ===")
	fmt.Printf("Successful requests: %d\n", successCount)
	fmt.Printf("Failed requests: %d\n", failCount)
	fmt.Printf("Rate limited requests: %d\n", tooManyReq)
	fmt.Printf("Config updates: %d\n", updateCount)
	fmt.Printf("Requests per second: %.2f\n", float64(successCount+failCount+tooManyReq)/duration.Seconds())
	fmt.Println("\nTest completed successfully!")
}
