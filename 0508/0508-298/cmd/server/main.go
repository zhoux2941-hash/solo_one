package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"distkv/internal/node"
	"github.com/spf13/cobra"
)

var (
	nodeID    string
	peers     []string
	dataDir   string
	bindAddr  string
)

var rootCmd = &cobra.Command{
	Use:   "distkv-server",
	Short: "Distributed KV Store Server",
	Run:   runServer,
}

func init() {
	rootCmd.Flags().StringVar(&nodeID, "id", "node1", "Node ID")
	rootCmd.Flags().StringSliceVar(&peers, "peers", []string{"node1", "node2", "node3"}, "Peer IDs")
	rootCmd.Flags().StringVar(&dataDir, "data", "./data", "Data directory")
	rootCmd.Flags().StringVar(&bindAddr, "bind", ":8080", "Bind address")
}

func runServer(cmd *cobra.Command, args []string) {
	cfg := node.Config{
		ID:                nodeID,
		Peers:             peers,
		DataDir:           fmt.Sprintf("%s/%s", dataDir, nodeID),
		ElectionTimeout:   1000 * time.Millisecond,
		HeartbeatInterval: 100 * time.Millisecond,
	}

	n, err := node.NewNode(cfg)
	if err != nil {
		fmt.Printf("Failed to create node: %v\n", err)
		os.Exit(1)
	}
	defer n.Stop()

	fmt.Printf("Node %s started\n", nodeID)

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	fmt.Println("Shutting down...")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
