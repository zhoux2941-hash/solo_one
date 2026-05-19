#include "congestion_control.h"
#include <cmath>
#include <algorithm>
#include <iostream>

CubicCongestionControl::CubicCongestionControl()
    : cwnd_(INITIAL_CWND_HIGHSPEED), ssthresh_(UINT64_MAX), bytes_in_flight_(0),
      max_cwnd_(DEFAULT_MAX_CWND_HIGHSPEED), highspeed_mode_(true),
      w_max_(0), k_(0), ack_count_(0), total_bytes_acked_in_epoch_(0),
      in_recovery_(false), recovery_start_seq_(0) {}

void CubicCongestionControl::on_ack(uint64_t bytes_acked, uint64_t rtt_us) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (bytes_in_flight_ >= bytes_acked) {
        bytes_in_flight_ -= bytes_acked;
    } else {
        bytes_in_flight_ = 0;
    }
    
    if (in_recovery_) {
        return;
    }
    
    if (rtt_us < HIGHSPEED_RTT_THRESHOLD_US && !highspeed_mode_) {
        highspeed_mode_ = true;
        max_cwnd_ = DEFAULT_MAX_CWND_HIGHSPEED;
    }
    
    auto now = std::chrono::steady_clock::now();
    
    if (epoch_start_.time_since_epoch().count() == 0) {
        epoch_start_ = now;
        last_cwnd_update_ = now;
    }
    
    ack_count_++;
    total_bytes_acked_in_epoch_ += bytes_acked;
    
    auto elapsed_us = std::chrono::duration_cast<std::chrono::microseconds>(now - epoch_start_).count();
    auto time_since_update_us = std::chrono::duration_cast<std::chrono::microseconds>(now - last_cwnd_update_).count();
    
    uint64_t min_update_interval = std::max(uint64_t(100), rtt_us / 4);
    
    if (time_since_update_us < static_cast<int64_t>(min_update_interval)) {
        return;
    }
    
    last_cwnd_update_ = now;
    
    if (cwnd_ < ssthresh_) {
        uint64_t increase = calculate_rtt_scaled_increase(rtt_us, bytes_acked);
        cwnd_ = std::min(cwnd_ + increase, max_cwnd_.load());
    } else {
        uint64_t target = calculate_cubic_cwnd(static_cast<uint64_t>(elapsed_us));
        if (cwnd_ < target) {
            uint64_t diff = target - cwnd_;
            
            uint64_t increase;
            if (highspeed_mode_) {
                increase = std::max(diff / 8, MAX_PAYLOAD_SIZE * 2);
            } else {
                increase = std::max(diff / 20, MAX_PAYLOAD_SIZE / 2);
            }
            
            cwnd_ = std::min(cwnd_ + increase, max_cwnd_.load());
        }
    }
    
    w_max_ = std::max(w_max_, cwnd_.load());
    ack_count_ = 0;
    total_bytes_acked_in_epoch_ = 0;
}

void CubicCongestionControl::on_loss() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (in_recovery_) {
        return;
    }
    
    w_max_ = cwnd_.load();
    double beta = highspeed_mode_ ? BETA_HIGHSPEED : BETA;
    ssthresh_ = static_cast<uint64_t>(cwnd_.load() * beta);
    cwnd_ = std::max(ssthresh_.load(), MIN_CWND);
    epoch_start_ = std::chrono::steady_clock::time_point();
    last_cwnd_update_ = std::chrono::steady_clock::time_point();
    ack_count_ = 0;
    total_bytes_acked_in_epoch_ = 0;
    k_ = calculate_k();
}

void CubicCongestionControl::on_timeout() {
    std::lock_guard<std::mutex> lock(mutex_);
    
    w_max_ = cwnd_.load();
    double beta = highspeed_mode_ ? BETA_HIGHSPEED : BETA;
    ssthresh_ = std::max(static_cast<uint64_t>(cwnd_.load() * beta), MIN_CWND);
    cwnd_ = highspeed_mode_ ? INITIAL_CWND_HIGHSPEED : INITIAL_CWND;
    bytes_in_flight_ = 0;
    epoch_start_ = std::chrono::steady_clock::time_point();
    last_cwnd_update_ = std::chrono::steady_clock::time_point();
    ack_count_ = 0;
    total_bytes_acked_in_epoch_ = 0;
    in_recovery_ = false;
}

bool CubicCongestionControl::can_send(uint64_t bytes) const {
    return bytes_in_flight_.load() + bytes <= cwnd_.load();
}

void CubicCongestionControl::increase_bytes_in_flight(uint64_t bytes) {
    bytes_in_flight_ += bytes;
}

void CubicCongestionControl::decrease_bytes_in_flight(uint64_t bytes) {
    if (bytes_in_flight_ >= bytes) {
        bytes_in_flight_ -= bytes;
    } else {
        bytes_in_flight_ = 0;
    }
}

void CubicCongestionControl::reset() {
    std::lock_guard<std::mutex> lock(mutex_);
    cwnd_ = highspeed_mode_ ? INITIAL_CWND_HIGHSPEED : INITIAL_CWND;
    ssthresh_ = UINT64_MAX;
    bytes_in_flight_ = 0;
    w_max_ = 0;
    k_ = 0;
    ack_count_ = 0;
    total_bytes_acked_in_epoch_ = 0;
    epoch_start_ = std::chrono::steady_clock::time_point();
    last_cwnd_update_ = std::chrono::steady_clock::time_point();
    in_recovery_ = false;
}

uint64_t CubicCongestionControl::calculate_cubic_cwnd(uint64_t elapsed_us) const {
    double t = elapsed_us / 1000000.0;
    double k_seconds = k_ / 1000000.0;
    double diff = std::abs(t - k_seconds);
    double c = highspeed_mode_ ? CUBIC_C_HIGHSPEED : CUBIC_C;
    double cwnd_increase = c * std::pow(diff, 3) * MAX_PAYLOAD_SIZE;
    
    if (t < k_seconds) {
        return static_cast<uint64_t>(w_max_ - cwnd_increase);
    } else {
        return static_cast<uint64_t>(w_max_ + cwnd_increase);
    }
}

uint64_t CubicCongestionControl::calculate_k() const {
    if (w_max_ <= MIN_CWND) {
        return 0;
    }
    double beta = highspeed_mode_ ? BETA_HIGHSPEED : BETA;
    double c = highspeed_mode_ ? CUBIC_C_HIGHSPEED : CUBIC_C;
    double diff = w_max_ * (1 - beta);
    double k_cbrt = std::cbrt(diff / (c * MAX_PAYLOAD_SIZE));
    return static_cast<uint64_t>(k_cbrt * 1000000);
}

uint64_t CubicCongestionControl::calculate_rtt_scaled_increase(uint64_t rtt_us, uint64_t bytes_acked) const {
    if (rtt_us == 0) {
        return bytes_acked * 2;
    }
    
    double rtt_scale = 10000.0 / std::max(static_cast<double>(rtt_us), 100.0);
    rtt_scale = std::min(rtt_scale, 10.0);
    
    double base_increase = static_cast<double>(bytes_acked);
    
    if (highspeed_mode_) {
        uint64_t cwnd_mss = cwnd_ / MAX_PAYLOAD_SIZE;
        double cwnd_factor = std::sqrt(static_cast<double>(cwnd_mss)) / 10.0;
        cwnd_factor = std::max(cwnd_factor, 1.0);
        base_increase *= std::min(rtt_scale * cwnd_factor, 5.0);
    }
    
    return static_cast<uint64_t>(std::max(base_increase, static_cast<double>(MAX_PAYLOAD_SIZE)));
}

FlowControl::FlowControl()
    : send_window_(65536 * 256), peer_window_(65536 * 256),
      available_credit_(send_window_), bytes_in_flight_(0) {}

void FlowControl::update_ack(uint64_t bytes_acked) {
    if (bytes_in_flight_ >= bytes_acked) {
        bytes_in_flight_ -= bytes_acked;
    } else {
        bytes_in_flight_ = 0;
    }
    available_credit_ = std::min(send_window_.load(), peer_window_.load()) - bytes_in_flight_;
}

bool FlowControl::has_credit() const {
    return available_credit_.load() >= MAX_PAYLOAD_SIZE;
}
