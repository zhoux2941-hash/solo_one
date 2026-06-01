package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"github.com/ebpf-net-audit/audit-engine/user/api"
	bpfpb "github.com/ebpf-net-audit/audit-engine/user/bpf"
	"github.com/ebpf-net-audit/audit-engine/user/config"
	"github.com/ebpf-net-audit/audit-engine/user/control"
	"github.com/ebpf-net-audit/audit-engine/user/sampling"
	"github.com/ebpf-net-audit/audit-engine/user/store"
)

var (
	connCount    int64
	blockCount   int64
	sampleCount  int64
)

func main() {
	iface := flag.String("i", "eth0", "Network interface to monitor")
	configPath := flag.String("c", "config.yaml", "Config file path")
	dbPath := flag.String("db", "net_audit.db", "Database path")
	apiPort := flag.Int("p", 8080, "API server port")
	apiHost := flag.String("h", "127.0.0.1", "API server host")
	flag.Parse()

	if os.Geteuid() != 0 {
		log.Fatal("This program must be run as root")
	}

	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Printf("Warning: Could not load config: %v", err)
	}

	if cfg != nil {
		if cfg.Interface != "" {
			*iface = cfg.Interface
		}
		if cfg.DBPath != "" {
			*dbPath = cfg.DBPath
		}
		if cfg.APIPort > 0 {
			*apiPort = cfg.APIPort
		}
		if cfg.APIHost != "" {
			*apiHost = cfg.APIHost
		}
	}

	log.Printf("Starting eBPF Network Audit Engine on interface: %s", *iface)

	st, err := store.NewStore(*dbPath, 1000)
	if err != nil {
		log.Fatalf("Failed to create store: %v", err)
	}
	defer st.Close()

	bpfMgr := bpfpb.NewBPFManager(*iface)
	if err := bpfMgr.Load(); err != nil {
		log.Fatalf("Failed to load BPF programs: %v", err)
	}
	defer bpfMgr.Stop()

	ruleMgr := control.NewRuleManager(bpfMgr, st)
	if err := ruleMgr.LoadRulesFromDB(); err != nil {
		log.Printf("Warning: Failed to load rules from DB: %v", err)
	}

	sampler := sampling.NewSampler(bpfMgr)
	if cfg != nil && cfg.Sampling.Enabled {
		if err := sampler.SetConfig(cfg.Sampling.SampleRate, cfg.Sampling.ExcludePorts); err != nil {
			log.Printf("Warning: Failed to set sampling config: %v", err)
		}
	} else {
		if err := sampler.SetConfig(1000, []uint16{80}); err != nil {
			log.Printf("Warning: Failed to set default sampling config: %v", err)
		}
	}

	bpfMgr.SetCallbacks(
		func(event *bpfpb.ConnectionEvent) {
			connCount++
			st.InsertConnection(event)

			if connCount%10000 == 0 {
				log.Printf("Connections: %d, Blocked: %d, Samples: %d",
					connCount, blockCount, sampleCount)
			}
		},
		func(event *bpfpb.BlockEvent) {
			blockCount++
			st.InsertBlock(event)
			log.Printf("BLOCKED: %s(%d) %s:%d -> %s:%d %s - %s",
				event.CommString(), event.Meta.PID,
				event.Meta.SourceIP(), event.Meta.SourcePort(),
				event.Meta.DestIP(), event.Meta.DestPort(),
				event.Meta.ProtocolName(),
				event.ReasonString())
		},
		func(event *bpfpb.SampleEvent) {
			sampleCount++
			st.InsertSample(event)
		},
	)

	bpfMgr.Start()

	server := api.NewServer(st, ruleMgr, sampler, bpfMgr, *apiHost, *apiPort)
	go func() {
		if err := server.Start(); err != nil {
			log.Printf("API server error: %v", err)
		}
	}()

	go statsCollector(st)

	go domainRefreshLoop(ruleMgr)

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	log.Println("Shutting down...")
	log.Printf("Final stats - Connections: %d, Blocked: %d, Samples: %d",
		connCount, blockCount, sampleCount)
}

func statsCollector(st *store.Store) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	var m runtime.MemStats
	for range ticker.C {
		runtime.ReadMemStats(&m)
		cpuUsage := getCPUUsage()

		if err := st.InsertStats(connCount, blockCount, sampleCount,
			cpuUsage, int64(m.Alloc)); err != nil {
			log.Printf("Insert stats error: %v", err)
		}
	}
}

func getCPUUsage() float64 {
	var statFile *os.File
	var err error

	statFile, err = os.Open("/proc/self/stat")
	if err != nil {
		return 0
	}
	defer statFile.Close()

	var pid int
	var comm string
	var state string
	var ppid, pgrp, session, tty_nr, tpgid int
	var flags uint
	var minflt, cminflt, majflt, cmajflt uint
	var utime, stime, cutime, cstime int

	_, err = fmt.Fscanf(statFile, "%d %s %c %d %d %d %d %d %u %u %u %u %u %u %u %d %d %d %d",
		&pid, &comm, &state, &ppid, &pgrp, &session, &tty_nr, &tpgid, &flags,
		&minflt, &cminflt, &majflt, &cmajflt, &utime, &stime, &cutime, &cstime)
	if err != nil {
		return 0
	}

	totalTime := utime + stime + cutime + cstime
	clkTck := 100
	seconds := 10.0

	return float64(totalTime) / float64(clkTck) / seconds * 100
}

func domainRefreshLoop(rm *control.RuleManager) {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		if err := rm.RefreshDomainRules(); err != nil {
			log.Printf("Domain refresh error: %v", err)
		}
	}
}
