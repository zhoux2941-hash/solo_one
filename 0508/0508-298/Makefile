.PHONY: all build server cli clean test

all: build

build: server cli

server:
	go build -o bin/distkv-server ./cmd/server

cli:
	go build -o bin/distkv-cli ./cmd/cli

clean:
	rm -rf bin/
	rm -rf data/

test:
	go test -v ./internal/...

run-node1:
	./bin/distkv-server --id node1 --peers node1,node2,node3 --data ./data

run-node2:
	./bin/distkv-server --id node2 --peers node1,node2,node3 --data ./data

run-node3:
	./bin/distkv-server --id node3 --peers node1,node2,node3 --data ./data

bench:
	go test -bench=. ./internal/...
