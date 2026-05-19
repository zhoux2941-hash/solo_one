#include "connection.h"
#include <iostream>
#include <string>
#include <vector>
#include <thread>
#include <chrono>
#include <iomanip>

void print_usage() {
    std::cout << "Reliable UDP Sender\n";
    std::cout << "Usage: sender <server_ip> <server_port> <file1> [file2] [file3]...\n";
    std::cout << "\nSupports multiple files simultaneously over a single connection.\n";
    std::cout << "Each file uses its own stream with independent congestion control.\n\n";
}

int main(int argc, char* argv[]) {
    if (argc < 4) {
        print_usage();
        return 1;
    }
    
    std::string server_ip = argv[1];
    uint16_t server_port = static_cast<uint16_t>(std::stoi(argv[2]));
    std::vector<std::string> files;
    
    for (int i = 3; i < argc; ++i) {
        files.push_back(argv[i]);
    }
    
    NetworkManager network_mgr;
    network_mgr.initialize();
    
    Connection conn;
    
    std::cout << "Connecting to " << server_ip << ":" << server_port << "...\n";
    
    NetworkAddress server_addr(server_ip, server_port);
    if (!conn.connect(server_addr)) {
        std::cerr << "Failed to connect!\n";
        return 1;
    }
    
    std::cout << "Connected successfully!\n\n";
    
    uint32_t stream_id = 1;
    for (const auto& file : files) {
        std::cout << "Starting transfer: " << file << " (stream " << stream_id << ")\n";
        if (!conn.send_file(stream_id, file)) {
            std::cerr << "Failed to open file: " << file << "\n";
            continue;
        }
        stream_id++;
    }
    
    std::cout << "\nTransfer in progress...\n\n";
    
    auto start_time = std::chrono::steady_clock::now();
    bool all_complete = false;
    
    while (!all_complete) {
        all_complete = true;
        
        auto streams = conn.get_active_streams();
        for (uint32_t sid : streams) {
            float progress = conn.get_stream_progress(sid);
            if (progress < 100.0f) {
                all_complete = false;
            }
        }
        
        auto& stats = conn.statistics();
        std::cout << "\rThroughput: " << std::fixed << std::setprecision(2)
                  << stats.transfer_stats().get_throughput_mbps() << " Mbps | "
                  << "Loss: " << stats.transfer_stats().get_loss_rate() << "% | "
                  << "RTT: " << stats.rtt_stats().smoothed_rtt.load() << " ms"
                  << std::flush;
        
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }
    
    auto end_time = std::chrono::steady_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::seconds>(end_time - start_time).count();
    
    std::cout << "\n\nAll transfers completed!\n";
    std::cout << "Total time: " << duration << " seconds\n\n";
    
    conn.statistics().print_summary();
    
    conn.close();
    
    return 0;
}
