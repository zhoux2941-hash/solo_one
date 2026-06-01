package bpf

import (
	"encoding/binary"
	"net"
	"unsafe"
)

const (
	TASK_COMM_LEN    = 16
	MAX_DOMAIN_LEN   = 128
	MAX_PAYLOAD_SIZE = 128
	MAX_RULES        = 1024
	MAX_PROCESS_RULES = 256
)

const (
	EVENT_NEW_CONNECTION = 0
	EVENT_PACKET         = 1
	EVENT_BLOCKED        = 2
	EVENT_SAMPLE         = 3
)

const (
	RULE_PROCESS_IP_BLOCK   = 0
	RULE_PROCESS_PORT_ALLOW = 1
	RULE_DOMAIN_BLOCK       = 2
	RULE_IP_BLOCK           = 3
	RULE_PORT_BLOCK         = 4
)

const (
	ACTION_ALLOW = 0
	ACTION_DENY  = 1
)

type NetPacketMeta struct {
	Timestamp uint64
	PID       uint32
	UID       uint32
	Comm      [TASK_COMM_LEN]byte
	Saddr     uint32
	Daddr     uint32
	Sport     uint16
	Dport     uint16
	Protocol  uint8
	TCPFlags  uint8
	PktSize   uint16
	Seq       uint32
	Ack       uint32
}

type ConnectionEvent struct {
	Meta      NetPacketMeta
	Direction uint8
	EventType uint8
}

type BlockEvent struct {
	Meta     NetPacketMeta
	RuleType uint8
	RuleID   uint32
	Reason   [64]byte
}

type SampleEvent struct {
	Meta       NetPacketMeta
	PayloadLen uint16
	Payload    [MAX_PAYLOAD_SIZE]byte
}

type LpmIPKey struct {
	Prefixlen uint32
	Data      uint32
}

type LpmIPValue struct {
	ID        uint32
	Action    uint8
	Enabled   uint8
	RuleType  uint8
	Comm      [TASK_COMM_LEN]byte
}

type PortRuleKey struct {
	Port     uint16
	Protocol uint8
	Pad      uint8
}

type PortRuleValue struct {
	ID      uint32
	Action  uint8
	Enabled uint8
	Comm    [TASK_COMM_LEN]byte
}

type SockPIDKey struct {
	Cookie uint64
}

type SockPIDValue struct {
	PID  uint32
	UID  uint32
	Comm [TASK_COMM_LEN]byte
}

type RuleKey struct {
	Type     uint8
	PID      uint32
	IP       uint32
	Mask     uint32
	Port     uint16
	Protocol uint8
}

type RuleValue struct {
	ID      uint32
	Action  uint8
	Enabled uint8
	Comm    [TASK_COMM_LEN]byte
	Domain  [MAX_DOMAIN_LEN]byte
}

type SampleConfig struct {
	SampleRate       uint32
	SampleThreshold  uint32
	ExcludePorts     [16]uint16
	ExcludePortCount uint8
	Enabled          uint8
}

func (m *NetPacketMeta) SourceIP() net.IP {
	ip := make(net.IP, 4)
	binary.BigEndian.PutUint32(ip, m.Saddr)
	return ip
}

func (m *NetPacketMeta) DestIP() net.IP {
	ip := make(net.IP, 4)
	binary.BigEndian.PutUint32(ip, m.Daddr)
	return ip
}

func (m *NetPacketMeta) SourcePort() uint16 {
	return binary.BigEndian.Uint16((*[2]byte)(unsafe.Pointer(&m.Sport))[:])
}

func (m *NetPacketMeta) DestPort() uint16 {
	return binary.BigEndian.Uint16((*[2]byte)(unsafe.Pointer(&m.Dport))[:])
}

func (m *NetPacketMeta) ProtocolName() string {
	switch m.Protocol {
	case 6:
		return "TCP"
	case 17:
		return "UDP"
	case 1:
		return "ICMP"
	default:
		return "UNKNOWN"
	}
}

func (m *NetPacketMeta) TCPFlagsString() string {
	flags := ""
	if m.TCPFlags&0x01 != 0 {
		flags += "FIN "
	}
	if m.TCPFlags&0x02 != 0 {
		flags += "SYN "
	}
	if m.TCPFlags&0x04 != 0 {
		flags += "RST "
	}
	if m.TCPFlags&0x08 != 0 {
		flags += "PSH "
	}
	if m.TCPFlags&0x10 != 0 {
		flags += "ACK "
	}
	if m.TCPFlags&0x20 != 0 {
		flags += "URG "
	}
	return flags
}

func (c *ConnectionEvent) CommString() string {
	return string(c.Meta.Comm[:clen(c.Meta.Comm[:])])
}

func (b *BlockEvent) CommString() string {
	return string(b.Meta.Comm[:clen(b.Meta.Comm[:])])
}

func (b *BlockEvent) ReasonString() string {
	return string(b.Reason[:clen(b.Reason[:])])
}

func clen(b []byte) int {
	for i, v := range b {
		if v == 0 {
			return i
		}
	}
	return len(b)
}
