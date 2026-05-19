package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"ebpf-microservice-monitor/pkg/container"
	"ebpf-microservice-monitor/pkg/metrics"
	"ebpf-microservice-monitor/pkg/topology"

	"github.com/cilium/ebpf/link"
	"github.com/cilium/ebpf/ringbuf"
	"github.com/cilium/ebpf/rlimit"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

//go:generate go run github.com/cilium/ebpf/cmd/bpf2go -cc clang-14 monitor ../bpf/monitor.bpf.c -- -I../bpf/headers

type Config struct {
	SampleRate          uint64
	AggregationInterval time.Duration
	EnableHTTPParsing   bool
	EnableTCPStats      bool
	EnableSyscallStats  bool
	EnableMemoryStats   bool
}

func DefaultConfig() Config {
	return Config{
		SampleRate:          100,
		AggregationInterval: 5 * time.Second,
		EnableHTTPParsing:   true,
		EnableTCPStats:      true,
		EnableSyscallStats:  true,
		EnableMemoryStats:   true,
	}
}

func main() {
	if err := rlimit.RemoveMemlock(); err != nil {
		log.Fatalf("Failed to remove memlock limit: %v", err)
	}

	cfg := DefaultConfig()

	objs := monitorObjects{}
	if err := loadMonitorObjects(&objs, nil); err != nil {
		log.Fatalf("Loading eBPF objects: %v", err)
	}
	defer objs.Close()

	rd, err := ringbuf.NewReader(objs.Events)
	if err != nil {
		log.Fatalf("Failed to create ringbuf reader: %v", err)
	}
	defer rd.Close()

	ebpfMaps := &metrics.MonitorObjects{
		HttpStats:     objs.HttpStats,
		TcpStats:      objs.TcpStats,
		SyscallStats:  objs.SyscallStats,
		MemoryStats:   objs.MemoryStats,
		AdaptiveState: objs.AdaptiveState,
		Events:        rd,
	}

	containerMgr, err := container.NewManager()
	if err != nil {
		log.Printf("Warning: Failed to initialize container manager: %v", err)
	} else {
		defer containerMgr.Close()
	}

	topologyMgr := topology.NewManager(containerMgr)
	defer topologyMgr.Close()

	metricsExporter := metrics.NewExporter(topologyMgr, ebpfMaps)
	defer metricsExporter.Close()

	links := attachProbes(&objs, &cfg)
	for _, l := range links {
		defer l.Close()
	}

	go func() {
		http.Handle("/metrics", promhttp.Handler())
		log.Println("Prometheus metrics endpoint listening on :9090/metrics")
		if err := http.ListenAndServe(":9090", nil); err != nil {
			log.Fatalf("Failed to serve metrics: %v", err)
		}
	}()

	go metricsExporter.StartAggregationReader(cfg.AggregationInterval)
	go metricsExporter.ProcessEvents(ebpfMaps.Events)
	go topologyMgr.Start()

	log.Println("eBPF microservice monitor started successfully (adaptive sampling enabled)")
	log.Printf("  - Initial sample rate: 1/%d", cfg.SampleRate)
	log.Printf("  - Aggregation interval: %v", cfg.AggregationInterval)
	log.Printf("  - API endpoints:")
	log.Printf("    - /metrics (Prometheus)")
	log.Printf("    - /api/sampling/state (adaptive sampling status)")
	log.Printf("    - /api/sampling/rate (set sample rate via POST)")

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("Shutting down...")
}

func attachProbes(objs *monitorObjects, cfg *Config) []link.Link {
	var links []link.Link

	if cfg.EnableHTTPParsing {
		l, err := link.Tracepoint("syscalls", "sys_enter_write", objs.TracepointSysEnterWrite, nil)
		if err != nil {
			log.Printf("Warning: Failed to attach sys_enter_write: %v", err)
		} else {
			links = append(links, l)
		}
	}

	l, err := link.Kprobe("tcp_v4_connect", objs.KprobeTcpV4Connect, nil)
	if err != nil {
		log.Printf("Warning: Failed to attach tcp_v4_connect: %v", err)
	} else {
		links = append(links, l)
	}

	if cfg.EnableTCPStats {
		l, err = link.Kprobe("tcp_retransmit_skb", objs.KprobeTcpRetransmitSkb, nil)
		if err != nil {
			log.Printf("Warning: Failed to attach tcp_retransmit_skb: %v", err)
		} else {
			links = append(links, l)
		}

		l, err = link.Kprobe("tcp_drop", objs.KprobeTcpDrop, nil)
		if err != nil {
			log.Printf("Warning: Failed to attach tcp_drop: %v", err)
		} else {
			links = append(links, l)
		}
	}

	if cfg.EnableSyscallStats {
		l, err = link.Tracepoint("syscalls", "sys_exit", objs.TracepointSysExit, nil)
		if err != nil {
			log.Printf("Warning: Failed to attach sys_exit: %v", err)
		} else {
			links = append(links, l)
		}
	}

	if cfg.EnableMemoryStats {
		l, err = link.Kprobe("kmalloc", objs.KprobeKmalloc, nil)
		if err != nil {
			log.Printf("Warning: Failed to attach kmalloc: %v", err)
		} else {
			links = append(links, l)
		}

		l, err = link.Kprobe("__vmalloc_node_range", objs.KprobeVmallocNodeRange, nil)
		if err != nil {
			log.Printf("Warning: Failed to attach __vmalloc_node_range: %v", err)
		} else {
			links = append(links, l)
		}
	}

	return links
}
