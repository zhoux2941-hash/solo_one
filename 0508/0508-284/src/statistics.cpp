#include "statistics.h"
#include <iostream>
#include <iomanip>
#include <algorithm>

RTTStats::RTTStats()
    : latest_rtt(0), smoothed_rtt(0), rtt_var(0), min_rtt(UINT64_MAX), max_rtt(0) {}

void RTTStats::update_rtt(uint64_t rtt_ms) {
    if (rtt_ms == 0) return;
    
    latest_rtt = rtt_ms;
    
    if (rtt_ms < min_rtt) min_rtt = rtt_ms;
    if (rtt_ms > max_rtt) max_rtt = rtt_ms;
    
    if (smoothed_rtt == 0) {
        smoothed_rtt = rtt_ms;
        rtt_var = rtt_ms / 2;
    } else {
        uint64_t delta = (rtt_ms > smoothed_rtt) ? (rtt_ms - smoothed_rtt) : (smoothed_rtt - rtt_ms);
        rtt_var = (3 * rtt_var + delta) / 4;
        smoothed_rtt = (7 * smoothed_rtt + rtt_ms) / 8;
    }
}

uint64_t RTTStats::get_rto() const {
    if (smoothed_rtt == 0) return 1000;
    return smoothed_rtt + 4 * rtt_var + 200;
}

TransferStats::TransferStats()
    : total_packets_sent(0), total_packets_received(0),
      total_bytes_sent(0), total_bytes_received(0),
      retransmitted_packets(0), lost_packets(0),
      duplicate_packets(0), fec_recovered_packets(0),
      start_time_(std::chrono::steady_clock::now()) {}

double TransferStats::get_loss_rate() const {
    uint64_t total = total_packets_sent.load();
    if (total == 0) return 0.0;
    return static_cast<double>(lost_packets.load()) / total * 100.0;
}

double TransferStats::get_retransmission_rate() const {
    uint64_t total = total_packets_sent.load();
    if (total == 0) return 0.0;
    return static_cast<double>(retransmitted_packets.load()) / total * 100.0;
}

double TransferStats::get_throughput_mbps() const {
    auto now = std::chrono::steady_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::seconds>(now - start_time_).count();
    if (duration == 0) return 0.0;
    
    uint64_t bytes = total_bytes_received.load();
    return (bytes * 8.0) / (1024.0 * 1024.0 * duration);
}

void TransferStats::record_packet_sent(size_t bytes) {
    total_packets_sent++;
    total_bytes_sent += bytes;
}

void TransferStats::record_packet_received(size_t bytes) {
    total_packets_received++;
    total_bytes_received += bytes;
}

void TransferStats::record_retransmission() {
    retransmitted_packets++;
}

void TransferStats::record_loss() {
    lost_packets++;
}

void TransferStats::record_duplicate() {
    duplicate_packets++;
}

void TransferStats::record_fec_recovery() {
    fec_recovered_packets++;
}

void TransferStats::reset() {
    std::lock_guard<std::mutex> lock(mutex_);
    total_packets_sent = 0;
    total_packets_received = 0;
    total_bytes_sent = 0;
    total_bytes_received = 0;
    retransmitted_packets = 0;
    lost_packets = 0;
    duplicate_packets = 0;
    fec_recovered_packets = 0;
    start_time_ = std::chrono::steady_clock::now();
}

BandwidthEstimator::BandwidthEstimator() : estimated_bandwidth_(0) {}

void BandwidthEstimator::add_sample(uint64_t bytes, std::chrono::microseconds duration) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    Sample sample;
    sample.bytes = bytes;
    sample.duration = duration;
    sample.time = std::chrono::steady_clock::now();
    samples_.push_back(sample);
    
    auto cutoff = sample.time - std::chrono::seconds(5);
    while (!samples_.empty() && samples_.front().time < cutoff) {
        samples_.pop_front();
    }
    
    if (samples_.size() > 1) {
        uint64_t total_bytes = 0;
        auto first_time = samples_.front().time;
        auto last_time = samples_.back().time;
        
        for (const auto& s : samples_) {
            total_bytes += s.bytes;
        }
        
        auto time_diff = std::chrono::duration_cast<std::chrono::microseconds>(last_time - first_time);
        if (time_diff.count() > 0) {
            estimated_bandwidth_ = (total_bytes * 8 * 1000000ULL) / time_diff.count();
        }
    }
}

uint64_t BandwidthEstimator::get_estimated_bandwidth_bps() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return estimated_bandwidth_;
}

StatisticsManager::StatisticsManager() {}

void StatisticsManager::print_summary() const {
    std::cout << "\n=== Transfer Statistics Summary ===\n";
    std::cout << "Packets Sent:     " << transfer_.total_packets_sent << "\n";
    std::cout << "Packets Received: " << transfer_.total_packets_received << "\n";
    std::cout << "Bytes Sent:       " << transfer_.total_bytes_sent << "\n";
    std::cout << "Bytes Received:   " << transfer_.total_bytes_received << "\n";
    std::cout << "Retransmissions:  " << transfer_.retransmitted_packets << "\n";
    std::cout << "Lost Packets:     " << transfer_.lost_packets << "\n";
    std::cout << "Duplicate Packets:" << transfer_.duplicate_packets << "\n";
    std::cout << "FEC Recovered:    " << transfer_.fec_recovered_packets << "\n";
    std::cout << std::fixed << std::setprecision(2);
    std::cout << "Loss Rate:        " << transfer_.get_loss_rate() << "%\n";
    std::cout << "Retransmit Rate:  " << transfer_.get_retransmission_rate() << "%\n";
    std::cout << "Throughput:       " << transfer_.get_throughput_mbps() << " Mbps\n";
    std::cout << "RTT (min/avg/max):" << rtt_.min_rtt << "/" << rtt_.smoothed_rtt << "/" << rtt_.max_rtt << " ms\n";
    std::cout << "===================================\n\n";
}

void StatisticsManager::print_realtime() const {
    std::cout << "\rThroughput: " << std::fixed << std::setprecision(2) 
              << transfer_.get_throughput_mbps() << " Mbps | "
              << "Loss: " << transfer_.get_loss_rate() << "% | "
              << "RTT: " << rtt_.smoothed_rtt << " ms" << std::flush;
}

void StatisticsManager::reset() {
    rtt_ = RTTStats();
    transfer_.reset();
}
