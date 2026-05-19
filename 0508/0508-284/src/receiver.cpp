#include "connection.h"
#include <iostream>
#include <string>
#include <thread>
#include <chrono>
#include <filesystem>
#include <iomanip>

void print_usage() {
    std::cout << "Reliable UDP Receiver\n";
    std::cout << "Usage: receiver <listen_port> [output_directory]\n";
    std::cout << "\nSupports receiving multiple files simultaneously over a single connection.\n";
    std::cout << "Each file uses its own stream with independent congestion control.\n\n";
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        print_usage();
        return 1;
    }
    
    uint16_t listen_port = static_cast<uint16_t>(std::stoi(argv[1]));
    std::string output_dir = ".";
    
    if (argc >= 3) {
        output_dir = argv[2];
        std::filesystem::create_directories(output_dir);
    }
    
    NetworkManager network_mgr;
    network_mgr.initialize();
    
    Connection conn;
    
    std::cout << "Listening on port " << listen_port << "...\n";
    std::cout << "Output directory: " << std::filesystem::absolute(output_dir) << "\n\n";
    
    std::atomic<bool> connected(false);
    uint32_t next_stream_id = 1;
    
    conn.set_data_callback([&](uint32_t stream_id, const std::vector<uint8_t>& data) {
        if (data.size() >= sizeof(FileInfoPacket)) {
            FileInfoPacket file_info;
            std::memcpy(&file_info, data.data(), sizeof(FileInfoPacket));
            
            size_t filename_offset = sizeof(FileInfoPacket);
            std::string filename(
                data.begin() + filename_offset,
                data.begin() + filename_offset + file_info.filename_length
            );
            
            std::filesystem::path output_path = std::filesystem::path(output_dir) / filename;
            
            std::cout << "\nIncoming file: " << filename << "\n";
            std::cout << "Size: " << file_info.file_size << " bytes\n";
            std::cout << "Stream ID: " << stream_id << "\n\n";
            
            conn.receive_file(stream_id, output_path.string());
        }
    });
    
    conn.set_connect_callback([&](uint32_t) {
        connected = true;
        std::cout << "\nClient connected!\n\n";
    });
    
    if (!conn.listen(listen_port)) {
        std::cerr << "Failed to listen on port " << listen_port << "!\n";
        return 1;
    }
    
    auto start_time = std::chrono::steady_clock::now();
    
    while (true) {
        if (connected) {
            auto streams = conn.get_active_streams();
            bool all_complete = !streams.empty();
            
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
            
            if (all_complete) {
                break;
            }
        }
        
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
