package metrics

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"sync"
	"time"
	"unsafe"

	"ebpf-microservice-monitor/pkg/topology"

	"github.com/cilium/ebpf"
	"github.com/cilium/ebpf/ringbuf"
	"github.com/prometheus/client_golang/prometheus"
)

const (
	eventTypeHTTPAgg = iota
	eventTypeTCPAgg
	eventTypeSyscallAgg
	eventTypeMemoryAgg
	eventTypeConnSample
	eventTypeSamplingUpdate
)

type SamplingState struct {
	CurrentSampleRate  uint32 `json:"current_sample_rate"`
	QPS                uint64 `json:"qps"`
	ErrorRatePct       uint64 `json:"error_rate_pct"`
	P95LatencyUs       uint64 `json:"p95_latency_us"`
	LastUpdateReason   string `json:"last_update_reason"`
	LastUpdateTime     time.Time `json:"last_update_time"`
}

type MonitorObjects struct {
	HttpStats     *ebpf.Map
	TcpStats      *ebpf.Map
	SyscallStats  *ebpf.Map
	MemoryStats   *ebpf.Map
	AdaptiveState *ebpf.Map
	Events        *ringbuf.Reader
}

type httpKey struct {
	Tgid       uint32
	StatusCode uint16
	Method     [16]byte
	Host       [64]byte
	Path       [128]byte
}

type httpValue struct {
	Count        uint64
	LatencySum   uint64
	LatencySqSum uint64
	MinLatency   uint64
	MaxLatency   uint64
	ErrorCount   uint64
}

type tcpKey struct {
	Saddr uint32
	Daddr uint32
	Sport uint16
	Dport uint16
}

type tcpValue struct {
	Retransmits uint64
	Drops       uint64
}

type syscallKey struct {
	Tgid       uint32
	SyscallNr  int32
}

type syscallValue struct {
	Count      uint64
	LatencySum uint64
}

type memoryKey struct {
	Tgid uint32
}

type memoryValue struct {
	AllocCount uint64
	AllocBytes uint64
}

type adaptiveState struct {
	WindowStart       uint64
	TotalRequests     uint64
	TotalErrors       uint64
	LatencySum        uint64
	HighLatencyCount  uint64
	CurrentSampleRate uint32
	SampleRateTarget  uint32
}

type Exporter struct {
	topologyMgr   *topology.Manager
	ebpfMaps      *MonitorObjects
	samplingState *SamplingState
	stateMu       sync.RWMutex
	
	httpRequests  *prometheus.CounterVec
	httpLatency   *prometheus.HistogramVec
	tcpRetrans    *prometheus.CounterVec
	tcpDrops      *prometheus.CounterVec
	syscallCount  *prometheus.CounterVec
	memoryAlloc   *prometheus.CounterVec
	samplingRate  prometheus.Gauge
	stopChan      chan struct{}
}

func NewExporter(topologyMgr *topology.Manager, objs *MonitorObjects) *Exporter {
	e := &Exporter{
		topologyMgr: topologyMgr,
		ebpfMaps:    objs,
		stopChan:    make(chan struct{}),
		samplingState: &SamplingState{
			CurrentSampleRate: 100,
		},
		httpRequests: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "http_requests_total",
				Help: "Total number of HTTP requests (sampled)",
			},
			[]string{"service", "method", "path", "status_code"},
		),
		httpLatency: prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "http_request_latency_seconds",
				Help:    "HTTP request latency in seconds (sampled)",
				Buckets: prometheus.DefBuckets,
			},
			[]string{"service", "method", "path", "status_code"},
		),
		tcpRetrans: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "tcp_retransmits_total",
				Help: "Total number of TCP retransmits",
			},
			[]string{"src_service", "dst_service", "src_ip", "dst_ip"},
		),
		tcpDrops: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "tcp_drops_total",
				Help: "Total number of TCP drops",
			},
			[]string{"src_service", "dst_service", "src_ip", "dst_ip"},
		),
		syscallCount: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "syscall_invocations_total",
				Help: "Total number of syscall invocations",
			},
			[]string{"service", "syscall_nr"},
		),
		memoryAlloc: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Name: "memory_allocations_bytes_total",
				Help: "Total memory allocated in bytes",
			},
			[]string{"service"},
		),
		samplingRate: prometheus.NewGauge(
			prometheus.GaugeOpts{
				Name: "ebpf_sampling_rate",
				Help: "Current eBPF sampling rate (1/N)",
			},
		),
	}

	prometheus.MustRegister(e.httpRequests)
	prometheus.MustRegister(e.httpLatency)
	prometheus.MustRegister(e.tcpRetrans)
	prometheus.MustRegister(e.tcpDrops)
	prometheus.MustRegister(e.syscallCount)
	prometheus.MustRegister(e.memoryAlloc)
	prometheus.MustRegister(e.samplingRate)

	// 注册 HTTP API
	e.registerAPI()

	return e
}

func (e *Exporter) registerAPI() {
	http.HandleFunc("/api/sampling/state", func(w http.ResponseWriter, r *http.Request) {
		e.stateMu.RLock()
		defer e.stateMu.RUnlock()
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(e.samplingState)
	})

	http.HandleFunc("/api/sampling/rate", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			var req struct {
				Rate uint32 `json:"rate"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			
			if err := e.SetSampleRate(req.Rate); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			
			log.Printf("Manually set sample rate to 1/%d", req.Rate)
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"current_rate": e.GetCurrentSampleRate(),
		})
	})
}

func (e *Exporter) SetSampleRate(rate uint32) error {
	if e.ebpfMaps == nil || e.ebpfMaps.AdaptiveState == nil {
		return fmt.Errorf("adaptive state map not available")
	}

	key := uint32(0)
	var state adaptiveState
	
	if err := e.ebpfMaps.AdaptiveState.Lookup(unsafe.Pointer(&key), unsafe.Pointer(&state)); err != nil {
		state.WindowStart = 0
		state.TotalRequests = 0
		state.TotalErrors = 0
		state.LatencySum = 0
		state.HighLatencyCount = 0
		state.SampleRateTarget = rate
	}
	
	state.CurrentSampleRate = rate
	state.SampleRateTarget = rate
	
	return e.ebpfMaps.AdaptiveState.Put(unsafe.Pointer(&key), unsafe.Pointer(&state))
}

func (e *Exporter) GetCurrentSampleRate() uint32 {
	e.stateMu.RLock()
	defer e.stateMu.RUnlock()
	return e.samplingState.CurrentSampleRate
}

func (e *Exporter) StartAggregationReader(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	log.Println("Starting aggregation reader with interval:", interval)

	for {
		select {
		case <-ticker.C:
			e.readAndFlushAggregates()
		case <-e.stopChan:
			return
		}
	}
}

func (e *Exporter) readAndFlushAggregates() {
	if e.ebpfMaps == nil {
		return
	}

	e.readHTTPStats()
	e.readTCPStats()
	e.readSyscallStats()
	e.readMemoryStats()
}

func (e *Exporter) readHTTPStats() {
	if e.ebpfMaps.HttpStats == nil {
		return
	}

	var key httpKey
	var val httpValue

	iter := e.ebpfMaps.HttpStats.Iterate()
	for iter.Next(unsafe.Pointer(&key), unsafe.Pointer(&val)) {
		if val.Count == 0 {
			continue
		}

		method := bytesToString(key.Method[:])
		path := bytesToString(key.Path[:])
		serviceName := fmt.Sprintf("process-%d", key.Tgid)
		statusStr := fmt.Sprintf("%d", key.StatusCode)
		labels := []string{serviceName, method, path, statusStr}

		e.httpRequests.WithLabelValues(labels...).Add(float64(val.Count))

		if val.Count > 0 {
			avgLatency := float64(val.LatencySum) / float64(val.Count) / 1e9
			e.httpLatency.WithLabelValues(labels...).Observe(avgLatency)
		}
	}
}

func (e *Exporter) readTCPStats() {
	if e.ebpfMaps.TcpStats == nil {
		return
	}

	var key tcpKey
	var val tcpValue

	iter := e.ebpfMaps.TcpStats.Iterate()
	for iter.Next(unsafe.Pointer(&key), unsafe.Pointer(&val)) {
		srcIP := intToIP(key.Saddr)
		dstIP := intToIP(key.Daddr)

		srcService := e.topologyMgr.GetServiceByIP(srcIP)
		if srcService == "" {
			srcService = "unknown"
		}

		dstService := e.topologyMgr.GetServiceByIP(dstIP)
		if dstService == "" {
			dstService = "unknown"
		}

		if val.Retransmits > 0 {
			e.tcpRetrans.WithLabelValues(srcService, dstService, srcIP, dstIP).Add(float64(val.Retransmits))
		}
		if val.Drops > 0 {
			e.tcpDrops.WithLabelValues(srcService, dstService, srcIP, dstIP).Add(float64(val.Drops))
		}
	}
}

func (e *Exporter) readSyscallStats() {
	if e.ebpfMaps.SyscallStats == nil {
		return
	}

	var key syscallKey
	var val syscallValue

	iter := e.ebpfMaps.SyscallStats.Iterate()
	for iter.Next(unsafe.Pointer(&key), unsafe.Pointer(&val)) {
		if val.Count == 0 {
			continue
		}

		serviceName := fmt.Sprintf("process-%d", key.Tgid)
		syscallStr := fmt.Sprintf("%d", key.SyscallNr)

		e.syscallCount.WithLabelValues(serviceName, syscallStr).Add(float64(val.Count))
	}
}

func (e *Exporter) readMemoryStats() {
	if e.ebpfMaps.MemoryStats == nil {
		return
	}

	var key memoryKey
	var val memoryValue

	iter := e.ebpfMaps.MemoryStats.Iterate()
	for iter.Next(unsafe.Pointer(&key), unsafe.Pointer(&val)) {
		if val.AllocBytes == 0 {
			continue
		}

		serviceName := fmt.Sprintf("process-%d", key.Tgid)
		e.memoryAlloc.WithLabelValues(serviceName).Add(float64(val.AllocBytes))
	}
}

func bytesToString(b []byte) string {
	for i, c := range b {
		if c == 0 {
			return string(b[:i])
		}
	}
	return string(b)
}

func intToIP(ip uint32) string {
	return net.IPv4(byte(ip), byte(ip>>8), byte(ip>>16), byte(ip>>24)).String()
}

func (e *Exporter) ProcessEvents(events *ringbuf.Reader) {
	defer events.Close()

	log.Println("Starting event processing loop (with adaptive sampling)")

	buf := make([]byte, 4096)
	for {
		record, err := events.Read()
		if err != nil {
			select {
			case <-e.stopChan:
				return
			default:
			}
			time.Sleep(100 * time.Millisecond)
			continue
		}

		if len(record.RawSample) < 16 {
			continue
		}

		eventType := *(*uint32)(unsafe.Pointer(&record.RawSample[0]))
		
		switch eventType {
		case eventTypeConnSample:
			if len(record.RawSample) >= 36 {
				saddr := *(*uint32)(unsafe.Pointer(&record.RawSample[16]))
				daddr := *(*uint32)(unsafe.Pointer(&record.RawSample[20]))
				tgid := *(*uint32)(unsafe.Pointer(&record.RawSample[32]))

				conn := topology.Connection{
					Timestamp: time.Now(),
					SrcIP:     intToIP(saddr),
					DstIP:     intToIP(daddr),
					Tgid:      tgid,
				}
				e.topologyMgr.AddConnection(conn)
			}
		case eventTypeSamplingUpdate:
			if len(record.RawSample) >= 64 {
				qps := *(*uint64)(unsafe.Pointer(&record.RawSample[8]))
				errorRatePct := *(*uint64)(unsafe.Pointer(&record.RawSample[16]))
				oldRate := *(*uint32)(unsafe.Pointer(&record.RawSample[32]))
				newRate := *(*uint32)(unsafe.Pointer(&record.RawSample[36]))
				
				// 读取 reason 字符串 (64字节)
				reasonBytes := make([]byte, 64)
				for i := 0; i < 64 && 40+i < len(record.RawSample); i++ {
					reasonBytes[i] = record.RawSample[40+i]
				}
				reason := bytesToString(reasonBytes)

				e.stateMu.Lock()
				e.samplingState.CurrentSampleRate = newRate
				e.samplingState.QPS = qps
				e.samplingState.ErrorRatePct = errorRatePct
				e.samplingState.LastUpdateReason = reason
				e.samplingState.LastUpdateTime = time.Now()
				e.stateMu.Unlock()

				e.samplingRate.Set(float64(newRate))

				log.Printf("Adaptive sampling updated: rate 1/%d -> 1/%d, qps=%d, error_rate=%d%%, reason=%s",
					oldRate, newRate, qps, errorRatePct, reason)
			}
		}

		_ = buf
	}
}

func (e *Exporter) Close() {
	close(e.stopChan)
}
