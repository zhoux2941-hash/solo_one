#pragma once

#include "protocol.h"
#include "statistics.h"
#include <chrono>
#include <atomic>

class CubicCongestionControl {
public:
    CubicCongestionControl();
    
    void on_ack(uint64_t bytes_acked, uint64_t rtt_us);
    void on_loss();
    void on_timeout();
    
    uint64_t get_congestion_window() const { return cwnd_.load(); }
    uint64_t get_ssthresh() const { return ssthresh_.load(); }
    uint64_t get_bytes_in_flight() const { return bytes_in_flight_.load(); }
    
    bool can_send(uint64_t bytes) const;
    void increase_bytes_in_flight(uint64_t bytes);
    void decrease_bytes_in_flight(uint64_t bytes);
    
    void set_initial_cwnd(uint64_t cwnd) { cwnd_ = cwnd; }
    void set_max_cwnd(uint64_t max) { max_cwnd_ = max; }
    
    void enable_highspeed_mode(bool enable) { highspeed_mode_ = enable; }
    
    void reset();
    
private:
    static constexpr double CUBIC_C = 0.4;
    static constexpr double CUBIC_C_HIGHSPEED = 0.8;
    static constexpr double BETA = 0.7;
    static constexpr double BETA_HIGHSPEED = 0.85;
    static constexpr uint64_t INITIAL_CWND = 10 * MAX_PAYLOAD_SIZE;
    static constexpr uint64_t INITIAL_CWND_HIGHSPEED = 100 * MAX_PAYLOAD_SIZE;
    static constexpr uint64_t MIN_CWND = 2 * MAX_PAYLOAD_SIZE;
    static constexpr uint64_t DEFAULT_MAX_CWND = 10000000;
    static constexpr uint64_t DEFAULT_MAX_CWND_HIGHSPEED = 100000000;
    static constexpr uint64_t HIGHSPEED_RTT_THRESHOLD_US = 10000;
    
    std::atomic<uint64_t> cwnd_;
    std::atomic<uint64_t> ssthresh_;
    std::atomic<uint64_t> bytes_in_flight_;
    std::atomic<uint64_t> max_cwnd_;
    std::atomic<bool> highspeed_mode_;
    uint64_t w_max_;
    uint64_t k_;
    uint64_t ack_count_;
    uint64_t total_bytes_acked_in_epoch_;
    std::chrono::steady_clock::time_point epoch_start_;
    std::chrono::steady_clock::time_point last_cwnd_update_;
    bool in_recovery_;
    uint64_t recovery_start_seq_;
    std::mutex mutex_;
    
    uint64_t calculate_cubic_cwnd(uint64_t elapsed_us) const;
    uint64_t calculate_k() const;
    uint64_t calculate_rtt_scaled_increase(uint64_t rtt_us, uint64_t bytes_acked) const;
};

class FlowControl {
public:
    FlowControl();
    
    void update_ack(uint64_t bytes_acked);
    bool has_credit() const;
    
    uint64_t get_send_window() const { return send_window_.load(); }
    uint64_t get_available_credit() const { return available_credit_.load(); }
    
    void set_peer_window(uint64_t window) { peer_window_ = window; }
    void set_send_window(uint64_t window) { send_window_ = window; }
    
private:
    std::atomic<uint64_t> send_window_;
    std::atomic<uint64_t> peer_window_;
    std::atomic<uint64_t> available_credit_;
    std::atomic<uint64_t> bytes_in_flight_;
};
