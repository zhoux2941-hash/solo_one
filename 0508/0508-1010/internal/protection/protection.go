package protection

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"sync"
	"sync/atomic"
	"time"

	"github.com/container-escaper/ebpf-detector/internal/events"
)

type HealthStatus struct {
	IsHealthy    bool
	LastHeartbeat time.Time
	BPFProgOK    bool
	RingBufOK    bool
	MapsOK       bool
	Error        string
}

type SelfProtection struct {
	pid             int
	binaryPath      string
	originalHash    string
	heartbeatCount  uint64
	alertChan       chan *events.Alert
	mu              sync.RWMutex
	healthStatus    HealthStatus
	criticalSection int32
}

func NewSelfProtection(alertChan chan *events.Alert) (*SelfProtection, error) {
	sp := &SelfProtection{
		pid:         os.Getpid(),
		binaryPath:  os.Args[0],
		alertChan:   alertChan,
		healthStatus: HealthStatus{
			IsHealthy: true,
		},
	}

	hash, err := sp.calculateBinaryHash()
	if err != nil {
		log.Printf("Warning: failed to calculate binary hash: %v", err)
	} else {
		sp.originalHash = hash
		log.Printf("Binary hash: %s", hash)
	}

	return sp, nil
}

func (sp *SelfProtection) calculateBinaryHash() (string, error) {
	data, err := os.ReadFile(sp.binaryPath)
	if err != nil {
		return "", err
	}

	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:]), nil
}

func (sp *SelfProtection) Start(ctx context.Context) {
	go sp.healthCheckLoop(ctx)
	go sp.integrityCheckLoop(ctx)
}

func (sp *SelfProtection) GetPID() int {
	return sp.pid
}

func (sp *SelfProtection) GetHealthStatus() HealthStatus {
	sp.mu.RLock()
	defer sp.mu.RUnlock()
	return sp.healthStatus
}

func (sp *SelfProtection) healthCheckLoop(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			sp.performHealthCheck()
		}
	}
}

func (sp *SelfProtection) performHealthCheck() {
	sp.mu.Lock()
	defer sp.mu.Unlock()

	sp.heartbeatCount++
	sp.healthStatus.LastHeartbeat = time.Now()

	atomic.AddInt32(&sp.criticalSection, 1)
	defer atomic.AddInt32(&sp.criticalSection, -1)

	if sp.heartbeatCount%12 == 0 {
		log.Printf("Heartbeat: detector running (pid=%d, count=%d)", sp.pid, sp.heartbeatCount)
	}
}

func (sp *SelfProtection) integrityCheckLoop(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			sp.performIntegrityCheck()
		}
	}
}

func (sp *SelfProtection) performIntegrityCheck() {
	if sp.originalHash == "" {
		return
	}

	currentHash, err := sp.calculateBinaryHash()
	if err != nil {
		log.Printf("Warning: failed to check binary integrity: %v", err)
		return
	}

	if currentHash != sp.originalHash {
		sp.mu.Lock()
		sp.healthStatus.IsHealthy = false
		sp.healthStatus.Error = fmt.Sprintf("Binary integrity check failed: expected %s, got %s",
			sp.originalHash, currentHash)
		sp.mu.Unlock()

		sp.sendCriticalAlert("binary_tampering_detected",
			fmt.Sprintf("Detector binary has been tampered with! Original hash: %s, Current hash: %s",
				sp.originalHash, currentHash))
	}
}

func (sp *SelfProtection) sendCriticalAlert(ruleName, description string) {
	alert := &events.Alert{
		ID:          fmt.Sprintf("self-protect-%d", time.Now().UnixNano()),
		Timestamp:   uint64(time.Now().UnixNano()),
		Severity:    events.SeverityCritical,
		EventType:   events.EventSelfProtection,
		Description: description,
		RuleName:    ruleName,
		Event: &events.Event{
			PID:        uint32(sp.pid),
			Timestamp:  uint64(time.Now().UnixNano()),
			EventType:  events.EventSelfProtection,
			Comm:       "ebpf-detector",
		},
	}

	select {
	case sp.alertChan <- alert:
	default:
		log.Printf("CRITICAL: %s - %s", ruleName, description)
	}
}

func (sp *SelfProtection) ReportBPFHealth(bpfOK, ringBufOK, mapsOK bool, err error) {
	sp.mu.Lock()
	defer sp.mu.Unlock()

	sp.healthStatus.BPFProgOK = bpfOK
	sp.healthStatus.RingBufOK = ringBufOK
	sp.healthStatus.MapsOK = mapsOK

	if err != nil {
		sp.healthStatus.IsHealthy = false
		sp.healthStatus.Error = err.Error()
		sp.sendCriticalAlert("bpf_health_failure",
			fmt.Sprintf("BPF health check failed: %v", err))
	} else if bpfOK && ringBufOK && mapsOK {
		sp.healthStatus.IsHealthy = true
		sp.healthStatus.Error = ""
	}
}

func (sp *SelfProtection) HandleSelfProtectionEvent(e *events.Event) {
	var description string
	switch e.Path1 {
	case "kill_protected_process":
		description = fmt.Sprintf("Attempt to kill detector process detected: pid=%d, attacker_pid=%d, comm=%s",
			sp.pid, e.PID, e.Comm)
	case "ptrace_protected_process":
		description = fmt.Sprintf("Attempt to ptrace detector process detected: pid=%d, attacker_pid=%d, comm=%s",
			sp.pid, e.PID, e.Comm)
	case "bpf_unload_attempt":
		description = fmt.Sprintf("Attempt to unload BPF program detected: attacker_pid=%d, comm=%s",
			e.PID, e.Comm)
	case "bpf_prog_unload_attempt":
		description = fmt.Sprintf("BPF program unload attempt detected (kernel level): attacker_pid=%d, comm=%s",
			e.PID, e.Comm)
	default:
		description = fmt.Sprintf("Self-protection event: %s from pid=%d, comm=%s",
			e.Path1, e.PID, e.Comm)
	}

	sp.sendCriticalAlert("self_protection_triggered", description)
}

func (sp *SelfProtection) LockMemory() error {
	return nil
}

func (sp *SelfProtection) SetProcessName(name string) error {
	return nil
}

func (sp *SelfProtection) VerifyMagicNumber(e *events.Event) bool {
	return true
}
