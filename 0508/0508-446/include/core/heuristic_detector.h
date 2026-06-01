#pragma once

#include <vector>
#include <string>
#include <unordered_map>
#include <memory>
#include <mutex>
#include <cmath>
#include "common/types.h"
#include "common/buffer.h"

namespace wps {

class HeuristicDetector {
public:
    HeuristicDetector() = default;

    void add_protocol(const std::string& protocol_name, 
                      const std::vector<HeuristicRule>& rules) {
        std::lock_guard<std::mutex> lock(mutex_);
        protocol_rules_[protocol_name] = rules;
    }

    void remove_protocol(const std::string& protocol_name) {
        std::lock_guard<std::mutex> lock(mutex_);
        protocol_rules_.erase(protocol_name);
    }

    std::vector<std::pair<std::string, double>> detect_protocols(
            const PacketInfo& packet,
            const std::vector<uint8_t>& payload = {}) {
        std::lock_guard<std::mutex> lock(mutex_);
        std::vector<std::pair<std::string, double>> results;

        const std::vector<uint8_t>* data = &packet.data;
        std::vector<uint8_t> combined;
        if (!payload.empty()) {
            combined = payload;
            data = &combined;
        }

        Buffer buffer(*data);

        for (const auto& [protocol_name, rules] : protocol_rules_) {
            double total_weight = 0.0;
            double matched_weight = 0.0;

            for (const auto& rule : rules) {
                if ((rule.use_tcp && packet.protocol != 6) ||
                    (rule.use_udp && packet.protocol != 17)) {
                    continue;
                }

                total_weight += rule.weight;
                bool matched = false;

                switch (rule.type) {
                    case HeuristicRule::RuleType::FIXED_BYTES:
                        matched = match_fixed_bytes(buffer, rule);
                        break;
                    case HeuristicRule::RuleType::PORT_RANGE:
                        matched = match_port_range(packet, rule);
                        break;
                    case HeuristicRule::RuleType::ENTROPY_RANGE:
                        matched = match_entropy_range(buffer, rule);
                        break;
                    case HeuristicRule::RuleType::FIELD_VALUE:
                        matched = match_field_value(buffer, rule);
                        break;
                    case HeuristicRule::RuleType::PROTOCOL_PATTERN:
                        matched = match_protocol_pattern(buffer, rule);
                        break;
                }

                if (matched) {
                    matched_weight += rule.weight;
                }
            }

            if (total_weight > 0) {
                double confidence = matched_weight / total_weight;
                if (confidence > 0.5) {
                    results.emplace_back(protocol_name, confidence);
                }
            }
        }

        std::sort(results.begin(), results.end(),
            [](const auto& a, const auto& b) { return a.second > b.second; });

        return results;
    }

    std::string detect_protocol(const PacketInfo& packet,
                                const std::vector<uint8_t>& payload = {},
                                double min_confidence = 0.7) {
        auto results = detect_protocols(packet, payload);
        if (!results.empty() && results[0].second >= min_confidence) {
            return results[0].first;
        }
        return "";
    }

    bool is_protocol(const std::string& protocol_name,
                     const PacketInfo& packet,
                     const std::vector<uint8_t>& payload = {},
                     double min_confidence = 0.7) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = protocol_rules_.find(protocol_name);
        if (it == protocol_rules_.end()) return false;

        const std::vector<uint8_t>* data = &packet.data;
        std::vector<uint8_t> combined;
        if (!payload.empty()) {
            combined = payload;
            data = &combined;
        }

        Buffer buffer(*data);
        double total_weight = 0.0;
        double matched_weight = 0.0;

        for (const auto& rule : it->second) {
            if ((rule.use_tcp && packet.protocol != 6) ||
                (rule.use_udp && packet.protocol != 17)) {
                continue;
            }

            total_weight += rule.weight;
            bool matched = false;

            switch (rule.type) {
                case HeuristicRule::RuleType::FIXED_BYTES:
                    matched = match_fixed_bytes(buffer, rule);
                    break;
                case HeuristicRule::RuleType::PORT_RANGE:
                    matched = match_port_range(packet, rule);
                    break;
                case HeuristicRule::RuleType::ENTROPY_RANGE:
                    matched = match_entropy_range(buffer, rule);
                    break;
                case HeuristicRule::RuleType::FIELD_VALUE:
                    matched = match_field_value(buffer, rule);
                    break;
                case HeuristicRule::RuleType::PROTOCOL_PATTERN:
                    matched = match_protocol_pattern(buffer, rule);
                    break;
            }

            if (matched) {
                matched_weight += rule.weight;
            }
        }

        if (total_weight == 0) return false;
        return (matched_weight / total_weight) >= min_confidence;
    }

    size_t registered_protocol_count() const {
        std::lock_guard<std::mutex> lock(mutex_);
        return protocol_rules_.size();
    }

private:
    std::unordered_map<std::string, std::vector<HeuristicRule>> protocol_rules_;
    mutable std::mutex mutex_;

    bool match_fixed_bytes(const Buffer& buffer, const HeuristicRule& rule) {
        if (rule.offset + rule.expected_bytes.size() > buffer.size()) {
            return false;
        }
        return buffer.compare_bytes(rule.offset, rule.expected_bytes, rule.mask);
    }

    bool match_port_range(const PacketInfo& packet, const HeuristicRule& rule) {
        return (packet.src_port >= rule.port_min && packet.src_port <= rule.port_max) ||
               (packet.dst_port >= rule.port_min && packet.dst_port <= rule.port_max);
    }

    bool match_entropy_range(const Buffer& buffer, const HeuristicRule& rule) {
        size_t length = rule.port_max > 0 ? rule.port_max : buffer.size();
        if (rule.offset + length > buffer.size()) {
            length = buffer.size() - rule.offset;
        }
        if (length == 0) return false;

        double entropy = buffer.calculate_entropy(rule.offset, length);
        return entropy >= rule.entropy_min && entropy <= rule.entropy_max;
    }

    bool match_field_value(const Buffer& buffer, const HeuristicRule& rule) {
        if (buffer.size() < 4) return false;
        
        try {
            uint32_t value = buffer.get_u32(rule.offset, ByteOrder::BIG_ENDIAN);
            uint32_t expected = 0;
            if (rule.expected_bytes.size() >= 4) {
                expected = (rule.expected_bytes[0] << 24) |
                          (rule.expected_bytes[1] << 16) |
                          (rule.expected_bytes[2] << 8) |
                           rule.expected_bytes[3];
            }
            return value == expected;
        } catch (...) {
            return false;
        }
    }

    bool match_protocol_pattern(const Buffer& buffer, const HeuristicRule& rule) {
        if (rule.offset + rule.expected_bytes.size() > buffer.size()) {
            return false;
        }
        
        for (size_t i = 0; i < rule.expected_bytes.size(); i++) {
            if (rule.expected_bytes[i] != 0x00) {
                try {
                    if (buffer.get_u8(rule.offset + i) != rule.expected_bytes[i]) {
                        return false;
                    }
                } catch (...) {
                    return false;
                }
            }
        }
        return true;
    }
};

}
