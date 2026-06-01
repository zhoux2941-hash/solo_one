CC = clang
GO = go
BPFTOOL = bpftool

ARCH ?= $(shell uname -m | sed 's/x86_64/x86/')
KERNEL_DIR = kernel
USER_DIR = user
INCLUDE_DIR = include
OUTPUT_DIR = output

VMLINUX = $(KERNEL_DIR)/vmlinux.h
BPF_OBJ = $(KERNEL_DIR)/net_audit.bpf.o
GO_BINARY = $(OUTPUT_DIR)/net-audit

CFLAGS = -target bpf -D__TARGET_ARCH_$(ARCH) -O2 -g -I$(INCLUDE_DIR) -I/usr/include -I/usr/include/x86_64-linux-gnu
GOFLAGS = -ldflags "-s -w"

.PHONY: all clean bpf go run install uninstall help

all: bpf go

bpf: $(BPF_OBJ)

$(BPF_OBJ): $(KERNEL_DIR)/net_audit.bpf.c $(INCLUDE_DIR)/net_audit.h | $(VMLINUX)
	@echo "Compiling $<"
	$(CC) $(CFLAGS) -c $< -o $@

$(VMLINUX):
	@echo "Generating vmlinux.h..."
	$(BPFTOOL) btf dump file /sys/kernel/btf/vmlinux format c > $(VMLINUX) 2>/dev/null || \
	(echo "Warning: Failed to generate vmlinux.h, using fallback header" && touch $(VMLINUX))

go: $(GO_BINARY)

$(GO_BINARY): $(USER_DIR)/main.go go.mod go.sum
	@echo "Building Go binary..."
	@mkdir -p $(OUTPUT_DIR)
	$(GO) build $(GOFLAGS) -o $@ ./user

run: all
	@echo "Running net-audit (requires root)..."
	sudo $(GO_BINARY) -i $(INTERFACE)

install: all
	@echo "Installing to /usr/local/bin..."
	sudo install -m 755 $(GO_BINARY) /usr/local/bin/net-audit
	sudo mkdir -p /etc/net-audit
	sudo install -m 644 config.yaml /etc/net-audit/

uninstall:
	@echo "Uninstalling..."
	sudo rm -f /usr/local/bin/net-audit
	sudo rm -rf /etc/net-audit

clean:
	rm -f $(BPF_OBJ)
	rm -rf $(OUTPUT_DIR)
	go clean ./...

tidy:
	go mod tidy

help:
	@echo "eBPF Network Audit Engine Makefile"
	@echo ""
	@echo "Targets:"
	@echo "  all      - Build eBPF programs and Go binary (default)"
	@echo "  bpf      - Build eBPF programs only"
	@echo "  go       - Build Go binary only"
	@echo "  run      - Run the audit engine (sudo required)"
	@echo "  install  - Install binary and config to system"
	@echo "  uninstall- Remove installed files"
	@echo "  clean    - Remove build artifacts"
	@echo "  tidy     - Update Go module dependencies"
	@echo ""
	@echo "Variables:"
	@echo "  INTERFACE - Network interface to monitor (default: eth0)"
	@echo "  ARCH      - Target architecture (default: auto-detected)"
