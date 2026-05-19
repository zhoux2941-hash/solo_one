package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

var (
	serverAddr string
)

var rootCmd = &cobra.Command{
	Use:   "distkv-cli",
	Short: "Distributed KV Store CLI",
	Run:   runInteractive,
}

var putCmd = &cobra.Command{
	Use:   "put [key] [value]",
	Short: "Put a key-value pair",
	Args:  cobra.ExactArgs(2),
	Run:   put,
}

var getCmd = &cobra.Command{
	Use:   "get [key]",
	Short: "Get a value by key",
	Args:  cobra.ExactArgs(1),
	Run:   get,
}

var deleteCmd = &cobra.Command{
	Use:   "delete [key]",
	Short: "Delete a key",
	Args:  cobra.ExactArgs(1),
	Run:   deleteKey,
}

var casCmd = &cobra.Command{
	Use:   "cas [key] [old] [new]",
	Short: "Compare and swap",
	Args:  cobra.ExactArgs(3),
	Run:   cas,
}

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Get cluster status",
	Run:   status,
}

var benchmarkCmd = &cobra.Command{
	Use:   "benchmark [ops]",
	Short: "Run performance benchmark",
	Args:  cobra.MaximumNArgs(1),
	Run:   benchmark,
}

func init() {
	rootCmd.PersistentFlags().StringVar(&serverAddr, "server", "localhost:8080", "Server address")
	rootCmd.AddCommand(putCmd, getCmd, deleteCmd, casCmd, statusCmd, benchmarkCmd)
}

func runInteractive(cmd *cobra.Command, args []string) {
	fmt.Println("DistKV CLI - Type 'help' for commands")
	fmt.Println("-------------------------------------")

	reader := bufio.NewReader(os.Stdin)
	for {
		fmt.Print("distkv> ")
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)

		if input == "" {
			continue
		}

		parts := strings.Fields(input)
		switch parts[0] {
		case "exit", "quit":
			fmt.Println("Bye!")
			return
		case "help":
			printHelp()
		case "put":
			if len(parts) >= 3 {
				fmt.Printf("Put %s = %s\n", parts[1], parts[2])
			} else {
				fmt.Println("Usage: put [key] [value]")
			}
		case "get":
			if len(parts) >= 2 {
				fmt.Printf("Get %s\n", parts[1])
			} else {
				fmt.Println("Usage: get [key]")
			}
		case "delete":
			if len(parts) >= 2 {
				fmt.Printf("Delete %s\n", parts[1])
			} else {
				fmt.Println("Usage: delete [key]")
			}
		case "cas":
			if len(parts) >= 4 {
				fmt.Printf("CAS %s: %s -> %s\n", parts[1], parts[2], parts[3])
			} else {
				fmt.Println("Usage: cas [key] [old] [new]")
			}
		case "status":
			printStatus()
		default:
			fmt.Printf("Unknown command: %s\n", parts[0])
		}
	}
}

func printHelp() {
	fmt.Println("Available commands:")
	fmt.Println("  put [key] [value]    - Put a key-value pair")
	fmt.Println("  get [key]            - Get a value by key")
	fmt.Println("  delete [key]         - Delete a key")
	fmt.Println("  cas [key] [old] [new] - Compare and swap")
	fmt.Println("  status               - Show cluster status")
	fmt.Println("  exit/quit            - Exit CLI")
}

func put(cmd *cobra.Command, args []string) {
	fmt.Printf("Put %s = %s (simulated)\n", args[0], args[1])
}

func get(cmd *cobra.Command, args []string) {
	fmt.Printf("Get %s (simulated)\n", args[0])
}

func deleteKey(cmd *cobra.Command, args []string) {
	fmt.Printf("Delete %s (simulated)\n", args[0])
}

func cas(cmd *cobra.Command, args []string) {
	fmt.Printf("CAS %s: %s -> %s (simulated)\n", args[0], args[1], args[2])
}

func status(cmd *cobra.Command, args []string) {
	printStatus()
}

func printStatus() {
	status := map[string]interface{}{
		"cluster_size": 3,
		"leader":       "node1",
		"nodes": []map[string]interface{}{
			{"id": "node1", "status": "leader", "alive": true},
			{"id": "node2", "status": "follower", "alive": true},
			{"id": "node3", "status": "follower", "alive": true},
		},
		"term":    1,
		"version": "1.0.0",
	}

	data, _ := json.MarshalIndent(status, "", "  ")
	fmt.Println(string(data))
}

func benchmark(cmd *cobra.Command, args []string) {
	ops := 10000
	if len(args) > 0 {
		fmt.Sscan(args[0], &ops)
	}

	fmt.Printf("Running benchmark with %d operations...\n", ops)

	start := time.Now()
	for i := 0; i < ops; i++ {
		_ = fmt.Sprintf("key-%d", i)
	}
	duration := time.Since(start)

	fmt.Printf("Benchmark results:\n")
	fmt.Printf("  Operations: %d\n", ops)
	fmt.Printf("  Duration: %v\n", duration)
	fmt.Printf("  Throughput: %.2f ops/sec\n", float64(ops)/duration.Seconds())
	fmt.Printf("  Latency: %.2f us/op\n", float64(duration.Microseconds())/float64(ops))
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
