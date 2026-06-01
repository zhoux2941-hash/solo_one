#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <map>
#include <unordered_map>
#include <memory>
#include <optional>
#include <variant>
#include <functional>
#include <mutex>
#include <atomic>
#include <thread>
#include <condition_variable>

namespace wps {

enum class FieldType {
    UINT8,
    UINT16,
    UINT32,
    UINT64,
    INT8,
    INT16,
    INT32,
    INT64,
    STRING,
    IPV4,
    IPV6,
    MAC,
    BYTES,
    VARIABLE
};

enum class ByteOrder {
    BIG_ENDIAN,
    LITTLE_ENDIAN
};

struct FieldDescriptor {
    std::string name;
    std::string display_name;
    FieldType type;
    ByteOrder byte_order;
    uint32_t offset;
    uint32_t length;
    std::string description;
    std::string filter_name;
    bool is_variable_length;
    std::string length_field;
    std::vector<uint8_t> fixed_value;
    std::string depends_on_field;
    std::string depends_on_condition;
    std::vector<uint64_t> valid_values;
};

struct ProtocolDescriptor {
    std::string name;
    std::string display_name;
    std::string short_name;
    uint16_t default_port;
    uint16_t default_port_tcp;
    uint16_t default_port_udp;
    std::vector<FieldDescriptor> fields;
    std::vector<std::string> handshake_fields;
    bool requires_reassembly;
    uint32_t reassembly_timeout_ms;
};

struct FieldValue {
    std::string field_name;
    std::variant<uint64_t, int64_t, std::string, std::vector<uint8_t>> value;
    uint32_t offset;
    uint32_t length;
    bool is_valid;
};

struct PacketInfo {
    uint64_t packet_id;
    double timestamp;
    uint32_t captured_length;
    uint32_t original_length;
    std::vector<uint8_t> data;
    std::string src_ip;
    std::string dst_ip;
    uint16_t src_port;
    uint16_t dst_port;
    uint8_t protocol;
    uint32_t seq;
    uint32_t ack;
    uint16_t flags;
    std::string stream_id;
    bool is_fragmented;
    bool is_retransmit;
};

struct ParsedPacket {
    PacketInfo info;
    std::string protocol_name;
    std::vector<FieldValue> fields;
    std::vector<std::string> warnings;
    std::vector<std::string> errors;
    bool is_handshake;
    bool is_complete;
};

struct SessionInfo {
    std::string session_id;
    std::string protocol_name;
    std::string src_ip;
    std::string dst_ip;
    uint16_t src_port;
    uint16_t dst_port;
    uint64_t packet_count;
    uint64_t byte_count;
    double start_time;
    double end_time;
    bool is_complete;
    uint32_t reassembly_timeout_count;
    uint32_t retransmit_count;
    std::unordered_map<std::string, std::vector<uint64_t>> field_values;
    std::vector<std::string> anomalies;
};

struct HeuristicRule {
    enum class RuleType {
        FIXED_BYTES,
        PORT_RANGE,
        ENTROPY_RANGE,
        FIELD_VALUE,
        PROTOCOL_PATTERN
    };

    RuleType type;
    std::string name;
    uint32_t offset;
    std::vector<uint8_t> expected_bytes;
    std::vector<uint8_t> mask;
    uint16_t port_min;
    uint16_t port_max;
    double entropy_min;
    double entropy_max;
    double weight;
    bool use_tcp;
    bool use_udp;
};

struct ProtocolStats {
    std::string protocol_name;
    uint64_t total_packets;
    uint64_t total_bytes;
    uint64_t total_sessions;
    std::unordered_map<std::string, std::unordered_map<uint64_t, uint64_t>> field_distribution;
    std::unordered_map<std::string, uint64_t> top_field_values;
    std::vector<std::string> anomalies;
    std::vector<std::string> warnings;
};

struct AnalysisReport {
    double analysis_start_time;
    double analysis_end_time;
    uint64_t total_packets_processed;
    uint64_t total_bytes_processed;
    uint64_t total_sessions;
    std::unordered_map<std::string, ProtocolStats> protocol_stats;
    std::vector<std::string> global_anomalies;
    std::string filename;
};

}
