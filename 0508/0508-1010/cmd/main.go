package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/container-escaper/ebpf-detector/internal/bpf"
	"github.com/container-escaper/ebpf-detector/internal/config"
	"github.com/container-escaper/ebpf-detector/internal/container"
	"github.com/container-escaper/ebpf-detector/internal/detector"
	"github.com/container-escaper/ebpf-detector/internal/elasticsearch"
)

func main() {
	configPath := flag.String("config", "./configs/config.yaml", "Path to config file")
	bpfObjPath := flag.String("bpf", "", "Path to BPF object file")
	pinPath := flag.String("pin", "/sys/fs/bpf/container_escaper_detector", "Path to pin BPF objects")
	flag.Parse()

	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if *bpfObjPath != "" {
		cfg.BPF.BPFObjPath = *bpfObjPath
	}

	log.SetFlags(log.LstdFlags | log.Lmicroseconds)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	var containerMgr *container.Manager
	var esOutput *elasticsearch.Output

	if cfg.Container.Runtime != "none" {
		containerMgr, err = container.NewManager(
			cfg.Container.Runtime,
			cfg.Container.Docker,
			cfg.Container.Containerd,
		)
		if err != nil {
			log.Printf("Warning: failed to create container manager: %v", err)
		} else {
			defer containerMgr.Close()
			log.Printf("Container manager initialized with runtime: %s", cfg.Container.Runtime)
		}
	}

	if cfg.Elasticsearch.Enabled {
		esOutput, err = elasticsearch.NewOutput(elasticsearch.Config{
			URLs:     cfg.Elasticsearch.URLs,
			Username: cfg.Elasticsearch.Username,
			Password: cfg.Elasticsearch.Password,
			Index:    cfg.Elasticsearch.Index,
		})
		if err != nil {
			log.Printf("Warning: failed to create elasticsearch output: %v", err)
		} else {
			defer esOutput.Close()
			log.Printf("Elasticsearch output initialized: %v", cfg.Elasticsearch.URLs)
		}
	}

	det := detector.NewDetector(cfg, containerMgr, esOutput)

	bpfProg, err := bpf.LoadBPFProgram(cfg.BPF.BPFObjPath)
	if err != nil {
		log.Fatalf("Failed to load BPF program: %v", err)
	}
	defer bpfProg.Close()

	selfProtect := det.GetSelfProtection()
	if selfProtect != nil {
		selfProtect.Start(ctx)
		log.Printf("Self-protection activated, detector PID: %d", selfProtect.GetPID())

		if err := bpfProg.ProtectPID(uint32(selfProtect.GetPID())); err != nil {
			log.Printf("Warning: failed to register protected PID with BPF: %v", err)
		} else {
			log.Printf("Detector PID %d registered as protected in BPF", selfProtect.GetPID())
		}
	}

	if err := bpfProg.Pin(*pinPath); err != nil {
		log.Printf("Warning: failed to pin BPF objects: %v", err)
	} else {
		log.Printf("BPF objects pinned to: %s", *pinPath)
	}

	bpfProg.Start()
	log.Println("BPF program loaded and started")

	if containerMgr != nil {
		go func() {
			if err := containerMgr.RefreshCache(ctx); err != nil {
				log.Printf("Failed to refresh container cache: %v", err)
			}
		}()
	}

	go func() {
		for event := range bpfProg.Events() {
			det.ProcessEvent(event)
		}
	}()

	go func() {
		for alert := range det.Alerts() {
			log.Printf("ALERT [%s] %s: %s (container: %s)",
				alert.Severity, alert.RuleName, alert.Description,
				alert.Event.ContainerID)

			if esOutput != nil {
				esOutput.Send(alert)
			}
		}
	}()

	log.Println("Container escape detector is running...")
	log.Printf("Monitoring for: mount escapes, cgroup modifications, privileged operations, unshare escapes, CVE-2022-0492")
	log.Printf("Self-protection: active (kill/ptrace/bpf_unload attempts will be detected)")

	<-sigCh
	log.Println("Shutting down...")
	cancel()

	fmt.Println("Goodbye!")
}
