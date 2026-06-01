#pragma once

#include <string>
#include <vector>
#include <memory>
#include <thread>
#include <atomic>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <functional>
#include <future>
#include <algorithm>
#include "common/types.h"
#include "pcap/pcap_reader.h"
#include "core/tcp_reassembler.h"
#include "core/protocol_parser.h"
#include "core/heuristic_detector.h"
#include "stats/statistics_engine.h"

namespace wps {

class PcapAnalyzer {
public:
    explicit PcapAnalyzer(size_t num_threads = std::thread::hardware_concurrency())
        : num_threads_(num_threads > 0 ? num_threads : 4),
          stop_processing_(false),
          active_workers_(0),
          total_packets_processed_(0),
          total_bytes_processed_(0) {}

    ~PcapAnalyzer() {
        stop();
    }

    void register_protocol(const ProtocolDescriptor& descriptor,
                          const std::vector<HeuristicRule>& rules = {}) {
        std::lock_guard<std::mutex> lock(registry_mutex_);
        parsers_[descriptor.name] = std::make_unique<ProtocolParser>(descriptor);
        if (!rules.empty()) {
            heuristic_detector_.add_protocol(descriptor.name, rules);
        }
        port_protocol_map_[descriptor.default_port_tcp] = descriptor.name;
        port_protocol_map_[descriptor.default_port_udp] = descriptor.name;
        descriptors_[descriptor.name] = descriptor;
    }

    void set_reassembly_timeout(uint32_t timeout_ms) {
        reassembly_timeout_ms_ = timeout_ms;
        reassembler_ = std::make_unique<TcpReassembler>(timeout_ms);
    }

    AnalysisReport analyze_file(const std::string& filename,
                               bool use_heuristic = true,
                               size_t batch_size = 1000) {
        PcapReader reader;
        if (!reader.open(filename)) {
            throw std::runtime_error("Failed to open pcap file: " + filename);
        }

        reader.start_prefetch(50000);
        reassembler_ = std::make_unique<TcpReassembler>(reassembly_timeout_ms_);
        stats_engine_ = std::make_unique<StatisticsEngine>();
        stats_engine_->set_reassembly_timeout_threshold(reassembly_timeout_threshold_);

        stop_processing_ = false;
        active_workers_ = 0;
        total_packets_processed_ = 0;
        total_bytes_processed_ = 0;

        std::vector<std::thread> workers;
        for (size_t i = 0; i < num_threads_; i++) {
            workers.emplace_back(&PcapAnalyzer::worker_thread, this);
        }

        PacketInfo packet;
        while (reader.get_prefetched(packet, 100)) {
            std::unique_lock<std::mutex> lock(queue_mutex_);
            queue_cv_.wait(lock, [this, batch_size]() { 
                return packet_queue_.size() < batch_size * num_threads_; 
            });
            packet_queue_.push(packet);
            queue_cv_.notify_all();
        }

        {
            std::lock_guard<std::mutex> lock(queue_mutex_);
            stop_processing_ = true;
            queue_cv_.notify_all();
        }

        for (auto& t : workers) {
            t.join();
        }

        reader.stop_prefetch();
        reader.close();

        auto sessions = get_all_sessions();
        for (const auto& session : sessions) {
            stats_engine_->process_session(session);
        }

        return stats_engine_->get_report(filename);
    }

    void stop() {
        stop_processing_ = true;
        queue_cv_.notify_all();
    }

    uint64_t total_packets() const { return total_packets_processed_.load(); }
    uint64_t total_bytes() const { return total_bytes_processed_.load(); }
    size_t active_workers() const { return active_workers_.load(); }
    size_t queue_size() const {
        std::lock_guard<std::mutex> lock(queue_mutex_);
        return packet_queue_.size();
    }

private:
    size_t num_threads_;
    std::atomic<bool> stop_processing_;
    std::atomic<size_t> active_workers_;
    std::atomic<uint64_t> total_packets_processed_;
    std::atomic<uint64_t> total_bytes_processed_;

    mutable std::mutex queue_mutex_;
    std::condition_variable queue_cv_;
    std::queue<PacketInfo> packet_queue_;

    mutable std::mutex registry_mutex_;
    std::unordered_map<std::string, std::unique_ptr<ProtocolParser>> parsers_;
    std::unordered_map<std::string, ProtocolDescriptor> descriptors_;
    std::unordered_map<uint16_t, std::string> port_protocol_map_;
    HeuristicDetector heuristic_detector_;

    std::unique_ptr<TcpReassembler> reassembler_;
    std::unique_ptr<StatisticsEngine> stats_engine_;

    uint32_t reassembly_timeout_ms_ = 5000;
    uint32_t reassembly_timeout_threshold_ = 5;

    mutable std::mutex sessions_mutex_;
    std::unordered_map<std::string, std::vector<PacketInfo>> stream_packets_;

    void worker_thread() {
        active_workers_++;
        
        while (!stop_processing_ || !packet_queue_.empty()) {
            std::unique_lock<std::mutex> lock(queue_mutex_);
            queue_cv_.wait(lock, [this]() { 
                return !packet_queue_.empty() || stop_processing_; 
            });

            if (packet_queue_.empty()) break;

            PacketInfo packet = packet_queue_.front();
            packet_queue_.pop();
            lock.unlock();
            queue_cv_.notify_all();

            process_packet(packet);
        }

        active_workers_--;
    }

    void process_packet(const PacketInfo& packet) {
        total_packets_processed_++;
        total_bytes_processed_ += packet.data.size();

        if (packet.protocol == 6) {
            reassembler_->process_packet(packet);
        }

        {
            std::lock_guard<std::mutex> lock(sessions_mutex_);
            stream_packets_[packet.stream_id].push_back(packet);
        }

        std::string protocol_name = identify_protocol(packet);

        if (protocol_name.empty()) return;

        std::vector<uint8_t> reassembled_data;
        auto it = descriptors_.find(protocol_name);
        if (it != descriptors_.end() && it->second.requires_reassembly && packet.protocol == 6) {
            reassembled_data = reassembler_->get_stream_data(packet.stream_id, packet.timestamp);
        }

        std::shared_ptr<ProtocolParser> parser;
        {
            std::lock_guard<std::mutex> lock(registry_mutex_);
            auto parser_it = parsers_.find(protocol_name);
            if (parser_it != parsers_.end()) {
                parser = parser_it->second;
            }
        }

        if (parser) {
            ParsedPacket parsed = parser->parse_packet(packet, reassembled_data);
            parsed.protocol_name = protocol_name;
            
            if (it != descriptors_.end()) {
                stats_engine_->process_packet(parsed, it->second);
            }
        }

        if (total_packets_processed_ % 100000 == 0) {
            reassembler_->cleanup_stale_streams(packet.timestamp);
        }
    }

    std::string identify_protocol(const PacketInfo& packet) {
        std::lock_guard<std::mutex> lock(registry_mutex_);

        auto it_tcp = port_protocol_map_.find(packet.dst_port);
        auto it_src = port_protocol_map_.find(packet.src_port);
        
        if (it_tcp != port_protocol_map_.end()) {
            return it_tcp->second;
        }
        if (it_src != port_protocol_map_.end()) {
            return it_src->second;
        }

        if (heuristic_detector_.registered_protocol_count() > 0) {
            return heuristic_detector_.detect_protocol(packet, {}, 0.7);
        }

        return "";
    }

    std::vector<SessionInfo> get_all_sessions() const {
        std::lock_guard<std::mutex> lock(sessions_mutex_);
        std::vector<SessionInfo> sessions;
        sessions.reserve(stream_packets_.size());

        for (const auto& [stream_id, packets] : stream_packets_) {
            SessionInfo session;
            session.session_id = stream_id;
            if (!packets.empty()) {
                const auto& first = packets.front();
                const auto& last = packets.back();
                session.src_ip = first.src_ip;
                session.dst_ip = first.dst_ip;
                session.src_port = first.src_port;
                session.dst_port = first.dst_port;
                session.start_time = first.timestamp;
                session.end_time = last.timestamp;
                session.packet_count = packets.size();
                
                for (const auto& p : packets) {
                    session.byte_count += p.data.size();
                    if ((p.flags & 0x01) != 0) session.is_complete = true;
                }
            }

            auto stream = reassembler_ ? reassembler_->get_stream(stream_id) : nullptr;
            if (stream) {
                session.reassembly_timeout_count = stream->reassembly_timeout_count();
                session.is_complete = session.is_complete && stream->has_fin();
            }

            sessions.push_back(session);
        }

        return sessions;
    }
};

}
