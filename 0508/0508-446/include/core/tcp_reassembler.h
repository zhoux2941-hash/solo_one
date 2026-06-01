#pragma once

#include <map>
#include <unordered_map>
#include <vector>
#include <cstdint>
#include <string>
#include <mutex>
#include <memory>
#include <algorithm>
#include "common/types.h"

namespace wps {

struct TcpSegment {
    uint32_t seq;
    uint32_t len;
    std::vector<uint8_t> data;
    double timestamp;
    bool is_fin;
    bool is_syn;
    bool is_rst;
    uint32_t ack;
};

class TcpStream {
public:
    TcpStream(const std::string& stream_id, uint32_t reassembly_timeout_ms = 5000)
        : stream_id_(stream_id),
          reassembly_timeout_ms_(reassembly_timeout_ms),
          expected_seq_(0),
          next_seq_(0),
          has_syn_(false),
          has_fin_(false),
          last_activity_time_(0),
          reassembly_timeout_count_(0),
          total_bytes_reassembled_(0),
          total_bytes_received_(0),
          retransmit_count_(0),
          out_of_order_count_(0) {}

    void add_segment(const PacketInfo& packet) {
        std::lock_guard<std::mutex> lock(mutex_);

        TcpSegment seg;
        seg.seq = packet.seq;
        seg.len = static_cast<uint32_t>(packet.data.size());
        seg.data = packet.data;
        seg.timestamp = packet.timestamp;
        seg.is_fin = (packet.flags & 0x01) != 0;
        seg.is_syn = (packet.flags & 0x02) != 0;
        seg.is_rst = (packet.flags & 0x04) != 0;
        seg.ack = packet.ack;

        if (seg.is_rst) {
            has_fin_ = true;
            last_activity_time_ = packet.timestamp;
            return;
        }

        if (seg.is_syn && !has_syn_) {
            expected_seq_ = seg.seq + 1;
            next_seq_ = expected_seq_;
            has_syn_ = true;
            last_activity_time_ = packet.timestamp;
            return;
        }

        if (seg.is_fin) {
            has_fin_ = true;
        }

        last_activity_time_ = packet.timestamp;

        if (seg.len == 0) {
            return;
        }

        total_bytes_received_ += seg.len;

        if (is_duplicate(seg)) {
            retransmit_count_++;
            return;
        }

        if (seg.seq == expected_seq_) {
            buffer_ready_.insert(buffer_ready_.end(), seg.data.begin(), seg.data.end());
            expected_seq_ += seg.len;
            next_seq_ = expected_seq_;
            try_chain_buffered_segments();
        } else if (seg.seq > expected_seq_) {
            auto existing = receive_window_.find(seg.seq);
            if (existing != receive_window_.end()) {
                if (seg.len > existing->second.len) {
                    existing->second = seg;
                } else {
                    retransmit_count_++;
                    return;
                }
            } else {
                receive_window_[seg.seq] = seg;
                out_of_order_count_++;
            }
        } else {
            uint32_t overlap = expected_seq_ - seg.seq;
            if (overlap < seg.len) {
                uint32_t new_bytes = seg.len - overlap;
                buffer_ready_.insert(buffer_ready_.end(),
                    seg.data.begin() + overlap, seg.data.end());
                expected_seq_ += new_bytes;
                next_seq_ = expected_seq_;
                try_chain_buffered_segments();
            } else {
                retransmit_count_++;
            }
        }
    }

    std::vector<uint8_t> get_reassembled_data(double current_time) {
        std::lock_guard<std::mutex> lock(mutex_);

        check_timeouts(current_time);

        if (buffer_ready_.empty()) {
            return {};
        }

        std::vector<uint8_t> result = std::move(buffer_ready_);
        buffer_ready_.clear();
        total_bytes_reassembled_ += result.size();
        return result;
    }

    bool has_complete_data() const {
        std::lock_guard<std::mutex> lock(mutex_);
        return receive_window_.empty() && has_fin_;
    }

    bool has_ready_data() const {
        std::lock_guard<std::mutex> lock(mutex_);
        return !buffer_ready_.empty();
    }

    bool is_timed_out(double current_time) const {
        std::lock_guard<std::mutex> lock(mutex_);
        return !receive_window_.empty() &&
               (current_time - last_activity_time_) * 1000 > reassembly_timeout_ms_;
    }

    void check_timeouts(double current_time) {
        if (!is_timed_out_internal(current_time)) {
            return;
        }
        reassembly_timeout_count_++;

        uint32_t lowest_seq = expected_seq_;
        for (const auto& [seq, seg] : receive_window_) {
            if (seq < lowest_seq || lowest_seq == expected_seq_) {
                lowest_seq = seq;
            }
        }
        if (!receive_window_.empty()) {
            expected_seq_ = lowest_seq;
            next_seq_ = lowest_seq;
            try_chain_buffered_segments();
        }
    }

    std::string stream_id() const { return stream_id_; }
    bool has_syn() const { return has_syn_; }
    bool has_fin() const { return has_fin_; }
    uint32_t expected_seq() const { return expected_seq_; }
    uint32_t reassembly_timeout_count() const { return reassembly_timeout_count_; }
    uint64_t total_bytes_reassembled() const { return total_bytes_reassembled_; }
    uint64_t total_bytes_received() const { return total_bytes_received_; }
    uint32_t retransmit_count() const { return retransmit_count_; }
    uint32_t out_of_order_count() const { return out_of_order_count_; }
    double last_activity_time() const { return last_activity_time_; }

    size_t pending_segment_count() const {
        std::lock_guard<std::mutex> lock(mutex_);
        return receive_window_.size();
    }

    size_t ready_data_size() const {
        std::lock_guard<std::mutex> lock(mutex_);
        return buffer_ready_.size();
    }

    uint32_t gap_size() const {
        std::lock_guard<std::mutex> lock(mutex_);
        if (receive_window_.empty()) return 0;
        auto it = receive_window_.begin();
        if (it->first > expected_seq_) {
            return it->first - expected_seq_;
        }
        return 0;
    }

private:
    std::string stream_id_;
    uint32_t reassembly_timeout_ms_;
    uint32_t expected_seq_;
    uint32_t next_seq_;
    bool has_syn_;
    bool has_fin_;
    double last_activity_time_;
    uint32_t reassembly_timeout_count_;
    uint64_t total_bytes_reassembled_;
    uint64_t total_bytes_received_;
    uint32_t retransmit_count_;
    uint32_t out_of_order_count_;

    std::vector<uint8_t> buffer_ready_;
    std::map<uint32_t, TcpSegment> receive_window_;

    mutable std::mutex mutex_;

    bool is_duplicate(const TcpSegment& seg) {
        if (seg.seq + seg.len <= expected_seq_) {
            return true;
        }

        auto it = receive_window_.find(seg.seq);
        if (it != receive_window_.end() && it->second.len >= seg.len) {
            return true;
        }
        return false;
    }

    void try_chain_buffered_segments() {
        while (!receive_window_.empty()) {
            auto it = receive_window_.find(expected_seq_);

            if (it != receive_window_.end()) {
                buffer_ready_.insert(buffer_ready_.end(),
                    it->second.data.begin(), it->second.data.end());
                expected_seq_ += it->second.len;
                next_seq_ = expected_seq_;
                receive_window_.erase(it);
                continue;
            }

            auto first = receive_window_.begin();
            if (first->first < expected_seq_) {
                uint32_t overlap = expected_seq_ - first->first;
                if (overlap < first->second.len) {
                    uint32_t new_bytes = first->second.len - overlap;
                    buffer_ready_.insert(buffer_ready_.end(),
                        first->second.data.begin() + overlap,
                        first->second.data.end());
                    expected_seq_ += new_bytes;
                    next_seq_ = expected_seq_;
                }
                receive_window_.erase(first);
                continue;
            }

            break;
        }
    }

    bool is_timed_out_internal(double current_time) {
        return !receive_window_.empty() &&
               (current_time - last_activity_time_) * 1000 > reassembly_timeout_ms_;
    }
};

class TcpReassembler {
public:
    explicit TcpReassembler(uint32_t reassembly_timeout_ms = 5000)
        : reassembly_timeout_ms_(reassembly_timeout_ms),
          total_streams_(0),
          total_reassembly_timeouts_(0) {}

    void process_packet(const PacketInfo& packet) {
        if (packet.protocol != 6) return;

        std::string stream_id = get_stream_id(packet);

        std::lock_guard<std::mutex> lock(streams_mutex_);
        auto it = streams_.find(stream_id);
        if (it == streams_.end()) {
            auto stream = std::make_shared<TcpStream>(stream_id, reassembly_timeout_ms_);
            stream->add_segment(packet);
            streams_[stream_id] = stream;
            total_streams_++;
        } else {
            it->second->add_segment(packet);
        }
    }

    std::vector<uint8_t> get_stream_data(const std::string& stream_id, double current_time) {
        std::lock_guard<std::mutex> lock(streams_mutex_);
        auto it = streams_.find(stream_id);
        if (it != streams_.end()) {
            auto data = it->second->get_reassembled_data(current_time);
            total_reassembly_timeouts_ += it->second->reassembly_timeout_count();
            return data;
        }
        return {};
    }

    bool stream_has_ready_data(const std::string& stream_id) const {
        std::lock_guard<std::mutex> lock(streams_mutex_);
        auto it = streams_.find(stream_id);
        if (it != streams_.end()) {
            return it->second->has_ready_data();
        }
        return false;
    }

    bool stream_exists(const std::string& stream_id) const {
        std::lock_guard<std::mutex> lock(streams_mutex_);
        return streams_.find(stream_id) != streams_.end();
    }

    void cleanup_stale_streams(double current_time) {
        std::lock_guard<std::mutex> lock(streams_mutex_);
        const double timeout_seconds = static_cast<double>(reassembly_timeout_ms_ * 2) / 1000.0;

        auto it = streams_.begin();
        while (it != streams_.end()) {
            if ((current_time - it->second->last_activity_time()) > timeout_seconds) {
                total_reassembly_timeouts_ += it->second->reassembly_timeout_count();
                it = streams_.erase(it);
            } else {
                ++it;
            }
        }
    }

    std::shared_ptr<TcpStream> get_stream(const std::string& stream_id) {
        std::lock_guard<std::mutex> lock(streams_mutex_);
        auto it = streams_.find(stream_id);
        if (it != streams_.end()) {
            return it->second;
        }
        return nullptr;
    }

    uint64_t total_streams() const { return total_streams_; }
    uint64_t total_reassembly_timeouts() const { return total_reassembly_timeouts_; }

    size_t active_stream_count() const {
        std::lock_guard<std::mutex> lock(streams_mutex_);
        return streams_.size();
    }

    static std::string get_stream_id(const PacketInfo& packet) {
        std::string key1 = packet.src_ip + ":" + std::to_string(packet.src_port) +
                          "-" + packet.dst_ip + ":" + std::to_string(packet.dst_port);
        std::string key2 = packet.dst_ip + ":" + std::to_string(packet.dst_port) +
                          "-" + packet.src_ip + ":" + std::to_string(packet.src_port);
        return key1 < key2 ? key1 : key2;
    }

private:
    uint32_t reassembly_timeout_ms_;
    std::unordered_map<std::string, std::shared_ptr<TcpStream>> streams_;
    mutable std::mutex streams_mutex_;
    std::atomic<uint64_t> total_streams_;
    std::atomic<uint64_t> total_reassembly_timeouts_;
};

}
