package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"sync/atomic"
	"time"
	"webtransport-spreadsheet/server"

	"github.com/quic-go/webtransport-go"
)

type PerformanceTest struct {
	serverAddr    string
	roomID    string
	clientCount int
	duration  time.Duration
}

func NewPerformanceTest(addr, roomID string, clientCount int, duration time.Duration) *PerformanceTest {
	return &PerformanceTest{
		serverAddr: addr,
		roomID:     roomID,
		clientCount: clientCount,
		duration:   duration,
	}
}

func (pt *PerformanceTest) Run() {
	log.Printf("=== 性能测试开始 ===")
	log.Printf("服务器地址: %s", pt.serverAddr)
	log.Printf("客户端数量: %d", pt.clientCount)
	log.Printf("测试时长: %v", pt.duration)
	log.Printf("房间ID: %s", pt.roomID)
	log.Println()

	var wg := sync.WaitGroup{}
	var totalOps uint64
	var totalLatency uint64
	var errors uint64

	startTime := time.Now()
	endTime := startTime.Add(pt.duration)

	for i := 0; i < pt.clientCount; i++ {
		wg.Add(1)
		go func(clientID int) {
			defer wg.Done()
			pt.simulateClient(clientID, endTime, &totalOps, &totalLatency, &errors)
		}(i)
	}

	wg.Wait()

	elapsed := time.Since(startTime)
	avgLatency := time.Duration(0)
	if totalOps > 0 {
		avgLatency = time.Duration(totalLatency / totalOps)
	}

	log.Println()
	log.Printf("=== 测试结果 ===")
	log.Printf("总操作数: %d", totalOps)
	log.Printf("错误数: %d", errors)
	log.Printf("总耗时: %v", elapsed)
	log.Printf("吞吐量: %.2f ops/sec", float64(totalOps)/elapsed.Seconds())
	log.Printf("平均延迟: %v", avgLatency)
	log.Printf("并发客户端: %d", pt.clientCount)
	
	if avgLatency < 150*time.Millisecond {
		log.Println("✓ 延迟目标达成 (<150ms)")
	} else {
		log.Println("✗ 延迟目标未达成 (>=150ms)")
	}
}

func (pt *PerformanceTest) simulateClient(clientID int, endTime time.Time, totalOps, totalLatency, errors *uint64) {
	d := &webtransport.Dialer{}
	
	ctx := &http.Request{
		Header: make(http.Header),
	}
	
	session, err := d.Dial(ctx, fmt.Sprintf("https://%s/webtransport?room=%s", pt.serverAddr, pt.roomID), nil)
	if err != nil {
		atomic.AddUint64(errors, 1)
		log.Printf("客户端 %d 连接失败: %v", clientID, err)
		return
	}
	defer session.CloseWithError(0, "done")

	cellRow := clientID % 10
	cellCol := clientID % 26

	for time.Now().Before(endTime) {
		opStart := time.Now()
		
		op := server.Operation{
			ID:        fmt.Sprintf("%d-%d", clientID, time.Now().UnixNano()),
			Type:      "set_value",
			CellID:    fmt.Sprintf("%c%d", 'A'+cellCol, cellRow+1),
			Value:     fmt.Sprintf("%d", time.Now().UnixNano()%1000),
			Timestamp: time.Now().UnixNano(),
			ClientID:  fmt.Sprintf("test-client-%d", clientID),
		}
		
		data, _ := json.Marshal(op)
		
		stream, err := session.OpenUniStream()
		if err != nil {
			atomic.AddUint64(errors, 1)
			continue
		}
		
		_, err = stream.Write(data)
		if err != nil {
			atomic.AddUint64(errors, 1)
			stream.Close()
			continue
		}
		stream.Close()
		
		latency := time.Since(opStart)
		atomic.AddUint64(totalOps, 1)
		atomic.AddUint64(totalLatency, uint64(latency))
		
		time.Sleep(50 * time.Millisecond)
		cellRow = (cellRow + 1) % 100
	}
}

func main() {
	test := NewPerformanceTest(
		"localhost:8443",
		"perf-test",
		20,
		10*time.Second,
	)
	test.Run()
}
