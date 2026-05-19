#pragma once

#include "protocol.h"
#include <chrono>
#include <atomic>
#include <mutex>
#include <deque>

struct RTTStats {
    std::atomic<uint64_t> latest_rtt;
    std::atomic<uint64_t> smoothed_rtt;
    std::atomic<uint64_t> rtt_var;
    std::atomic<uint64_t> min_rtt;
    std::atomic<uint64_t> max_rtt;
    
    RTTStats();
    void update_rtt(uint64_t rtt_ms);
    uint64_t get_rto() const;
};

struct TransferStats {
    std::atomic<uint64_t> total_packets_sent;
    std::atomic<uint64_t> total_packets_received;
    std::atomic<uint64_t> total_bytes_sent;
    std::atomic<uint64_t> total_bytes_received;
    std::atomic<uint64_t> retransmitted_packets;
    std::atomic<uint64_t> lost_packets;
    std::atomic<uint64_t> duplicate_packets;
    std::atomic<uint64_t> fec_recovered_packets;
    
    TransferStats();
    
    double get_loss_rate() const;
    double get_retransmission_rate() const;
    double get_throughput_mbps() const;
    
    void record_packet_sent(size_t bytes);
    void record_packet_received(size_t bytes);
    void record_retransmission();
    void record_loss();
    void record_duplicate();
    void record_fec_recovery();
    
    void reset();
    
private:
    std::chrono::steady_clock::time_point start_time_;
    mutable std::mutex mutex_;
};

class BandwidthEstimator {
public:
    BandwidthEstimator();
    
    void add_sample(uint64_t bytes, std::chrono::microseconds duration);
    uint64_t get_estimated_bandwidth_bps() const;
    
private:
    struct Sample {
        uint64_t bytes;
        std::chrono::microseconds duration;
        std::chrono::steady_clock::time_point time;
    };
    
    std::deque<Sample> samples_;
    mutable std::mutex mutex_;
    uint64_t estimated_bandwidth_;
};

class StatisticsManager {
public:
    StatisticsManager();
    
    RTTStats& rtt_stats() { return rtt_; }
    TransferStats& transfer_stats() { return transfer_; }
    BandwidthEstimator& bandwidth_estimator() { return bandwidth_; }
    
    const RTTStats& rtt_stats() const { return rtt_; }
    const TransferStats& transfer_stats() const { return transfer_; }
    const BandwidthEstimator& bandwidth_estimator() const { return bandwidth_; }
    
    void print_summary() const;
    void print_realtime() const;
    
    void reset();
    
private:
    RTTStats rtt_;
    TransferStats transfer_;
    BandwidthEstimator bandwidth_;
};
