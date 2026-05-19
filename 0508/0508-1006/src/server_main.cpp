#include <iostream>
#include <string>
#include <memory>
#include <signal.h>
#include <spdlog/spdlog.h>
#include <spdlog/sinks/basic_file_sink.h>
#include <spdlog/sinks/stdout_color_sinks.h>
#include "kv/kv_server.h"
#include "common/config.h"

using namespace paxoskv;

std::unique_ptr<KVServiceImpl> g_server;

void signal_handler(int signum) {
    SPDLOG_INFO("Received signal {}, shutting down...", signum);
    if (g_server) {
        g_server->Stop();
    }
    exit(0);
}

void setup_logging(uint64_t node_id) {
    std::vector<spdlog::sink_ptr> sinks;
    auto console_sink = std::make_shared<spdlog::sinks::stdout_color_sink_mt>();
    console_sink->set_level(spdlog::level::info);
    sinks.push_back(console_sink);

    try {
        auto file_sink = std::make_shared<spdlog::sinks::basic_file_sink_mt>(
            "logs/paxoskv_node_" + std::to_string(node_id) + ".log", true);
        file_sink->set_level(spdlog::level::debug);
        sinks.push_back(file_sink);
    } catch (const spdlog::spdlog_ex& ex) {
        std::cerr << "Log init failed: " << ex.what() << std::endl;
    }

    auto logger = std::make_shared<spdlog::logger>("multi_sink", sinks.begin(), sinks.end());
    logger->set_level(spdlog::level::debug);
    logger->flush_on(spdlog::level::info);
    spdlog::set_default_logger(logger);
    spdlog::set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%^%l%$] [node-%n] %v");
    spdlog::set_default_logger(logger);
}

void print_usage(const char* program) {
    std::cout << "Usage: " << program << " <node_id> [options]\n" << std::endl;
    std::cout << "node_id: 1, 2, or 3 for the 3-node cluster" << std::endl;
    std::cout << "\nOptions:" << std::endl;
    std::cout << "  --data-dir <path>    Data directory (default: ./data)" << std::endl;
    std::cout << "  --cluster <nodes>    Comma-separated cluster nodes in format:" << std::endl;
    std::cout << "                        id:kv_address:paxos_address,..." << std::endl;
    std::cout << "                        (default for 3-node cluster:)" << std::endl;
    std::cout << "                        1:0.0.0.0:8001:0.0.0.0:9001," << std::endl;
    std::cout << "                        2:0.0.0.0:8002:0.0.0.0:9002," << std::endl;
    std::cout << "                        3:0.0.0.0:8003:0.0.0.0:9003" << std::endl;
    std::cout << "\nExamples:" << std::endl;
    std::cout << "  " << program << " 1" << std::endl;
    std::cout << "  " << program << " 1 --data-dir /data/paxoskv" << std::endl;
    std::cout << "  " << program << " 1 --cluster \"1:192.168.1.1:8001:9001,2:192.168.1.2:8002:9002,3:192.168.1.3:8003:9003\"" << std::endl;
}

void setup_default_cluster(uint64_t node_id) {
    auto& config = Config::Instance();

    std::vector<NodeConfig> nodes;

    NodeConfig n1, n2, n3;
    n1.node_id = 1;
    n1.address = "0.0.0.0:8001";
    n1.paxos_address = "0.0.0.0:9001";

    n2.node_id = 2;
    n2.address = "0.0.0.0:8002";
    n2.paxos_address = "0.0.0.0:9002";

    n3.node_id = 3;
    n3.address = "0.0.0.0:8003";
    n3.paxos_address = "0.0.0.0:9003";

    config.cluster_nodes = {n1, n2, n3};
}

bool parse_cluster_config(const std::string& cluster_str) {
    auto& config = Config::Instance();
    config.cluster_nodes.clear();

    auto nodes = Utils::Split(cluster_str, ',');
    for (const auto& node_str : nodes) {
        auto parts = Utils::Split(node_str, ':');
        if (parts.size() != 4) {
            std::cerr << "Invalid node config: " << node_str << std::endl;
            return false;
        }

        NodeConfig node;
        node.node_id = std::stoull(parts[0]);
        node.address = parts[1] + ":" + parts[2];
        node.paxos_address = parts[1] + ":" + parts[3];
        config.cluster_nodes.push_back(node);
    }

    return config.cluster_nodes.size() >= 3;
}

int main(int argc, char** argv) {
    if (argc < 2) {
        print_usage(argv[0]);
        return 1;
    }

    uint64_t node_id = std::stoull(argv[1]);
    if (node_id < 1 || node_id > 3) {
        std::cerr << "node_id must be 1, 2, or 3" << std::endl;
        return 1;
    }

    std::string data_dir = "./data";
    std::string cluster_config = "";

    for (int i = 2; i < argc; i += 2) {
        std::string arg = argv[i];
        if (arg == "--data-dir" && i + 1 < argc) {
            data_dir = argv[i + 1];
        } else if (arg == "--cluster" && i + 1 < argc) {
            cluster_config = argv[i + 1];
        } else if (arg == "--help" || arg == "-h") {
            print_usage(argv[0]);
            return 0;
        } else {
            std::cerr << "Unknown option: " << arg << std::endl;
            print_usage(argv[0]);
            return 1;
        }
    }

    setup_logging(node_id);

    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);

    if (!cluster_config.empty()) {
        if (!parse_cluster_config(cluster_config)) {
            std::cerr << "Failed to parse cluster configuration" << std::endl;
            return 1;
        }
    } else {
        setup_default_cluster(node_id);
    }

    std::string kv_address, paxos_address;
    for (const auto& node : Config::Instance().cluster_nodes) {
        if (node.node_id == node_id) {
            kv_address = node.address;
            paxos_address = node.paxos_address;
            break;
        }
    }

    if (kv_address.empty()) {
        std::cerr << "Node " << node_id << " not found in cluster configuration" << std::endl;
        return 1;
    }

    SPDLOG_INFO("Starting PaxosKV node {}", node_id);
    SPDLOG_INFO("KV address: {}", kv_address);
    SPDLOG_INFO("Paxos address: {}", paxos_address);
    SPDLOG_INFO("Data directory: {}", data_dir);
    SPDLOG_INFO("Cluster size: {}", Config::Instance().cluster_nodes.size());

    g_server = std::make_unique<KVServiceImpl>();

    if (!g_server->Init(node_id, kv_address, paxos_address, data_dir)) {
        SPDLOG_ERROR("Failed to initialize server");
        return 1;
    }

    g_server->Start();

    SPDLOG_INFO("Server started successfully. Waiting for connections...");
    SPDLOG_INFO("Use CLI client to connect: ./paxos_kv_client {}", kv_address);

    while (true) {
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }

    return 0;
}
