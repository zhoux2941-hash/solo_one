package events

type EventType uint32

const (
	EventSyscall          EventType = 0
	EventMount            EventType = 1
	EventCgroup           EventType = 2
	EventUnshare          EventType = 3
	EventPrivileged       EventType = 4
	EventCVE20220492      EventType = 5
	EventRename           EventType = 6
	EventExecve           EventType = 7
	EventPathBypassAttempt EventType = 8
	EventSymlink          EventType = 9
	EventSelfProtection   EventType = 10
	EventHeartbeat        EventType = 11
)

const MagicNumber uint32 = 0x44455445

func (e EventType) String() string {
	switch e {
	case EventSyscall:
		return "syscall"
	case EventMount:
		return "mount"
	case EventCgroup:
		return "cgroup"
	case EventUnshare:
		return "unshare"
	case EventPrivileged:
		return "privileged"
	case EventCVE20220492:
		return "cve_2022_0492"
	case EventRename:
		return "rename"
	case EventExecve:
		return "execve"
	case EventPathBypassAttempt:
		return "path_bypass_attempt"
	case EventSymlink:
		return "symlink"
	case EventSelfProtection:
		return "self_protection"
	case EventHeartbeat:
		return "heartbeat"
	default:
		return "unknown"
	}
}

type Event struct {
	PID          uint32    `json:"pid"`
	TGID         uint32    `json:"tgid"`
	UID          uint32    `json:"uid"`
	GID          uint32    `json:"gid"`
	Timestamp    uint64    `json:"timestamp"`
	EventType    EventType `json:"event_type"`
	SyscallNr    int32     `json:"syscall_nr"`
	Comm         string    `json:"comm"`
	ContainerID  string    `json:"container_id"`
	Arg1         uint64    `json:"arg1"`
	Arg2         uint64    `json:"arg2"`
	Arg3         uint64    `json:"arg3"`
	Arg4         uint64    `json:"arg4"`
	Path1        string    `json:"path1"`
	Path2        string    `json:"path2"`
	PathResolved string    `json:"path_resolved"`
	Retval       int32     `json:"retval"`
	IsSuspicious bool      `json:"is_suspicious"`
}

type AlertSeverity string

const (
	SeverityLow      AlertSeverity = "low"
	SeverityMedium  AlertSeverity = "medium"
	SeverityHigh  AlertSeverity = "high"
	SeverityCritical AlertSeverity = "critical"
)

type Alert struct {
	ID          string         `json:"id"`
	Timestamp   uint64         `json:"timestamp"`
	Severity    AlertSeverity  `json:"severity"`
	EventType   EventType       `json:"event_type"`
	Description string         `json:"description"`
	Event       *Event         `json:"event"`
	ContainerInfo *ContainerInfo `json:"container_info,omitempty"`
	RuleName    string         `json:"rule_name"`
}

type ContainerInfo struct {
	ContainerID string `json:"container_id"`
	Name        string `json:"name"`
	Image       string `json:"image"`
	Runtime     string `json:"runtime"`
	Pid         int    `json:"pid"`
	Labels      map[string]string `json:"labels"`
}
