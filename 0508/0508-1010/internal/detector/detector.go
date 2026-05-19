package detector

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/container-escaper/ebpf-detector/internal/config"
	"github.com/container-escaper/ebpf-detector/internal/container"
	"github.com/container-escaper/ebpf-detector/internal/elasticsearch"
	"github.com/container-escaper/ebpf-detector/internal/events"
	"github.com/container-escaper/ebpf-detector/internal/protection"
)

type renameRecord struct {
	oldPath   string
	newPath   string
	timestamp time.Time
}

type Detector struct {
	cfg             *config.Config
	containerMgr    *container.Manager
	esOutput        *elasticsearch.Output
	alertChan       chan *events.Alert
	containerIDMap  map[uint32]string
	containerIDLock sync.RWMutex
	renameTracker   map[uint32][]renameRecord
	renameLock      sync.RWMutex
	fdPathMap       map[uint32]map[int32]string
	fdPathLock      sync.RWMutex
	selfProtection  *protection.SelfProtection
}

func NewDetector(cfg *config.Config, containerMgr *container.Manager, esOutput *elasticsearch.Output) *Detector {
	alertChan := make(chan *events.Alert, 1000)
	
	sp, err := protection.NewSelfProtection(alertChan)
	if err != nil {
		log.Printf("Warning: failed to create self-protection: %v", err)
	}
	
	return &Detector{
		cfg:            cfg,
		containerMgr:   containerMgr,
		esOutput:       esOutput,
		alertChan:      alertChan,
		containerIDMap: make(map[uint32]string),
		renameTracker:  make(map[uint32][]renameRecord),
		fdPathMap:      make(map[uint32]map[int32]string),
		selfProtection: sp,
	}
}

func (d *Detector) GetSelfProtection() *protection.SelfProtection {
	return d.selfProtection
}

func (d *Detector) ProcessEvent(e *events.Event) {
	if e.EventType == events.EventSelfProtection {
		if d.selfProtection != nil {
			d.selfProtection.HandleSelfProtectionEvent(e)
		}
		return
	}

	if d.cfg.IsContainerWhitelisted(e.ContainerID, "", e.Comm) {
		return
	}

	if d.cfg.IsContainerBlacklisted(e.ContainerID, "", e.Comm) {
		d.generateAlert(e, events.SeverityHigh, "blacklisted_container",
			"Container is in blacklist")
		return
	}

	if e.IsSuspicious {
		d.generateAlert(e, events.SeverityHigh, "suspicious_event",
			"Suspicious event detected by kernel")
	}

	for _, rule := range d.cfg.Rules {
		if !rule.Enabled {
			continue
		}

		if rule.EventType != e.EventType.String() {
			continue
		}

		if d.matchRule(e, &rule) {
			severity := events.AlertSeverity(rule.Severity)
			d.generateAlert(e, severity, rule.Name, rule.Description)
		}
	}

	switch e.EventType {
	case events.EventPrivileged:
		d.handlePrivilegedEvent(e)
	case events.EventCVE20220492:
		d.handleCVE20220492(e)
	case events.EventMount:
		d.handleMountEvent(e)
	case events.EventCgroup:
		d.handleCgroupEvent(e)
	case events.EventUnshare:
		d.handleUnshareEvent(e)
	case events.EventRename:
		d.handleRenameEvent(e)
	case events.EventPathBypassAttempt:
		d.handlePathBypassEvent(e)
	case events.EventSymlink:
		d.handleSymlinkEvent(e)
	case events.EventExecve:
		d.handleExecveEvent(e)
	}
}

func (d *Detector) matchRule(e *events.Event, rule *config.Rule) bool {
	if len(rule.MatchComms) > 0 {
		commMatch := false
		for _, comm := range rule.MatchComms {
			if strings.Contains(e.Comm, comm) {
				commMatch = true
				break
			}
		}
		if !commMatch {
			return false
		}
	}

	if len(rule.WhitelistComms) > 0 {
		for _, comm := range rule.WhitelistComms {
			if strings.Contains(e.Comm, comm) {
				return false
			}
		}
	}

	if len(rule.MatchPaths) > 0 {
		pathMatch := false
		for _, path := range rule.MatchPaths {
			if strings.Contains(e.Path1, path) || strings.Contains(e.Path2, path) {
				pathMatch = true
				break
			}
		}
		if !pathMatch {
			return false
		}
	}

	if len(rule.WhitelistPaths) > 0 {
		for _, path := range rule.WhitelistPaths {
			if strings.Contains(e.Path1, path) || strings.Contains(e.Path2, path) {
				return false
			}
		}
	}

	return true
}

func (d *Detector) handlePrivilegedEvent(e *events.Event) {
	if e.UID != 0 {
		return
	}

	d.generateAlert(e, events.SeverityCritical, "privileged_operation",
		fmt.Sprintf("Privileged operation detected: %s", e.Comm))
}

func (d *Detector) handleCVE20220492(e *events.Event) {
	d.generateAlert(e, events.SeverityCritical, "cve_2022_0492_attempt",
		"Potential CVE-2022-0492 exploit attempt detected")
}

func (d *Detector) handleMountEvent(e *events.Event) {
	suspiciousPaths := []string{
		"/proc/self/mountinfo",
		"/proc/1/root",
		"/var/run/docker.sock",
		"/run/containerd",
		"/host",
	}

	for _, path := range suspiciousPaths {
		if strings.Contains(e.Path1, path) || strings.Contains(e.Path2, path) {
			d.generateAlert(e, events.SeverityHigh, "suspicious_mount",
				fmt.Sprintf("Suspicious mount operation detected: %s -> %s", e.Path1, e.Path2))
			return
		}
	}
}

func (d *Detector) handleCgroupEvent(e *events.Event) {
	suspiciousPaths := []string{
		"release_agent",
		"notify_on_release",
		"cgroup.procs",
	}

	for _, path := range suspiciousPaths {
		if strings.Contains(e.Path1, path) {
			d.generateAlert(e, events.SeverityHigh, "cgroup_modification",
				fmt.Sprintf("Suspicious cgroup modification: %s", e.Path1))
			return
		}
	}
}

func (d *Detector) handleUnshareEvent(e *events.Event) {
	flags := e.Arg1
	dangerousFlags := []struct {
		flag uint64
		name string
	}{
		{0x00020000, "NEWUSER"},
		{0x20000000, "NEWNET"},
		{0x10000000, "NEWNS"},
		{0x02000000, "NEWPID"},
		{0x01000000, "NEWUTS"},
	}

	var detected []string
	for _, df := range dangerousFlags {
		if flags&df.flag != 0 {
			detected = append(detected, df.name)
		}
	}

	if len(detected) > 0 {
		d.generateAlert(e, events.SeverityMedium, "namespace_isolation",
			fmt.Sprintf("Unshare with dangerous namespaces: %s", strings.Join(detected, ", ")))
	}
}

func (d *Detector) handleRenameEvent(e *events.Event) {
	d.trackRename(e.PID, e.Path1, e.Path2)

	suspiciousOld := d.isSuspiciousPath(e.Path1)
	suspiciousNew := d.isSuspiciousPath(e.Path2)

	if suspiciousOld || suspiciousNew {
		d.generateAlert(e, events.SeverityHigh, "suspicious_rename",
			fmt.Sprintf("Suspicious rename operation: %s -> %s", e.Path1, e.Path2))
	}

	if d.checkPathBypassAttempt(e.PID, e.Path2) {
		d.generateAlert(e, events.SeverityCritical, "rename_bypass_attempt",
			fmt.Sprintf("Potential rename bypass attempt detected: %s -> %s", e.Path1, e.Path2))
	}
}

func (d *Detector) handlePathBypassEvent(e *events.Event) {
	d.generateAlert(e, events.SeverityCritical, "path_bypass_detected",
		fmt.Sprintf("Path bypass attempt detected: %s %s", e.Path1, e.Path2))
}

func (d *Detector) handleSymlinkEvent(e *events.Event) {
	if d.isSuspiciousPath(e.Path1) || d.isSuspiciousPath(e.Path2) {
		d.generateAlert(e, events.SeverityHigh, "suspicious_symlink",
			fmt.Sprintf("Suspicious symlink creation: %s -> %s", e.Path1, e.Path2))
	}

	if strings.Contains(e.Path2, "/proc/") || strings.Contains(e.Path2, "/sys/") {
		d.generateAlert(e, events.SeverityCritical, "symlink_bypass_attempt",
			fmt.Sprintf("Symlink to sensitive path detected: %s -> %s", e.Path1, e.Path2))
	}
}

func (d *Detector) handleExecveEvent(e *events.Event) {
	if d.isSuspiciousPath(e.Path1) {
		d.generateAlert(e, events.SeverityCritical, "suspicious_execve",
			fmt.Sprintf("Execution from suspicious path: %s", e.Path1))
	}

	if d.checkPathBypassAttempt(e.PID, e.Path1) {
		d.generateAlert(e, events.SeverityCritical, "execve_bypass_attempt",
			fmt.Sprintf("Potential execve bypass attempt: %s", e.Path1))
	}
}

func (d *Detector) isSuspiciousPath(path string) bool {
	suspiciousPatterns := []string{
		"/proc/self/mountinfo",
		"/proc/1/root",
		"/var/run/docker.sock",
		"/run/containerd",
		"/host",
		"/sys/fs/cgroup",
		"/proc/self/exe",
		"/.dockerenv",
		"release_agent",
		"notify_on_release",
		"cgroup.procs",
	}

	for _, pattern := range suspiciousPatterns {
		if strings.Contains(path, pattern) {
			return true
		}
	}
	return false
}

func (d *Detector) trackRename(pid uint32, oldPath, newPath string) {
	d.renameLock.Lock()
	defer d.renameLock.Unlock()

	if d.renameTracker[pid] == nil {
		d.renameTracker[pid] = make([]renameRecord, 0, 10)
	}

	d.renameTracker[pid] = append(d.renameTracker[pid], renameRecord{
		oldPath:   oldPath,
		newPath:   newPath,
		timestamp: time.Now(),
	})

	if len(d.renameTracker[pid]) > 20 {
		d.renameTracker[pid] = d.renameTracker[pid][len(d.renameTracker[pid])-20:]
	}
}

func (d *Detector) checkPathBypassAttempt(pid uint32, currentPath string) bool {
	d.renameLock.RLock()
	defer d.renameLock.RUnlock()

	records, exists := d.renameTracker[pid]
	if !exists {
		return false
	}

	now := time.Now()
	for _, record := range records {
		if now.Sub(record.timestamp) > 5*time.Second {
			continue
		}

		if strings.Contains(currentPath, record.newPath) {
			if d.isSuspiciousPath(record.oldPath) {
				return true
			}
		}

		if d.isSuspiciousPath(record.oldPath) || d.isSuspiciousPath(record.newPath) {
			return true
		}
	}

	return false
}

func (d *Detector) trackFD(pid uint32, fd int32, path string) {
	d.fdPathLock.Lock()
	defer d.fdPathLock.Unlock()

	if d.fdPathMap[pid] == nil {
		d.fdPathMap[pid] = make(map[int32]string)
	}
	d.fdPathMap[pid][fd] = path
}

func (d *Detector) getFDPath(pid uint32, fd int32) string {
	d.fdPathLock.RLock()
	defer d.fdPathLock.RUnlock()

	if pidMap, exists := d.fdPathMap[pid]; exists {
		if path, ok := pidMap[fd]; ok {
			return path
		}
	}
	return ""
}

func (d *Detector) cleanOldRecords() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		d.renameLock.Lock()
		cutoff := time.Now().Add(-30 * time.Second)
		for pid, records := range d.renameTracker {
			valid := make([]renameRecord, 0, len(records))
			for _, r := range records {
				if r.timestamp.After(cutoff) {
					valid = append(valid, r)
				}
			}
			if len(valid) == 0 {
				delete(d.renameTracker, pid)
			} else {
				d.renameTracker[pid] = valid
			}
		}
		d.renameLock.Unlock()
	}
}

func (d *Detector) generateAlert(e *events.Event, severity events.AlertSeverity, ruleName, description string) {
	alert := &events.Alert{
		ID:          generateID(),
		Timestamp:   e.Timestamp,
		Severity:    severity,
		EventType:   e.EventType,
		Description: description,
		Event:       e,
		RuleName:    ruleName,
	}

	if e.ContainerID != "" && d.containerMgr != nil {
		ctx := context.Background()
		info, err := d.containerMgr.GetContainerInfo(ctx, e.ContainerID)
		if err == nil {
			alert.ContainerInfo = info
		}
	}

	select {
	case d.alertChan <- alert:
	default:
		log.Printf("Alert channel full, dropping alert: %s", description)
	}

	log.Printf("[%s] %s: %s (container: %s, pid: %d, comm: %s)",
		severity, ruleName, description, e.ContainerID, e.PID, e.Comm)

	if d.esOutput != nil {
		d.esOutput.Send(alert)
	}
}

func (d *Detector) Alerts() <-chan *events.Alert {
	return d.alertChan
}

func (d *Detector) SetContainerID(pid uint32, containerID string) {
	d.containerIDLock.Lock()
	defer d.containerIDLock.Unlock()
	d.containerIDMap[pid] = containerID
}

func (d *Detector) GetContainerID(pid uint32) string {
	d.containerIDLock.RLock()
	defer d.containerIDLock.RUnlock()
	return d.containerIDMap[pid]
}

func generateID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}
