#include "common/types.h"
#include <sstream>

namespace wps {

std::string field_type_to_string(FieldType type) {
    switch (type) {
        case FieldType::UINT8: return "uint8";
        case FieldType::UINT16: return "uint16";
        case FieldType::UINT32: return "uint32";
        case FieldType::UINT64: return "uint64";
        case FieldType::INT8: return "int8";
        case FieldType::INT16: return "int16";
        case FieldType::INT32: return "int32";
        case FieldType::INT64: return "int64";
        case FieldType::STRING: return "string";
        case FieldType::IPV4: return "ipv4";
        case FieldType::IPV6: return "ipv6";
        case FieldType::MAC: return "mac";
        case FieldType::VARIABLE: return "variable";
        case FieldType::BYTES: return "bytes";
        default: return "unknown";
    }
}

FieldType string_to_field_type(const std::string& s) {
    if (s == "uint8") return FieldType::UINT8;
    if (s == "uint16") return FieldType::UINT16;
    if (s == "uint32") return FieldType::UINT32;
    if (s == "uint64") return FieldType::UINT64;
    if (s == "int8") return FieldType::INT8;
    if (s == "int16") return FieldType::INT16;
    if (s == "int32") return FieldType::INT32;
    if (s == "int64") return FieldType::INT64;
    if (s == "string") return FieldType::STRING;
    if (s == "ipv4") return FieldType::IPV4;
    if (s == "ipv6") return FieldType::IPV6;
    if (s == "mac") return FieldType::MAC;
    if (s == "variable") return FieldType::VARIABLE;
    if (s == "bytes") return FieldType::BYTES;
    return FieldType::UNKNOWN;
}

std::string byte_order_to_string(ByteOrder order) {
    switch (order) {
        case ByteOrder::BIG_ENDIAN: return "big_endian";
        case ByteOrder::LITTLE_ENDIAN: return "little_endian";
        default: return "unknown";
    }
}

ByteOrder string_to_byte_order(const std::string& s) {
    if (s == "big_endian" || s == "be" || s == "network") return ByteOrder::BIG_ENDIAN;
    if (s == "little_endian" || s == "le" || s == "host") return ByteOrder::LITTLE_ENDIAN;
    return ByteOrder::BIG_ENDIAN;
}

std::string heuristic_rule_type_to_string(HeuristicRuleType type) {
    switch (type) {
        case HeuristicRuleType::FIXED_BYTES: return "fixed_bytes";
        case HeuristicRuleType::PORT_RANGE: return "port_range";
        case HeuristicRuleType::ENTROPY_RANGE: return "entropy_range";
        case HeuristicRuleType::FIELD_VALUE: return "field_value";
        case HeuristicRuleType::PROTOCOL_PATTERN: return "protocol_pattern";
        default: return "unknown";
    }
}

HeuristicRuleType string_to_heuristic_rule_type(const std::string& s) {
    if (s == "fixed_bytes") return HeuristicRuleType::FIXED_BYTES;
    if (s == "port_range") return HeuristicRuleType::PORT_RANGE;
    if (s == "entropy_range") return HeuristicRuleType::ENTROPY_RANGE;
    if (s == "field_value") return HeuristicRuleType::FIELD_VALUE;
    if (s == "protocol_pattern") return HeuristicRuleType::PROTOCOL_PATTERN;
    return HeuristicRuleType::FIXED_BYTES;
}

std::string anomaly_type_to_string(AnomalyType type) {
    switch (type) {
        case AnomalyType::UNEXPECTED_FIELD_VALUE: return "unexpected_field_value";
        case AnomalyType::HIGH_REASSEMBLY_TIMEOUT: return "high_reassembly_timeout";
        case AnomalyType::INCOMPLETE_HANDSHAKE: return "incomplete_handshake";
        case AnomalyType::INVALID_PACKET: return "invalid_packet";
        case AnomalyType::PROTOCOL_VIOLATION: return "protocol_violation";
        default: return "unknown";
    }
}

std::string FieldValue::to_string() const {
    std::ostringstream oss;
    switch (type) {
        case FieldType::UINT8:
        case FieldType::UINT16:
        case FieldType::UINT32:
            oss << uint_val;
            break;
        case FieldType::UINT64:
            oss << uint64_val;
            break;
        case FieldType::INT8:
        case FieldType::INT16:
        case FieldType::INT32:
            oss << int_val;
            break;
        case FieldType::INT64:
            oss << int64_val;
            break;
        case FieldType::STRING:
            oss << str_val;
            break;
        case FieldType::IPV4:
        case FieldType::IPV6:
            oss << str_val;
            break;
        case FieldType::MAC:
            oss << str_val;
            break;
        case FieldType::VARIABLE:
        case FieldType::BYTES:
            for (size_t i = 0; i < bytes_val.size(); ++i) {
                if (i > 0) oss << " ";
                oss << std::hex << static_cast<int>(bytes_val[i]) << std::dec;
            }
            break;
        default:
            oss << "unknown";
    }
    return oss.str();
}

uint64_t FieldValue::hash() const {
    std::hash<std::string> hasher;
    return hasher(to_string());
}

bool FieldValue::operator==(const FieldValue& other) const {
    if (type != other.type) return false;
    switch (type) {
        case FieldType::UINT8:
        case FieldType::UINT16:
        case FieldType::UINT32:
            return uint_val == other.uint_val;
        case FieldType::UINT64:
            return uint64_val == other.uint64_val;
        case FieldType::INT8:
        case FieldType::INT16:
        case FieldType::INT32:
            return int_val == other.int_val;
        case FieldType::INT64:
            return int64_val == other.int64_val;
        case FieldType::STRING:
        case FieldType::IPV4:
        case FieldType::IPV6:
        case FieldType::MAC:
            return str_val == other.str_val;
        case FieldType::VARIABLE:
        case FieldType::BYTES:
            return bytes_val == other.bytes_val;
        default:
            return false;
    }
}

}
