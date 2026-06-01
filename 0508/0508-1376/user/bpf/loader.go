package bpf

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"unsafe"

	"github.com/cilium/ebpf"
	"github.com/cilium/ebpf/link"
	"github.com/cilium/ebpf/perf"
	"github.com/cilium/ebpf/rlimit"
)

type BPFObjects struct {
	ConnEvents        *ebpf.Map     `ebpf:"conn_events"`
	BlockEvents       *ebpf.Map     `ebpf:"block_events"`
	SampleEvents      *ebpf.Map     `ebpf:"sample_events"`
	IPBlockRules      *ebpf.Map     `ebpf:"ip_block_rules"`
	DomainBlockIPs    *ebpf.Map     `ebpf:"domain_block_ips"`
	PortBlockRules    *ebpf.Map     `ebpf:"port_block_rules"`
	SockPIDMap        *ebpf.Map     `ebpf:"sock_pid_map"`
	SampleCfg         *ebpf.Map     `ebpf:"sample_cfg"`
	ConnTracking      *ebpf.Map     `ebpf:"conn_tracking"`
	PrngState         *ebpf.Map     `ebpf:"prng_state"`
	TcIngressHandler  *ebpf.Program `ebpf:"tc_ingress_handler"`
	TcEgressHandler   *ebpf.Program `ebpf:"tc_egress_handler"`
	CgroupConnect4    *ebpf.Program `ebpf:"cgroup_connect4"`
	TraceSockState    *ebpf.Program `ebpf:"trace_sock_state"`
}

type BPFManager struct {
	objects       *BPFObjects
	iface         string
	cgroupPath    string
	cgroupLink    link.Link
	tpLink        link.Link

	connReader   *perf.Reader
	blockReader  *perf.Reader
	sampleReader *perf.Reader

	connCallback   func(*ConnectionEvent)
	blockCallback  func(*BlockEvent)
	sampleCallback func(*SampleEvent)

	wg     sync.WaitGroup
	stopCh chan struct{}
}

func NewBPFManager(iface string) *BPFManager {
	return &BPFManager{
		iface:     iface,
		stopCh:    make(chan struct{}),
	}
}

func (m *BPFManager) Load() error {
	if err := rlimit.RemoveMemlock(); err != nil {
		return fmt.Errorf("remove memlock: %w", err)
	}

	objPath := filepath.Join("kernel", "net_audit.bpf.o")

	if _, err := os.Stat(objPath); os.IsNotExist(err) {
		if err := m.compileBPF(); err != nil {
			return fmt.Errorf("compile bpf: %w", err)
		}
	}

	spec, err := ebpf.LoadCollectionSpec(objPath)
	if err != nil {
		return fmt.Errorf("load collection spec: %w", err)
	}

	var objs BPFObjects
	if err := spec.LoadAndAssign(&objs, nil); err != nil {
		return fmt.Errorf("load and assign: %w", err)
	}

	m.objects = &objs

	if err := m.attachAll(); err != nil {
		return fmt.Errorf("attach: %w", err)
	}

	if err := m.setupPerfReaders(); err != nil {
		return fmt.Errorf("setup perf readers: %w", err)
	}

	return nil
}

func (m *BPFManager) compileBPF() error {
	arch := runtime.GOARCH
	if arch == "amd64" {
		arch = "x86"
	}

	srcPath := filepath.Join("kernel", "net_audit.bpf.c")
	outPath := filepath.Join("kernel", "net_audit.bpf.o")
	includeDir := "include"

	cmd := exec.Command("clang",
		"-target", "bpf",
		"-D", "__TARGET_ARCH_"+arch,
		"-O2",
		"-g",
		"-I", includeDir,
		"-I", "/usr/include",
		"-I", "/usr/include/x86_64-linux-gnu",
		"-c", srcPath,
		"-o", outPath,
	)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("clang compile: %w, stderr: %s", err, stderr.String())
	}

	log.Printf("Compiled %s -> %s", srcPath, outPath)
	return nil
}

func (m *BPFManager) attachAll() error {
	if err := m.ensureClsact(); err != nil {
		return fmt.Errorf("ensure clsact: %w", err)
	}

	if err := m.attachTCIngress(); err != nil {
		return fmt.Errorf("attach tc ingress: %w", err)
	}

	if err := m.attachTCEgress(); err != nil {
		return fmt.Errorf("attach tc egress: %w", err)
	}

	if err := m.attachCgroup(); err != nil {
		log.Printf("Warning: cgroup attach failed (blocking at TC level only): %v", err)
	}

	if err := m.attachTracepoint(); err != nil {
		log.Printf("Warning: tracepoint attach failed: %v", err)
	}

	return nil
}

func (m *BPFManager) ensureClsact() error {
	cmd := exec.Command("tc", "qdisc", "add", "dev", m.iface, "clsact")
	if err := cmd.Run(); err != nil {
		cmd = exec.Command("tc", "qdisc", "replace", "dev", m.iface, "clsact")
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("add clsact: %w", err)
		}
	}
	return nil
}

func (m *BPFManager) attachTCIngress() error {
	progFD := m.objects.TcIngressHandler.FD()
	cmd := exec.Command("tc", "filter", "add", "dev", m.iface, "ingress",
		"prio", "1", "handle", "1", "bpf", "da",
		"fd", fmt.Sprintf("%d", progFD))
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("tc filter add ingress: %w, stderr: %s", err, stderr.String())
	}
	log.Printf("Attached TC ingress handler to %s", m.iface)
	return nil
}

func (m *BPFManager) attachTCEgress() error {
	progFD := m.objects.TcEgressHandler.FD()
	cmd := exec.Command("tc", "filter", "add", "dev", m.iface, "egress",
		"prio", "1", "handle", "1", "bpf", "da",
		"fd", fmt.Sprintf("%d", progFD))
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("tc filter add egress: %w, stderr: %s", err, stderr.String())
	}
	log.Printf("Attached TC egress handler to %s", m.iface)
	return nil
}

func (m *BPFManager) attachCgroup() error {
	cgPath := "/sys/fs/cgroup"
	if _, err := os.Stat(cgPath); os.IsNotExist(err) {
		return fmt.Errorf("cgroup2 not mounted")
	}

	l, err := link.AttachCgroup(link.CgroupOptions{
		Path:    cgPath,
		Attach:  ebpf.AttachCGroupInet4Connect,
		Program: m.objects.CgroupConnect4,
	})
	if err != nil {
		return fmt.Errorf("attach cgroup/connect4: %w", err)
	}
	m.cgroupLink = l
	m.cgroupPath = cgPath
	log.Printf("Attached cgroup/connect4 to %s", cgPath)
	return nil
}

func (m *BPFManager) attachTracepoint() error {
	l, err := link.Tracepoint("sock", "inet_sock_set_state", m.objects.TraceSockState, nil)
	if err != nil {
		return fmt.Errorf("attach tracepoint: %w", err)
	}
	m.tpLink = l
	log.Printf("Attached tracepoint/sock/inet_sock_set_state")
	return nil
}

func (m *BPFManager) setupPerfReaders() error {
	var err error

	m.connReader, err = perf.NewReader(m.objects.ConnEvents, 4096*256)
	if err != nil {
		return fmt.Errorf("create conn reader: %w", err)
	}

	m.blockReader, err = perf.NewReader(m.objects.BlockEvents, 4096*64)
	if err != nil {
		return fmt.Errorf("create block reader: %w", err)
	}

	m.sampleReader, err = perf.NewReader(m.objects.SampleEvents, 4096*128)
	if err != nil {
		return fmt.Errorf("create sample reader: %w", err)
	}

	return nil
}

func (m *BPFManager) SetCallbacks(
	connCb func(*ConnectionEvent),
	blockCb func(*BlockEvent),
	sampleCb func(*SampleEvent),
) {
	m.connCallback = connCb
	m.blockCallback = blockCb
	m.sampleCallback = sampleCb
}

func (m *BPFManager) Start() {
	m.wg.Add(3)
	go m.readConnEvents()
	go m.readBlockEvents()
	go m.readSampleEvents()
}

func (m *BPFManager) Stop() {
	close(m.stopCh)
	m.wg.Wait()

	if m.connReader != nil {
		m.connReader.Close()
	}
	if m.blockReader != nil {
		m.blockReader.Close()
	}
	if m.sampleReader != nil {
		m.sampleReader.Close()
	}
	if m.cgroupLink != nil {
		m.cgroupLink.Close()
	}
	if m.tpLink != nil {
		m.tpLink.Close()
	}

	m.detachTC()

	if m.objects != nil {
		m.objects.ConnEvents.Close()
		m.objects.BlockEvents.Close()
		m.objects.SampleEvents.Close()
		m.objects.IPBlockRules.Close()
		m.objects.DomainBlockIPs.Close()
		m.objects.PortBlockRules.Close()
		m.objects.SockPIDMap.Close()
		m.objects.SampleCfg.Close()
		m.objects.ConnTracking.Close()
		m.objects.PrngState.Close()
		m.objects.TcIngressHandler.Close()
		m.objects.TcEgressHandler.Close()
		m.objects.CgroupConnect4.Close()
		m.objects.TraceSockState.Close()
	}
}

func (m *BPFManager) detachTC() {
	exec.Command("tc", "filter", "del", "dev", m.iface, "ingress", "prio", "1").Run()
	exec.Command("tc", "filter", "del", "dev", m.iface, "egress", "prio", "1").Run()
	exec.Command("tc", "qdisc", "del", "dev", m.iface, "clsact").Run()
	log.Println("Detached TC handlers")
}

func (m *BPFManager) readConnEvents() {
	defer m.wg.Done()
	for {
		select {
		case <-m.stopCh:
			return
		default:
			rec, err := m.connReader.Read()
			if err != nil {
				if perf.IsClosed(err) {
					return
				}
				continue
			}
			if rec.LostSamples > 0 {
				log.Printf("Lost %d conn events", rec.LostSamples)
				continue
			}
			var event ConnectionEvent
			if err := binary.Read(bytes.NewReader(rec.RawSample), binary.LittleEndian, &event); err != nil {
				continue
			}
			if m.connCallback != nil {
				m.connCallback(&event)
			}
		}
	}
}

func (m *BPFManager) readBlockEvents() {
	defer m.wg.Done()
	for {
		select {
		case <-m.stopCh:
			return
		default:
			rec, err := m.blockReader.Read()
			if err != nil {
				if perf.IsClosed(err) {
					return
				}
				continue
			}
			if rec.LostSamples > 0 {
				continue
			}
			var event BlockEvent
			if err := binary.Read(bytes.NewReader(rec.RawSample), binary.LittleEndian, &event); err != nil {
				continue
			}
			if m.blockCallback != nil {
				m.blockCallback(&event)
			}
		}
	}
}

func (m *BPFManager) readSampleEvents() {
	defer m.wg.Done()
	for {
		select {
		case <-m.stopCh:
			return
		default:
			rec, err := m.sampleReader.Read()
			if err != nil {
				if perf.IsClosed(err) {
					return
				}
				continue
			}
			if rec.LostSamples > 0 {
				continue
			}
			var event SampleEvent
			if err := binary.Read(bytes.NewReader(rec.RawSample), binary.LittleEndian, &event); err != nil {
				continue
			}
			if m.sampleCallback != nil {
				m.sampleCallback(&event)
			}
		}
	}
}

func (m *BPFManager) AddIPBlockRule(key *LpmIPKey, value *LpmIPValue) error {
	return m.objects.IPBlockRules.Put(key, value)
}

func (m *BPFManager) RemoveIPBlockRule(key *LpmIPKey) error {
	return m.objects.IPBlockRules.Delete(key)
}

func (m *BPFManager) AddDomainBlockIP(key *LpmIPKey, value *LpmIPValue) error {
	return m.objects.DomainBlockIPs.Put(key, value)
}

func (m *BPFManager) RemoveDomainBlockIP(key *LpmIPKey) error {
	return m.objects.DomainBlockIPs.Delete(key)
}

func (m *BPFManager) AddPortBlockRule(key *PortRuleKey, value *PortRuleValue) error {
	return m.objects.PortBlockRules.Put(key, value)
}

func (m *BPFManager) RemovePortBlockRule(key *PortRuleKey) error {
	return m.objects.PortBlockRules.Delete(key)
}

func (m *BPFManager) SetSampleConfig(cfg *SampleConfig) error {
	key := uint32(0)
	return m.objects.SampleCfg.Put(unsafe.Pointer(&key), cfg)
}

func (m *BPFManager) GetSampleConfig() (*SampleConfig, error) {
	key := uint32(0)
	var cfg SampleConfig
	if err := m.objects.SampleCfg.Lookup(unsafe.Pointer(&key), &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func ipToUint32(ipStr string) (uint32, error) {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return 0, fmt.Errorf("invalid IP: %s", ipStr)
	}
	ipv4 := ip.To4()
	if ipv4 == nil {
		return 0, fmt.Errorf("not IPv4: %s", ipStr)
	}
	return binary.BigEndian.Uint32(ipv4), nil
}

func ParseCIDR(cidr string) (uint32, uint32, error) {
	_, ipnet, err := net.ParseCIDR(cidr)
	if err != nil {
		ip := net.ParseIP(cidr)
		if ip == nil {
			return 0, 0, fmt.Errorf("invalid CIDR/IP: %s", cidr)
		}
		ipv4 := ip.To4()
		if ipv4 == nil {
			return 0, 0, fmt.Errorf("not IPv4: %s", cidr)
		}
		return binary.BigEndian.Uint32(ipv4), 0xFFFFFFFF, nil
	}

	ip := ipnet.IP.To4()
	if ip == nil {
		return 0, 0, fmt.Errorf("not IPv4: %s", cidr)
	}

	mask := binary.BigEndian.Uint32(ipnet.Mask)
	return binary.BigEndian.Uint32(ip), mask, nil
}

func MaskToPrefixLen(mask uint32) uint32 {
	prefixlen := uint32(0)
	for mask > 0 {
		prefixlen++
		mask <<= 1
	}
	return prefixlen
}

func MakeLpmIPKey(ip uint32, mask uint32) LpmIPKey {
	prefixlen := MaskToPrefixLen(mask)
	if prefixlen == 0 && mask > 0 {
		prefixlen = 32
	}
	return LpmIPKey{
		Prefixlen: prefixlen,
		Data:      ip,
	}
}

func MakeLpmIPKeyHost(ip uint32) LpmIPKey {
	return LpmIPKey{
		Prefixlen: 32,
		Data:      ip,
	}
}
