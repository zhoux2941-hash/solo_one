package container

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
)

type ContainerInfo struct {
	ID           string
	Name         string
	IP           string
	ServiceName  string
	PodName      string
	PodNamespace string
	CgroupID     uint64
	Labels       map[string]string
	Pid          int
}

type Manager struct {
	cli        *client.Client
	containers map[string]*ContainerInfo
	mu         sync.RWMutex
	stopChan   chan struct{}
}

func NewManager() (*Manager, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %w", err)
	}

	m := &Manager{
		cli:        cli,
		containers: make(map[string]*ContainerInfo),
		stopChan:   make(chan struct{}),
	}

	go m.startRefreshLoop()
	return m, nil
}

func (m *Manager) startRefreshLoop() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	m.refreshContainers()

	for {
		select {
		case <-ticker.C:
			m.refreshContainers()
		case <-m.stopChan:
			return
		}
	}
}

func (m *Manager) refreshContainers() {
	ctx := context.Background()

	containers, err := m.cli.ContainerList(ctx, types.ContainerListOptions{All: false})
	if err != nil {
		log.Printf("Failed to list containers: %v", err)
		return
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	for _, c := range containers {
		info, err := m.getContainerInfo(ctx, c.ID)
		if err != nil {
			log.Printf("Failed to get info for container %s: %v", c.ID[:12], err)
			continue
		}
		m.containers[c.ID] = info
	}

	for id := range m.containers {
		found := false
		for _, c := range containers {
			if c.ID == id {
				found = true
				break
			}
		}
		if !found {
			delete(m.containers, id)
		}
	}
}

func (m *Manager) getContainerInfo(ctx context.Context, containerID string) (*ContainerInfo, error) {
	inspect, err := m.cli.ContainerInspect(ctx, containerID)
	if err != nil {
		return nil, err
	}

	info := &ContainerInfo{
		ID:         containerID,
		Name:       strings.TrimPrefix(inspect.Name, "/"),
		Labels:     inspect.Config.Labels,
		Pid:        inspect.State.Pid,
	}

	if inspect.NetworkSettings != nil && inspect.NetworkSettings.IPAddress != "" {
		info.IP = inspect.NetworkSettings.IPAddress
	}

	if serviceName, ok := inspect.Config.Labels["com.docker.compose.service"]; ok {
		info.ServiceName = serviceName
	}

	if podName, ok := inspect.Config.Labels["io.kubernetes.pod.name"]; ok {
		info.PodName = podName
	}
	if podNamespace, ok := inspect.Config.Labels["io.kubernetes.pod.namespace"]; ok {
		info.PodNamespace = podNamespace
	}
	if containerName, ok := inspect.Config.Labels["io.kubernetes.container.name"]; ok {
		info.ServiceName = containerName
	}

	info.CgroupID = m.extractCgroupID(inspect.CgroupPath)

	return info, nil
}

func (m *Manager) extractCgroupID(cgroupPath string) uint64 {
	if strings.HasPrefix(cgroupPath, "/") {
		cgroupPath = cgroupPath[1:]
	}

	parts := strings.Split(cgroupPath, "/")
	for _, part := range parts {
		if strings.HasPrefix(part, "docker-") || strings.HasPrefix(part, "crio-") {
			continue
		}
		if strings.Contains(part, ":") {
			parts := strings.Split(part, ":")
			if len(parts) == 3 {
				var cgroupID uint64
				if _, err := fmt.Sscanf(parts[2], "0x%x", &cgroupID); err == nil {
					return cgroupID
				}
			}
		}
	}
	return 0
}

func (m *Manager) ListContainers() ([]*ContainerInfo, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var result []*ContainerInfo
	for _, info := range m.containers {
		result = append(result, info)
	}
	return result, nil
}

func (m *Manager) GetContainerByCgroup(cgroupID uint64) (*ContainerInfo, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, info := range m.containers {
		if info.CgroupID == cgroupID {
			return info, nil
		}
	}
	return nil, fmt.Errorf("container not found for cgroup %d", cgroupID)
}

func (m *Manager) GetContainerByIP(ip string) (*ContainerInfo, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, info := range m.containers {
		if info.IP == ip {
			return info, nil
		}
	}
	return nil, fmt.Errorf("container not found for ip %s", ip)
}

func (m *Manager) Close() {
	close(m.stopChan)
	if m.cli != nil {
		m.cli.Close()
	}
}

func (m *Manager) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	containers, _ := m.ListContainers()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(containers)
}
