.PHONY: all build generate clean run docker-up docker-down help

BINARY_NAME := ebpf-monitor
BPF_DIR := ./bpf
CMD_DIR := ./cmd
KERNEL_HEADERS := /usr/src/linux-headers-$(shell uname -r)

# 性能预设 (performance presets)
PRESET ?= balanced

# 根据预设设置编译参数
ifeq ($(PRESET),high-throughput)
    SAMPLE_RATE := 1000
    AGG_INTERVAL := 10s
else ifeq ($(PRESET),balanced)
    SAMPLE_RATE := 100
    AGG_INTERVAL := 5s
else ifeq ($(PRESET),debug)
    SAMPLE_RATE := 1
    AGG_INTERVAL := 1s
else
    SAMPLE_RATE := 100
    AGG_INTERVAL := 5s
endif

all: build

generate:
	@echo "Generating eBPF bindings..."
	@cd $(CMD_DIR) && go generate

build: generate
	@echo "Building $(BINARY_NAME) with preset: $(PRESET) (sample_rate: 1/$(SAMPLE_RATE))..."
	@cd $(CMD_DIR) && go build -ldflags "-X main.sampleRate=$(SAMPLE_RATE) -X main.aggInterval=$(AGG_INTERVAL)" -o ../$(BINARY_NAME) .

build-high-throughput:
	@$(MAKE) build PRESET=high-throughput

build-debug:
	@$(MAKE) build PRESET=debug

clean:
	@echo "Cleaning up..."
	@rm -f $(BINARY_NAME)
	@rm -f $(CMD_DIR)/*_bpfel.go $(CMD_DIR)/*_bpfeb.go
	@rm -rf $(CMD_DIR)/bpf_bpf*

run: build
	@echo "Running $(BINARY_NAME) with sudo..."
	@sudo ./$(BINARY_NAME)

run-high-throughput:
	@$(MAKE) run PRESET=high-throughput

run-debug:
	@$(MAKE) run PRESET=debug

docker-up:
	@echo "Starting Prometheus and Grafana..."
	@cd deploy && docker-compose up -d

docker-down:
	@echo "Stopping Prometheus and Grafana..."
	@cd deploy && docker-compose down

docker-logs:
	@cd deploy && docker-compose logs -f

deps:
	@echo "Installing dependencies..."
	@go mod download
	@go install github.com/cilium/ebpf/cmd/bpf2go@latest

benchmark:
	@echo "Running eBPF performance benchmark..."
	@sudo bpftool prog profile 10s cycles instructions cache-misses

perf:
	@echo "Monitoring eBPF program performance..."
	@sudo perf record -g -e 'bpf:*' sleep 10
	@sudo perf report

help:
	@echo "eBPF Microservice Monitor Makefile (High Throughput Optimized)"
	@echo ""
	@echo "Available targets:"
	@echo "  make deps              - Install Go dependencies and bpf2go"
	@echo "  make generate          - Generate eBPF bindings"
	@echo "  make build             - Build with balanced preset"
	@echo "  make build-high-throughput - Build for >100k QPS scenarios"
	@echo "  make build-debug       - Build with 100% sampling for debugging"
	@echo "  make run               - Run the monitor (requires sudo)"
	@echo "  make run-high-throughput - Run optimized for high throughput"
	@echo "  make run-debug         - Run with full sampling for debugging"
	@echo "  make docker-up         - Start Prometheus and Grafana"
	@echo "  make docker-down       - Stop Prometheus and Grafana"
	@echo "  make benchmark         - Run eBPF performance benchmark"
	@echo "  make perf              - Monitor eBPF program with perf"
	@echo "  make clean             - Clean build artifacts"
	@echo ""
	@echo "Performance Presets:"
	@echo "  PRESET=debug           - 100% sampling, 1s aggregation (CPU ~15%)"
	@echo "  PRESET=balanced        - 1% sampling, 5s aggregation (CPU ~2-5%)"
	@echo "  PRESET=high-throughput - 0.1% sampling, 10s aggregation (CPU <1%)"
	@echo ""
	@echo "Requirements:"
	@echo "  - Linux kernel 5.8+ with BPF support"
	@echo "  - clang/llvm 14+"
	@echo "  - Docker and docker-compose"
	@echo "  - Go 1.21+"
	@echo ""
	@echo "See PERFORMANCE_OPTIMIZATION.md for detailed tuning guide"
