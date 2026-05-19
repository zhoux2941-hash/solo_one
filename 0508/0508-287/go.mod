module ebpf-microservice-monitor

go 1.21

require (
	github.com/cilium/ebpf v0.12.3
	github.com/prometheus/client_golang v1.17.0
	github.com/docker/docker v24.0.7+incompatible
	github.com/vishvananda/netlink v1.2.1-beta.2
	golang.org/x/sys v0.15.0
)
