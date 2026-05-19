#include <iostream>
#include <string>
#include <memory>
#include <thread>
#include <chrono>
#include <iomanip>
#include <grpcpp/grpcpp.h>
#include "kv.grpc.pb.h"
#include "common/utils.h"

using namespace paxoskv;

class KVClient {
public:
    explicit KVClient(std::shared_ptr<grpc::Channel> channel)
        : stub_(KVService::NewStub(channel)) {}

    bool Put(const std::string& key, const std::string& value) {
        PutRequest request;
        request.set_key(key);
        request.set_value(value);

        PutResponse response;
        grpc::ClientContext context;
        auto deadline = std::chrono::system_clock::now() + std::chrono::seconds(5);
        context.set_deadline(deadline);

        grpc::Status status = stub_->Put(&context, request, &response);

        if (status.ok() && response.success()) {
            return true;
        }
        if (!status.ok()) {
            std::cerr << "RPC failed: " << status.error_message() << std::endl;
        } else {
            std::cerr << "Put failed: " << response.error() << std::endl;
        }
        return false;
    }

    std::optional<std::string> Get(const std::string& key) {
        GetRequest request;
        request.set_key(key);

        GetResponse response;
        grpc::ClientContext context;
        auto deadline = std::chrono::system_clock::now() + std::chrono::seconds(5);
        context.set_deadline(deadline);

        grpc::Status status = stub_->Get(&context, request, &response);

        if (status.ok() && response.found()) {
            return response.value();
        }
        if (!status.ok()) {
            std::cerr << "RPC failed: " << status.error_message() << std::endl;
        }
        return std::nullopt;
    }

    bool Delete(const std::string& key) {
        DeleteRequest request;
        request.set_key(key);

        DeleteResponse response;
        grpc::ClientContext context;
        auto deadline = std::chrono::system_clock::now() + std::chrono::seconds(5);
        context.set_deadline(deadline);

        grpc::Status status = stub_->Delete(&context, request, &response);

        if (status.ok() && response.success()) {
            return response.deleted();
        }
        if (!status.ok()) {
            std::cerr << "RPC failed: " << status.error_message() << std::endl;
        } else {
            std::cerr << "Delete failed: " << response.error() << std::endl;
        }
        return false;
    }

    void PrintStatus() {
        GetStatusRequest request;
        GetStatusResponse response;
        grpc::ClientContext context;
        auto deadline = std::chrono::system_clock::now() + std::chrono::seconds(5);
        context.set_deadline(deadline);

        grpc::Status status = stub_->GetStatus(&context, request, &response);

        if (!status.ok()) {
            std::cerr << "RPC failed: " << status.error_message() << std::endl;
            return;
        }

        std::cout << "\n=== Cluster Status ===" << std::endl;
        std::cout << "Leader ID: " << response.leader_id() << std::endl;
        std::cout << "Cluster Size: " << response.cluster_size() << std::endl;
        std::cout << "\nNodes:" << std::endl;

        for (const auto& node : response.nodes()) {
            std::cout << "  Node " << node.node_id()
                      << " (" << node.address() << ")" << std::endl;
            std::cout << "    Leader: " << (node.is_leader() ? "YES" : "NO") << std::endl;
            std::cout << "    Alive: " << (node.alive() ? "YES" : "NO") << std::endl;
            if (node.has_commit_index()) {
                std::cout << "    Commit Index: " << node.commit_index() << std::endl;
                std::cout << "    Last Applied: " << node.last_applied() << std::endl;
                std::cout << "    Log Size: " << node.log_size() << std::endl;
            }
            if (node.has_match_index()) {
                std::cout << "    Match Index: " << node.match_index() << std::endl;
            }
            std::cout << std::endl;
        }
    }

    bool TakeSnapshot() {
        SnapshotRequest request;
        SnapshotResponse response;
        grpc::ClientContext context;
        auto deadline = std::chrono::system_clock::now() + std::chrono::seconds(30);
        context.set_deadline(deadline);

        grpc::Status status = stub_->TakeSnapshot(&context, request, &response);

        if (status.ok() && response.success()) {
            std::cout << "Snapshot taken at index: " << response.snapshot_index() << std::endl;
            return true;
        }
        if (!status.ok()) {
            std::cerr << "RPC failed: " << status.error_message() << std::endl;
        } else {
            std::cerr << "Snapshot failed: " << response.error() << std::endl;
        }
        return false;
    }

    bool AddNode(uint64_t node_id, const std::string& address, const std::string& paxos_address) {
        AddNodeRequest request;
        request.set_node_id(node_id);
        request.set_address(address);
        request.set_paxos_address(paxos_address);

        AddNodeResponse response;
        grpc::ClientContext context;
        auto deadline = std::chrono::system_clock::now() + std::chrono::seconds(30);
        context.set_deadline(deadline);

        grpc::Status status = stub_->AddNode(&context, request, &response);

        if (status.ok() && response.success()) {
            std::cout << "Node " << node_id << " added successfully, config index: " << response.config_index() << std::endl;
            return true;
        }
        if (!status.ok()) {
            std::cerr << "RPC failed: " << status.error_message() << std::endl;
        } else {
            std::cerr << "AddNode failed: " << response.error() << std::endl;
        }
        return false;
    }

    bool RemoveNode(uint64_t node_id) {
        RemoveNodeRequest request;
        request.set_node_id(node_id);

        RemoveNodeResponse response;
        grpc::ClientContext context;
        auto deadline = std::chrono::system_clock::now() + std::chrono::seconds(30);
        context.set_deadline(deadline);

        grpc::Status status = stub_->RemoveNode(&context, request, &response);

        if (status.ok() && response.success()) {
            std::cout << "Node " << node_id << " removed successfully, config index: " << response.config_index() << std::endl;
            return true;
        }
        if (!status.ok()) {
            std::cerr << "RPC failed: " << status.error_message() << std::endl;
        } else {
            std::cerr << "RemoveNode failed: " << response.error() << std::endl;
        }
        return false;
    }

    void PrintClusterConfig() {
        GetClusterConfigRequest request;
        GetClusterConfigResponse response;
        grpc::ClientContext context;
        auto deadline = std::chrono::system_clock::now() + std::chrono::seconds(5);
        context.set_deadline(deadline);

        grpc::Status status = stub_->GetClusterConfig(&context, request, &response);

        if (!status.ok()) {
            std::cerr << "RPC failed: " << status.error_message() << std::endl;
            return;
        }

        std::cout << "\n=== Cluster Configuration ===" << std::endl;
        std::cout << "Config Index: " << response.config_index() << std::endl;
        std::cout << "Leader ID: " << response.leader_id() << std::endl;
        std::cout << "Members:" << std::endl;
        for (const auto& member : response.members()) {
            std::cout << "  Node " << member.node_id() << ":" << std::endl;
            std::cout << "    Address: " << member.address() << std::endl;
            std::cout << "    Paxos Address: " << member.paxos_address() << std::endl;
        }
        std::cout << std::endl;
    }

    bool Rebalance() {
        RebalanceRequest request;
        RebalanceResponse response;
        grpc::ClientContext context;
        auto deadline = std::chrono::system_clock::now() + std::chrono::seconds(60);
        context.set_deadline(deadline);

        grpc::Status status = stub_->Rebalance(&context, request, &response);

        if (status.ok() && response.success()) {
            std::cout << "Rebalance completed, " << response.keys_migrated() << " keys migrated" << std::endl;
            return true;
        }
        if (!status.ok()) {
            std::cerr << "RPC failed: " << status.error_message() << std::endl;
        } else {
            std::cerr << "Rebalance failed: " << response.error() << std::endl;
        }
        return false;
    }

    void RunPerformanceTest(uint64_t num_ops, uint64_t value_size) {
        std::cout << "Running performance test: " << num_ops << " operations, value size: " << value_size << " bytes" << std::endl;

        std::string value(value_size, 'x');

        auto start = std::chrono::high_resolution_clock::now();
        uint64_t success_count = 0;

        for (uint64_t i = 0; i < num_ops; ++i) {
            std::string key = "test_key_" + std::to_string(i);
            if (Put(key, value)) {
                success_count++;
            }
        }

        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
        auto avg_latency = duration > 0 ? (double)duration / success_count : 0;

        std::cout << "Write Results:" << std::endl;
        std::cout << "  Total operations: " << num_ops << std::endl;
        std::cout << "  Success: " << success_count << std::endl;
        std::cout << "  Total time: " << duration << " ms" << std::endl;
        std::cout << "  Average latency: " << std::fixed << std::setprecision(2) << avg_latency << " ms" << std::endl;
        std::cout << "  Throughput: " << (duration > 0 ? (success_count * 1000.0 / duration) : 0) << " ops/sec" << std::endl;

        start = std::chrono::high_resolution_clock::now();
        success_count = 0;

        for (uint64_t i = 0; i < num_ops; ++i) {
            std::string key = "test_key_" + std::to_string(i);
            if (Get(key).has_value()) {
                success_count++;
            }
        }

        end = std::chrono::high_resolution_clock::now();
        duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
        avg_latency = duration > 0 ? (double)duration / success_count : 0;

        std::cout << "\nRead Results:" << std::endl;
        std::cout << "  Total operations: " << num_ops << std::endl;
        std::cout << "  Success: " << success_count << std::endl;
        std::cout << "  Total time: " << duration << " ms" << std::endl;
        std::cout << "  Average latency: " << std::fixed << std::setprecision(2) << avg_latency << " ms" << std::endl;
        std::cout << "  Throughput: " << (duration > 0 ? (success_count * 1000.0 / duration) : 0) << " ops/sec" << std::endl;
    }

private:
    std::unique_ptr<KVService::Stub> stub_;
};

void print_help() {
    std::cout << "\nPaxosKV CLI Client\n" << std::endl;
    std::cout << "Commands:" << std::endl;
    std::cout << "  put <key> <value>                   - Store a key-value pair" << std::endl;
    std::cout << "  get <key>                           - Retrieve a value by key" << std::endl;
    std::cout << "  delete <key>                        - Delete a key-value pair" << std::endl;
    std::cout << "  status                              - Show cluster status" << std::endl;
    std::cout << "  snapshot                            - Take a manual snapshot" << std::endl;
    std::cout << "  addnode <id> <addr> <paxos_addr>    - Add a node to cluster" << std::endl;
    std::cout << "  removenode <id>                     - Remove a node from cluster" << std::endl;
    std::cout << "  cluster                             - Show cluster configuration" << std::endl;
    std::cout << "  rebalance                           - Trigger data rebalancing" << std::endl;
    std::cout << "  bench <num> <size>                  - Run performance test" << std::endl;
    std::cout << "  help                                - Show this help" << std::endl;
    std::cout << "  exit                                - Exit the client" << std::endl;
    std::cout << std::endl;
}

int main(int argc, char** argv) {
    std::string server_address = "localhost:8001";

    if (argc > 1) {
        server_address = argv[1];
    }

    std::cout << "Connecting to " << server_address << "..." << std::endl;

    grpc::ChannelArguments args;
    args.SetInt(GRPC_ARG_KEEPALIVE_TIME_MS, 5000);
    args.SetInt(GRPC_ARG_KEEPALIVE_TIMEOUT_MS, 3000);

    auto channel = grpc::CreateCustomChannel(
        server_address,
        grpc::InsecureChannelCredentials(),
        args);

    KVClient client(channel);

    std::cout << "Connected! Type 'help' for commands." << std::endl;

    std::string line;
    while (true) {
        std::cout << "> ";
        std::getline(std::cin, line);

        if (line.empty()) continue;

        auto tokens = Utils::Split(line, ' ');
        if (tokens.empty()) continue;

        std::string cmd = tokens[0];

        if (cmd == "exit" || cmd == "quit") {
            std::cout << "Bye!" << std::endl;
            break;
        } else if (cmd == "help") {
            print_help();
        } else if (cmd == "put") {
            if (tokens.size() < 3) {
                std::cerr << "Usage: put <key> <value>" << std::endl;
                continue;
            }
            std::string key = tokens[1];
            std::string value = line.substr(line.find(tokens[1]) + tokens[1].size() + 1);
            auto start = std::chrono::high_resolution_clock::now();
            bool success = client.Put(key, value);
            auto end = std::chrono::high_resolution_clock::now();
            auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
            if (success) {
                std::cout << "OK (" << duration << " us)" << std::endl;
            }
        } else if (cmd == "get") {
            if (tokens.size() < 2) {
                std::cerr << "Usage: get <key>" << std::endl;
                continue;
            }
            auto start = std::chrono::high_resolution_clock::now();
            auto result = client.Get(tokens[1]);
            auto end = std::chrono::high_resolution_clock::now();
            auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
            if (result.has_value()) {
                std::cout << *result << " (" << duration << " us)" << std::endl;
            } else {
                std::cout << "(nil) (" << duration << " us)" << std::endl;
            }
        } else if (cmd == "delete" || cmd == "del") {
            if (tokens.size() < 2) {
                std::cerr << "Usage: delete <key>" << std::endl;
                continue;
            }
            auto start = std::chrono::high_resolution_clock::now();
            bool deleted = client.Delete(tokens[1]);
            auto end = std::chrono::high_resolution_clock::now();
            auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
            std::cout << (deleted ? "Deleted" : "Not found") << " (" << duration << " us)" << std::endl;
        } else if (cmd == "status" || cmd == "info") {
            client.PrintStatus();
        } else if (cmd == "snapshot") {
            client.TakeSnapshot();
        } else if (cmd == "addnode") {
            if (tokens.size() < 4) {
                std::cerr << "Usage: addnode <id> <address> <paxos_address>" << std::endl;
                std::cerr << "Example: addnode 4 localhost:8004 localhost:9004" << std::endl;
                continue;
            }
            uint64_t node_id = std::stoull(tokens[1]);
            client.AddNode(node_id, tokens[2], tokens[3]);
        } else if (cmd == "removenode") {
            if (tokens.size() < 2) {
                std::cerr << "Usage: removenode <id>" << std::endl;
                continue;
            }
            uint64_t node_id = std::stoull(tokens[1]);
            client.RemoveNode(node_id);
        } else if (cmd == "cluster") {
            client.PrintClusterConfig();
        } else if (cmd == "rebalance") {
            client.Rebalance();
        } else if (cmd == "bench") {
            uint64_t num_ops = 1000;
            uint64_t value_size = 100;
            if (tokens.size() >= 2) {
                num_ops = std::stoull(tokens[1]);
            }
            if (tokens.size() >= 3) {
                value_size = std::stoull(tokens[2]);
            }
            client.RunPerformanceTest(num_ops, value_size);
        } else {
            std::cout << "Unknown command: " << cmd << ". Type 'help' for usage." << std::endl;
        }
    }

    return 0;
}
