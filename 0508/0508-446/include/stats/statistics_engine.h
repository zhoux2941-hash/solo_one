#pragma once

#include <vector>
#include <string>
#include <unordered_map>
#include <mutex>
#include <algorithm>
#include <cmath>
#include <thread>
#include <atomic>
#include "common/types.h"

namespace wps {

class StatisticsEngine {
public:
    StatisticsEngine() 
        : total_packets_(0), 
          total_bytes_(0),
          start_time_(0),
          end_time_(0),
          reassembly_timeout_threshold_(5),
          enable_anomaly_detection_(true) {}

    void set_reassembly_timeout_threshold(uint32_t threshold) {
        reassembly_timeout_threshold_ = threshold;
    }

    void set_anomaly_detection(bool enable) {
        enable_anomaly_detection_ = enable;
    }

    void process_packet(const ParsedPacket& packet, const ProtocolDescriptor& descriptor) {
        std::lock_guard<std::mutex> lock(mutex_);
        
        total_packets_++;
        total_bytes_ += packet.info.data.size();
        
        if (end_time_ < packet.info.timestamp) {
            end_time_ = packet.info.timestamp;
        }
        if (start_time_ == 0 || start_time_ > packet.info.timestamp) {
            start_time_ = packet.info.timestamp;
        }

        auto& proto_stats = protocol_stats_[packet.protocol_name];
        proto_stats.protocol_name = packet.protocol_name;
        proto_stats.total_packets++;
        proto_stats.total_bytes += packet.info.data.size();

        std::string session_id = get_session_id(packet.info);
        auto& session = sessions_[session_id];
        update_session(session, packet, descriptor);

        for (const auto& field : packet.fields) {
            update_field_distribution(proto_stats, field);
        }

        if (enable_anomaly_detection_) {
            detect_packet_anomalies(packet, proto_stats, session);
        }
    }

    void process_session(const SessionInfo& session) {
        std::lock_guard<std::mutex> lock(mutex_);
        
        auto& proto_stats = protocol_stats_[session.protocol_name];
        proto_stats.total_sessions++;

        for (const auto& anomaly : session.anomalies) {
            proto_stats.anomalies.push_back(anomaly);
        }

        if (session.reassembly_timeout_count > reassembly_timeout_threshold_) {
            proto_stats.anomalies.push_back(
                "Session " + session.session_id + " has " + 
                std::to_string(session.reassembly_timeout_count) + 
                " reassembly timeouts (threshold: " + 
                std::to_string(reassembly_timeout_threshold_) + ")");
        }

        if (!session.is_complete) {
            proto_stats.warnings.push_back(
                "Session " + session.session_id + " did not complete gracefully");
        }
    }

    AnalysisReport get_report(const std::string& filename = "") {
        std::lock_guard<std::mutex> lock(mutex_);
        
        AnalysisReport report;
        report.analysis_start_time = start_time_;
        report.analysis_end_time = end_time_;
        report.total_packets_processed = total_packets_;
        report.total_bytes_processed = total_bytes_;
        report.filename = filename;

        for (auto& [proto_name, proto_stats] : protocol_stats_) {
            calculate_top_field_values(proto_stats);
            
            if (enable_anomaly_detection_) {
                detect_protocol_anomalies(proto_stats);
            }
            
            report.protocol_stats[proto_name] = proto_stats;
            report.total_sessions += proto_stats.total_sessions;
        }

        if (enable_anomaly_detection_) {
            detect_global_anomalies(report);
        }

        return report;
    }

    void reset() {
        std::lock_guard<std::mutex> lock(mutex_);
        total_packets_ = 0;
        total_bytes_ = 0;
        start_time_ = 0;
        end_time_ = 0;
        protocol_stats_.clear();
        sessions_.clear();
    }

    uint64_t total_packets() const { return total_packets_; }
    uint64_t total_bytes() const { return total_bytes_; }
    size_t session_count() const { 
        std::lock_guard<std::mutex> lock(mutex_);
        return sessions_.size(); 
    }

private:
    std::atomic<uint64_t> total_packets_;
    std::atomic<uint64_t> total_bytes_;
    double start_time_;
    double end_time_;
    uint32_t reassembly_timeout_threshold_;
    bool enable_anomaly_detection_;

    std::unordered_map<std::string, ProtocolStats> protocol_stats_;
    std::unordered_map<std::string, SessionInfo> sessions_;
    mutable std::mutex mutex_;

    std::string get_session_id(const PacketInfo& info) {
        std::string key1 = info.src_ip + ":" + std::to_string(info.src_port) + 
                          "-" + info.dst_ip + ":" + std::to_string(info.dst_port);
        std::string key2 = info.dst_ip + ":" + std::to_string(info.dst_port) + 
                          "-" + info.src_ip + ":" + std::to_string(info.src_port);
        return key1 < key2 ? key1 : key2;
    }

    void update_session(SessionInfo& session, const ParsedPacket& packet, 
                       const ProtocolDescriptor& descriptor) {
        if (session.session_id.empty()) {
            session.session_id = get_session_id(packet.info);
            session.protocol_name = packet.protocol_name;
            session.src_ip = packet.info.src_ip;
            session.dst_ip = packet.info.dst_ip;
            session.src_port = packet.info.src_port;
            session.dst_port = packet.info.dst_port;
            session.start_time = packet.info.timestamp;
            session.is_complete = false;
            session.reassembly_timeout_count = 0;
            session.retransmit_count = 0;
        }

        session.packet_count++;
        session.byte_count += packet.info.data.size();
        session.end_time = packet.info.timestamp;

        if (packet.info.is_retransmit) {
            session.retransmit_count++;
        }

        if ((packet.info.flags & 0x01) != 0) {
            session.is_complete = true;
        }

        for (const auto& field : packet.fields) {
            if (std::holds_alternative<uint64_t>(field.value)) {
                session.field_values[field.field_name].push_back(
                    std::get<uint64_t>(field.value));
            }
        }
    }

    void update_field_distribution(ProtocolStats& stats, const FieldValue& field) {
        if (std::holds_alternative<uint64_t>(field.value)) {
            uint64_t val = std::get<uint64_t>(field.value);
            stats.field_distribution[field.field_name][val]++;
        }
    }

    void calculate_top_field_values(ProtocolStats& stats) {
        for (const auto& [field_name, distribution] : stats.field_distribution) {
            std::vector<std::pair<uint64_t, uint64_t>> sorted_values;
            sorted_values.reserve(distribution.size());
            
            for (const auto& [value, count] : distribution) {
                sorted_values.emplace_back(value, count);
            }

            std::sort(sorted_values.begin(), sorted_values.end(),
                [](const auto& a, const auto& b) { return a.second > b.second; });

            size_t top_n = std::min(size_t(10), sorted_values.size());
            for (size_t i = 0; i < top_n; i++) {
                std::string key = field_name + ":" + std::to_string(sorted_values[i].first);
                stats.top_field_values[key] = sorted_values[i].second;
            }
        }
    }

    void detect_packet_anomalies(const ParsedPacket& packet, 
                                 ProtocolStats& proto_stats,
                                 SessionInfo& session) {
        for (const auto& warning : packet.warnings) {
            if (warning.find("unexpected value") != std::string::npos) {
                session.anomalies.push_back(warning);
            }
        }

        if (!packet.is_complete) {
            session.anomalies.push_back(
                "Packet " + std::to_string(packet.info.packet_id) + 
                " has incomplete parse");
        }

        if (packet.info.is_fragmented) {
            proto_stats.warnings.push_back(
                "Packet " + std::to_string(packet.info.packet_id) + " is fragmented");
        }
    }

    void detect_protocol_anomalies(ProtocolStats& stats) {
        if (stats.total_packets == 0) return;

        double avg_packets_per_session = static_cast<double>(stats.total_packets) / 
                                        stats.total_sessions;
        if (stats.total_sessions > 0 && avg_packets_per_session < 2) {
            stats.anomalies.push_back(
                "Abnormally low average packets per session: " + 
                std::to_string(avg_packets_per_session));
        }

        uint64_t total_anomalies = stats.anomalies.size();
        double anomaly_rate = static_cast<double>(total_anomalies) / stats.total_packets;
        if (anomaly_rate > 0.1) {
            stats.anomalies.push_back(
                "High anomaly rate: " + std::to_string(anomaly_rate * 100) + "%");
        }
    }

    void detect_global_anomalies(AnalysisReport& report) {
        uint64_t total_session_count = 0;
        uint64_t total_incomplete_sessions = 0;

        for (const auto& [proto_name, proto_stats] : report.protocol_stats) {
            total_session_count += proto_stats.total_sessions;
            for (const auto& anomaly : proto_stats.anomalies) {
                if (anomaly.find("did not complete") != std::string::npos) {
                    total_incomplete_sessions++;
                }
            }
        }

        if (total_session_count > 0) {
            double incomplete_rate = static_cast<double>(total_incomplete_sessions) / 
                                    total_session_count;
            if (incomplete_rate > 0.3) {
                report.global_anomalies.push_back(
                    "High rate of incomplete sessions: " + 
                    std::to_string(incomplete_rate * 100) + "%");
            }
        }

        double duration = report.analysis_end_time - report.analysis_start_time;
        if (duration > 0) {
            double pps = report.total_packets_processed / duration;
            if (pps > 100000) {
                report.global_anomalies.push_back(
                    "High packet rate: " + std::to_string(pps) + " packets/sec");
            }
        }
    }
};

}
