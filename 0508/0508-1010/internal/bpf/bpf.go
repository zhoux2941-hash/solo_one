package bpf

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/cilium/ebpf"
	"github.com/cilium/ebpf/link"
	"github.com/cilium/ebpf/ringbuf"
	"github.com/container-escaper/ebpf-detector/internal/events"
)

//go:generate go run github.com/cilium/ebpf/cmd/bpf2go -cc clang -cflags "-O2 -g -Wall -Werror" escaperDetector ../bpf/escaper_detector.bpf.c -- -I../bpf

type BPFProgram struct {
	objects           *escaperDetectorObjects
	tpEnter           link.Link
	tpExit            link.Link
	kpMount           link.Link
	kpCgroupMkdir     link.Link
	kpAttachCgroup    link.Link
	kpBprmCheck       link.Link
	kpUnshare         link.Link
	kpVfsRename       link.Link
	kpPathLink        link.Link
	kpBpfProgPut      link.Link
	reader            *ringbuf.Reader
	eventChan         chan *events.Event
	pinPath           string
	pinned            bool
}

type bpfEvent struct {
	Pid          uint32
	Tgid         uint32
	Uid          uint32
	Gid          uint32
	Timestamp    uint64
	EventType    uint32
	SyscallNr    int32
	Comm         [16]byte
	ContainerID  [64]byte
	Arg1         uint64
	Arg2         uint64
	Arg3         uint64
	Arg4         uint64
	Path1        [256]byte
	Path2        [256]byte
	PathResolved [256]byte
	Retval       int32
	IsSuspicious uint8
	Magic        uint32
}

func LoadBPFProgram(objPath string) (*BPFProgram, error) {
	spec, err := ebpf.LoadCollectionSpec(objPath)
	if err != nil {
		return nil, fmt.Errorf("failed to load BPF object: %w", err)
	}

	var objs escaperDetectorObjects
	if err := spec.LoadAndAssign(&objs, nil); err != nil {
		return nil, fmt.Errorf("failed to load and assign BPF objects: %w", err)
	}

	tpEnter, err := link.Tracepoint("syscalls", "sys_enter", objs.TracepointSysEnter, nil)
	if err != nil {
		objs.Close()
		return nil, fmt.Errorf("failed to attach sys_enter tracepoint: %w", err)
	}

	tpExit, err := link.Tracepoint("syscalls", "sys_exit", objs.TracepointSysExit, nil)
	if err != nil {
		tpEnter.Close()
		objs.Close()
		return nil, fmt.Errorf("failed to attach sys_exit tracepoint: %w", err)
	}

	kpMount, err := link.Kprobe("do_mount", objs.KprobeDoMount, nil)
	if err != nil {
		log.Printf("Warning: failed to attach do_mount kprobe: %v", err)
	}

	kpCgroupMkdir, err := link.Kprobe("cgroup_mkdir", objs.KprobeCgroupMkdir, nil)
	if err != nil {
		log.Printf("Warning: failed to attach cgroup_mkdir kprobe: %v", err)
	}

	kpAttachCgroup, err := link.Kprobe("attach_pid_cgroup", objs.KprobeAttachPidCgroup, nil)
	if err != nil {
		log.Printf("Warning: failed to attach attach_pid_cgroup kprobe: %v", err)
	}

	kpBprmCheck, err := link.Kprobe("security_bprm_check", objs.KprobeSecurityBprmCheck, nil)
	if err != nil {
		log.Printf("Warning: failed to attach security_bprm_check kprobe: %v", err)
	}

	kpUnshare, err := link.Kprobe("unshare_process", objs.KprobeUnshareProcess, nil)
	if err != nil {
		log.Printf("Warning: failed to attach unshare_process kprobe: %v", err)
	}

	kpVfsRename, err := link.Kprobe("vfs_rename", objs.KprobeVfsRename, nil)
	if err != nil {
		log.Printf("Warning: failed to attach vfs_rename kprobe: %v", err)
	}

	kpPathLink, err := link.Kprobe("security_path_link", objs.KprobeSecurityPathLink, nil)
	if err != nil {
		log.Printf("Warning: failed to attach security_path_link kprobe: %v", err)
	}

	kpBpfProgPut, err := link.Kprobe("bpf_prog_put", objs.KprobeBpfProgPut, nil)
	if err != nil {
		log.Printf("Warning: failed to attach bpf_prog_put kprobe: %v", err)
	}

	reader, err := ringbuf.NewReader(objs.Events)
	if err != nil {
		tpEnter.Close()
		tpExit.Close()
		if kpMount != nil {
			kpMount.Close()
		}
		objs.Close()
		return nil, fmt.Errorf("failed to create ringbuf reader: %w", err)
	}

	return &BPFProgram{
		objects:        &objs,
		tpEnter:        tpEnter,
		tpExit:         tpExit,
		kpMount:        kpMount,
		kpCgroupMkdir:  kpCgroupMkdir,
		kpAttachCgroup: kpAttachCgroup,
		kpBprmCheck:    kpBprmCheck,
		kpUnshare:      kpUnshare,
		kpVfsRename:    kpVfsRename,
		kpPathLink:     kpPathLink,
		kpBpfProgPut:   kpBpfProgPut,
		reader:         reader,
		eventChan:      make(chan *events.Event, 10000),
	}, nil
}

func (p *BPFProgram) Start() {
	go p.pollEvents()
}

func (p *BPFProgram) pollEvents() {
	var event bpfEvent

	for {
		record, err := p.reader.Read()
		if err != nil {
			if err == ringbuf.ErrClosed {
				return
			}
			log.Printf("Error reading from ringbuf: %v", err)
			continue
		}

		if err := binary.Read(bytes.NewReader(record.RawSample), binary.LittleEndian, &event); err != nil {
			log.Printf("Error parsing event: %v", err)
			continue
		}

		if event.Magic != events.MagicNumber && event.EventType != uint32(events.EventHeartbeat) {
			log.Printf("Warning: event magic number mismatch, expected 0x%x got 0x%x", events.MagicNumber, event.Magic)
		}

		ev := convertEvent(&event)
		select {
		case p.eventChan <- ev:
		default:
		}
	}
}

func convertEvent(e *bpfEvent) *events.Event {
	return &events.Event{
		PID:          e.Pid,
		TGID:         e.Tgid,
		UID:          e.Uid,
		GID:          e.Gid,
		Timestamp:    e.Timestamp,
		EventType:    events.EventType(e.EventType),
		SyscallNr:    e.SyscallNr,
		Comm:         bytesToString(e.Comm[:]),
		ContainerID:  bytesToString(e.ContainerID[:]),
		Arg1:         e.Arg1,
		Arg2:         e.Arg2,
		Arg3:         e.Arg3,
		Arg4:         e.Arg4,
		Path1:        bytesToString(e.Path1[:]),
		Path2:        bytesToString(e.Path2[:]),
		PathResolved: bytesToString(e.PathResolved[:]),
		Retval:       e.Retval,
		IsSuspicious: e.IsSuspicious != 0,
	}
}

func bytesToString(b []byte) string {
	idx := bytes.IndexByte(b, 0)
	if idx == -1 {
		return string(b)
	}
	return string(b[:idx])
}

func (p *BPFProgram) Events() <-chan *events.Event {
	return p.eventChan
}

func (p *BPFProgram) UpdateContainerMap(pid uint32, containerID string) error {
	cid := make([]byte, 64)
	copy(cid, containerID)
	return p.objects.PidContainerMap.Put(&pid, &cid)
}

func (p *BPFProgram) MarkPrivileged(pid uint32, privileged bool) error {
	val := uint8(0)
	if privileged {
		val = 1
	}
	return p.objects.PrivilegedPids.Put(&pid, &val)
}

func (p *BPFProgram) ProtectPID(pid uint32) error {
	val := uint32(1)
	return p.objects.ProtectedPids.Put(&pid, &val)
}

func (p *BPFProgram) UnprotectPID(pid uint32) error {
	return p.objects.ProtectedPids.Delete(&pid)
}

func (p *BPFProgram) Pin(pinPath string) error {
	if err := os.MkdirAll(pinPath, 0700); err != nil {
		return fmt.Errorf("failed to create pin directory: %w", err)
	}

	progs := map[string]interface{}{
		"tracepoint_sys_enter":   p.objects.TracepointSysEnter,
		"tracepoint_sys_exit":    p.objects.TracepointSysExit,
		"kprobe_do_mount":        p.objects.KprobeDoMount,
		"kprobe_cgroup_mkdir":    p.objects.KprobeCgroupMkdir,
		"kprobe_attach_pid":      p.objects.KprobeAttachPidCgroup,
		"kprobe_bprm_check":      p.objects.KprobeSecurityBprmCheck,
		"kprobe_unshare":         p.objects.KprobeUnshareProcess,
		"kprobe_vfs_rename":      p.objects.KprobeVfsRename,
		"kprobe_path_link":       p.objects.KprobeSecurityPathLink,
		"kprobe_bpf_prog_put":    p.objects.KprobeBpfProgPut,
	}

	for name, prog := range progs {
		path := filepath.Join(pinPath, name)
		if err := p.pinObject(prog, path); err != nil {
			log.Printf("Warning: failed to pin %s: %v", name, err)
		}
	}

	maps := map[string]interface{}{
		"events":               p.objects.Events,
		"pid_container_map":    p.objects.PidContainerMap,
		"privileged_pids":      p.objects.PrivilegedPids,
		"protected_pids":       p.objects.ProtectedPids,
		"syscall_args_map":     p.objects.SyscallArgsMap,
		"fd_path_map":          p.objects.FdPathMap,
		"rename_tracker":       p.objects.RenameTracker,
		"heartbeat_map":        p.objects.HeartbeatMap,
		"program_state":        p.objects.ProgramState,
	}

	for name, m := range maps {
		path := filepath.Join(pinPath, name)
		if err := p.pinObject(m, path); err != nil {
			log.Printf("Warning: failed to pin map %s: %v", name, err)
		}
	}

	p.pinPath = pinPath
	p.pinned = true
	return nil
}

type pinnable interface {
	Pin(string) error
}

func (p *BPFProgram) pinObject(obj interface{}, path string) error {
	if pinnable, ok := obj.(pinnable); ok {
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("failed to remove existing pin: %w", err)
		}
		return pinnable.Pin(path)
	}
	return fmt.Errorf("object is not pinnable")
}

func (p *BPFProgram) Unpin() error {
	if p.pinPath == "" {
		return nil
	}

	if err := os.RemoveAll(p.pinPath); err != nil {
		return fmt.Errorf("failed to remove pin directory: %w", err)
	}

	p.pinned = false
	p.pinPath = ""
	return nil
}

func (p *BPFProgram) IsPinned() bool {
	return p.pinned
}

func (p *BPFProgram) Close() {
	if p.reader != nil {
		p.reader.Close()
	}
	if p.tpEnter != nil {
		p.tpEnter.Close()
	}
	if p.tpExit != nil {
		p.tpExit.Close()
	}
	if p.kpMount != nil {
		p.kpMount.Close()
	}
	if p.kpCgroupMkdir != nil {
		p.kpCgroupMkdir.Close()
	}
	if p.kpAttachCgroup != nil {
		p.kpAttachCgroup.Close()
	}
	if p.kpBprmCheck != nil {
		p.kpBprmCheck.Close()
	}
	if p.kpUnshare != nil {
		p.kpUnshare.Close()
	}
	if p.kpVfsRename != nil {
		p.kpVfsRename.Close()
	}
	if p.kpPathLink != nil {
		p.kpPathLink.Close()
	}
	if p.kpBpfProgPut != nil {
		p.kpBpfProgPut.Close()
	}
	if p.objects != nil {
		p.objects.Close()
	}
	if p.pinned {
		p.Unpin()
	}
	close(p.eventChan)
}
