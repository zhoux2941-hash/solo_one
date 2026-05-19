package topology

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"ebpf-microservice-monitor/pkg/container"
)

type Connection struct {
	Timestamp  time.Time
	SrcIP      string
	DstIP      string
	SrcPort    uint16
	DstPort    uint16
	SrcCgroup  uint64
	Pid        uint32
	Tgid       uint32
	Direction  uint8
	HTTPHost   string
}

type ServiceNode struct {
	Name      string
	IPs       []string
	CgroupIDs []uint64
	Type      string
	Metadata  map[string]string
}

type ServiceEdge struct {
	Source       string
	Destination  string
	Protocol     string
	CallCount    uint64
	LastActive   time.Time
	AvgLatencyMs float64
}

type Manager struct {
	containerMgr *container.Manager
	nodes        map[string]*ServiceNode
	edges        map[string]*ServiceEdge
	ipToService  map[string]string
	cgroupToService map[uint64]string
	connections  []Connection
	mu           sync.RWMutex
	stopChan     chan struct{}
}

func NewManager(containerMgr *container.Manager) *Manager {
	m := &Manager{
		containerMgr:    containerMgr,
		nodes:           make(map[string]*ServiceNode),
		edges:           make(map[string]*ServiceEdge),
		ipToService:     make(map[string]string),
		cgroupToService: make(map[uint64]string),
		connections:     make([]Connection, 0),
		stopChan:        make(chan struct{}),
	}

	go m.serveTopologyAPI()
	return m
}

func (m *Manager) Start() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			m.updateTopology()
		case <-m.stopChan:
			return
		}
	}
}

func (m *Manager) AddConnection(conn Connection) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.connections = append(m.connections, conn)

	if len(m.connections) > 10000 {
		m.connections = m.connections[1000:]
	}

	srcService := m.getServiceByIPLocked(conn.SrcIP)
	if srcService == "" && conn.SrcCgroup > 0 {
		srcService = m.getServiceByCgroupLocked(conn.SrcCgroup)
	}

	dstService := m.getServiceByIPLocked(conn.DstIP)

	if srcService == "" {
		srcService = fmt.Sprintf("service-%s", conn.SrcIP)
		m.ipToService[conn.SrcIP] = srcService
		m.nodes[srcService] = &ServiceNode{
			Name:      srcService,
			IPs:       []string{conn.SrcIP},
			CgroupIDs: []uint64{conn.SrcCgroup},
			Type:      "discovered",
			Metadata:  make(map[string]string),
		}
	}

	if dstService == "" {
		dstService = fmt.Sprintf("service-%s", conn.DstIP)
		m.ipToService[conn.DstIP] = dstService
		m.nodes[dstService] = &ServiceNode{
			Name:      dstService,
			IPs:       []string{conn.DstIP},
			Type:      "discovered",
			Metadata:  make(map[string]string),
		}
	}

	edgeKey := fmt.Sprintf("%s->%s", srcService, dstService)
	if edge, exists := m.edges[edgeKey]; exists {
		edge.CallCount++
		edge.LastActive = conn.Timestamp
	} else {
		m.edges[edgeKey] = &ServiceEdge{
			Source:      srcService,
			Destination: dstService,
			Protocol:    "TCP",
			CallCount:   1,
			LastActive:  conn.Timestamp,
		}
	}
}

func (m *Manager) updateTopology() {
	if m.containerMgr == nil {
		return
	}

	containers, err := m.containerMgr.ListContainers()
	if err != nil {
		log.Printf("Failed to list containers: %v", err)
		return
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	for _, c := range containers {
		serviceName := c.ServiceName
		if serviceName == "" {
			serviceName = c.Name
		}

		if _, exists := m.nodes[serviceName]; !exists {
			m.nodes[serviceName] = &ServiceNode{
				Name:      serviceName,
				IPs:       []string{c.IP},
				CgroupIDs: []uint64{c.CgroupID},
				Type:      "container",
				Metadata: map[string]string{
					"container_id":   c.ID,
					"container_name": c.Name,
					"pod_name":       c.PodName,
					"pod_namespace":  c.PodNamespace,
				},
			}
		}

		if c.IP != "" {
			m.ipToService[c.IP] = serviceName
		}
		if c.CgroupID > 0 {
			m.cgroupToService[c.CgroupID] = serviceName
		}
	}
}

func (m *Manager) GetServiceByIP(ip string) string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.ipToService[ip]
}

func (m *Manager) getServiceByIPLocked(ip string) string {
	return m.ipToService[ip]
}

func (m *Manager) GetServiceByCgroup(cgroupID uint64) string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.getServiceByCgroupLocked(cgroupID)
}

func (m *Manager) getServiceByCgroupLocked(cgroupID uint64) string {
	if service, exists := m.cgroupToService[cgroupID]; exists {
		return service
	}

	if m.containerMgr != nil {
		if info, err := m.containerMgr.GetContainerByCgroup(cgroupID); err == nil {
			serviceName := info.ServiceName
			if serviceName == "" {
				serviceName = info.Name
			}
			m.cgroupToService[cgroupID] = serviceName
			return serviceName
		}
	}

	return ""
}

func (m *Manager) GetTopology() (nodes []*ServiceNode, edges []*ServiceEdge) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, node := range m.nodes {
		nodes = append(nodes, node)
	}
	for _, edge := range m.edges {
		edges = append(edges, edge)
	}
	return nodes, edges
}

func (m *Manager) serveTopologyAPI() {
	http.HandleFunc("/api/topology", func(w http.ResponseWriter, r *http.Request) {
		nodes, edges := m.GetTopology()

		response := struct {
			Nodes []*ServiceNode `json:"nodes"`
			Edges []*ServiceEdge `json:"edges"`
		}{
			Nodes: nodes,
			Edges: edges,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	})

	log.Println("Topology API listening on :9090/api/topology")
}

func (m *Manager) Close() {
	close(m.stopChan)
}
