BPFTOOL ?= bpftool
CLANG ?= clang
LLVM_STRIP ?= llvm-strip
GO ?= go
ARCH ?= $(shell uname -m | sed 's/x86_64/amd64/g; s/aarch64/arm64/g')

VMLINUX := bpf/vmlinux.h
BPF_SRC := bpf/escaper_detector.bpf.c
BPF_OBJ := bpf/escaper_detector.bpf.o

.PHONY: all bpf build generate clean test format

all: build

$(VMLINUX):
	$(BPFTOOL) btf dump file /sys/kernel/btf/vmlinux format c > $(VMLINUX)

bpf: $(BPF_OBJ)

$(BPF_OBJ): $(BPF_SRC) $(VMLINUX)
	$(CLANG) -g -O2 -target bpf -D__TARGET_ARCH_$(ARCH) \
		-Wall -Werror \
		-I. -I./bpf \
		-c $(BPF_SRC) -o $@
	$(LLVM_STRIP) -g $@

generate:
	cd internal/bpf && $(GO) generate ./...

build: bpf
	$(GO) build -tags netgo -ldflags '-s -w' -o bin/ebpf-detector ./cmd

tidy:
	$(GO) mod tidy

fmt:
	find . -name '*.go' -not -path '*/vendor/*' -exec gofmt -w {} \;

run: build
	sudo ./bin/ebpf-detector --config ./configs/config.yaml

debug: build
	sudo ./bin/ebpf-detector --config ./configs/config.yaml 2>&1 | tee detector.log

clean:
	rm -rf bin/
	rm -f $(BPF_OBJ)
	rm -f internal/bpf/*_gen.go
	rm -f *.log
