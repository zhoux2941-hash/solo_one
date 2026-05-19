package container

import (
	"context"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/container-escaper/ebpf-detector/internal/events"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	cri "k8s.io/cri-api/pkg/apis/runtime/v1"
)

type Runtime interface {
	GetContainerInfo(ctx context.Context, containerID string) (*events.ContainerInfo, error)
	ListContainers(ctx context.Context) ([]*events.ContainerInfo, error)
	Close() error
}

type Manager struct {
	runtime Runtime
	containerCache sync.Map
}

func NewManager(runtimeType, dockerSocket, containerdSocket string) (*Manager, error) {
	var rt Runtime
	var err error

	switch runtimeType {
	case "docker":
		rt, err = NewDockerRuntime(dockerSocket)
	case "containerd":
		rt, err = NewContainerdRuntime(containerdSocket)
	case "auto":
		rt, err = autoDetectRuntime(dockerSocket, containerdSocket)
	default:
		return nil, fmt.Errorf("unsupported runtime: %s", runtimeType)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create runtime: %w", err)
	}

	return &Manager{
		runtime: rt,
	}, nil
}

func autoDetectRuntime(dockerSocket, containerdSocket string) (Runtime, error) {
	if _, err := os.Stat(dockerSocket); err == nil {
		if rt, err := NewDockerRuntime(dockerSocket); err == nil {
			return rt, nil
		}
	}

	if _, err := os.Stat(containerdSocket); err == nil {
		if rt, err := NewContainerdRuntime(containerdSocket); err == nil {
			return rt, nil
		}
	}

	return nil, fmt.Errorf("no container runtime detected")
}

func (m *Manager) GetContainerInfo(ctx context.Context, containerID string) (*events.ContainerInfo, error) {
	if containerID == "" {
		return nil, fmt.Errorf("empty container ID")
	}

	if info, ok := m.containerCache.Load(containerID); ok {
		return info.(*events.ContainerInfo), nil
	}

	info, err := m.runtime.GetContainerInfo(ctx, containerID)
	if err != nil {
		return nil, err
	}

	m.containerCache.Store(containerID, info)
	return info, nil
}

func (m *Manager) RefreshCache(ctx context.Context) error {
	containers, err := m.runtime.ListContainers(ctx)
	if err != nil {
		return err
	}

	for _, c := range containers {
		m.containerCache.Store(c.ContainerID, c)
	}

	return nil
}

func (m *Manager) Close() error {
	return m.runtime.Close()
}

type DockerRuntime struct {
	socketPath string
}

func NewDockerRuntime(socketPath string) (*DockerRuntime, error) {
	if _, err := os.Stat(socketPath); err != nil {
		return nil, fmt.Errorf("docker socket not found: %w", err)
	}
	return &DockerRuntime{socketPath: socketPath}, nil
}

func (d *DockerRuntime) GetContainerInfo(ctx context.Context, containerID string) (*events.ContainerInfo, error) {
	conn, err := net.Dial("unix", d.socketPath)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to docker: %w", err)
	}
	defer conn.Close()

	req := fmt.Sprintf("GET /containers/%s/json HTTP/1.0\r\nHost: docker\r\n\r\n", containerID)
	if _, err := conn.Write([]byte(req)); err != nil {
		return nil, err
	}

	buf := make([]byte, 4096)
	n, err := conn.Read(buf)
	if err != nil {
		return nil, err
	}

	resp := string(buf[:n])
	idx := strings.Index(resp, "\r\n\r\n")
	if idx == -1 {
		return nil, fmt.Errorf("invalid docker response")
	}
	body := resp[idx+4:]

	info := &events.ContainerInfo{
		ContainerID: containerID,
		Runtime:     "docker",
	}

	if name := extractJSONField(body, "\"Name\":\""); name != "" {
		info.Name = strings.TrimPrefix(name, "/")
	}
	if image := extractJSONField(body, "\"Image\":\""); image != "" {
		info.Image = image
	}

	return info, nil
}

func (d *DockerRuntime) ListContainers(ctx context.Context) ([]*events.ContainerInfo, error) {
	conn, err := net.Dial("unix", d.socketPath)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to docker: %w", err)
	}
	defer conn.Close()

	req := "GET /containers/json HTTP/1.0\r\nHost: docker\r\n\r\n"
	if _, err := conn.Write([]byte(req)); err != nil {
		return nil, err
	}

	buf := make([]byte, 8192)
	n, err := conn.Read(buf)
	if err != nil {
		return nil, err
	}

	resp := string(buf[:n])
	idx := strings.Index(resp, "\r\n\r\n")
	if idx == -1 {
		return nil, fmt.Errorf("invalid docker response")
	}

	var containers []*events.ContainerInfo
	body := resp[idx+4:]

	for _, id := range extractAllIDs(body) {
		info, err := d.GetContainerInfo(ctx, id)
		if err == nil {
			containers = append(containers, info)
		}
	}

	return containers, nil
}

func (d *DockerRuntime) Close() error {
	return nil
}

type ContainerdRuntime struct {
	conn   *grpc.ClientConn
	client cri.RuntimeServiceClient
}

func NewContainerdRuntime(socketPath string) (*ContainerdRuntime, error) {
	addr := "unix://" + filepath.Clean(socketPath)
	conn, err := grpc.Dial(addr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
		grpc.WithTimeout(5*time.Second),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to containerd: %w", err)
	}

	return &ContainerdRuntime{
		conn:   conn,
		client: cri.NewRuntimeServiceClient(conn),
	}, nil
}

func (c *ContainerdRuntime) GetContainerInfo(ctx context.Context, containerID string) (*events.ContainerInfo, error) {
	req := &cri.ContainerStatusRequest{
		ContainerId: containerID,
		Verbose:     true,
	}

	resp, err := c.client.ContainerStatus(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to get container status: %w", err)
	}

	status := resp.Status
	info := &events.ContainerInfo{
		ContainerID: status.Id,
		Name:        status.Metadata.Name,
		Image:       status.ImageRef,
		Runtime:     "containerd",
		Labels:      status.Labels,
	}

	return info, nil
}

func (c *ContainerdRuntime) ListContainers(ctx context.Context) ([]*events.ContainerInfo, error) {
	req := &cri.ListContainersRequest{}

	resp, err := c.client.ListContainers(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to list containers: %w", err)
	}

	var containers []*events.ContainerInfo
	for _, ctr := range resp.Containers {
		containers = append(containers, &events.ContainerInfo{
			ContainerID: ctr.Id,
			Name:        ctr.Metadata.Name,
			Image:       ctr.ImageRef,
			Runtime:     "containerd",
			Labels:      ctr.Labels,
		})
	}

	return containers, nil
}

func (c *ContainerdRuntime) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

func extractJSONField(body, field string) string {
	idx := strings.Index(body, field)
	if idx == -1 {
		return ""
	}
	start := idx + len(field)
	end := strings.Index(body[start:], "\"")
	if end == -1 {
		return ""
	}
	return body[start : start+end]
}

func extractAllIDs(body string) []string {
	var ids []string
	search := "\"Id\":\""
	start := 0

	for {
		idx := strings.Index(body[start:], search)
		if idx == -1 {
			break
		}
		idx += start + len(search)
		end := strings.Index(body[idx:], "\"")
		if end == -1 {
			break
		}
		id := body[idx : idx+end]
		if len(id) > 12 {
			id = id[:12]
		}
		ids = append(ids, id)
		start = idx + end
	}

	return ids
}
