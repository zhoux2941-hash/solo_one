#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace paxoskv {

struct NodeConfig {
    uint64_t node_id;
    std::string address;
    std::string paxos_address;
};

class Config {
public:
    static Config& Instance() {
        static Config instance;
        return instance;
    }

    uint64_t node_id = 1;
    std::string address = "0.0.0.0:8001";
    std::string paxos_address = "0.0.0.0:9001";
    std::string data_dir = "./data";
    std::string log_dir = "./logs";

    std::vector<NodeConfig> cluster_nodes;

    uint64_t election_timeout_ms = 5000;
    uint64_t heartbeat_interval_ms = 1000;
    uint64_t snapshot_interval_s = 300;
    uint64_t log_compaction_threshold = 10000;

    uint64_t max_append_entries = 100;
    uint64_t rpc_timeout_ms = 2000;

private:
    Config() = default;
};

} 
