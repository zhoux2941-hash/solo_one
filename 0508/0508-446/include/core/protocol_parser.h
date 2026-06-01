#pragma once

#include <vector>
#include <string>
#include <unordered_map>
#include <memory>
#include <mutex>
#include <regex>
#include "common/types.h"
#include "common/buffer.h"

namespace wps {

class ProtocolParser {
public:
    ProtocolParser() = default;
    explicit ProtocolParser(const ProtocolDescriptor& descriptor) 
        : descriptor_(descriptor) {}

    void set_descriptor(const ProtocolDescriptor& descriptor) {
        descriptor_ = descriptor;
    }

    const ProtocolDescriptor& get_descriptor() const {
        return descriptor_;
    }

    ParsedPacket parse_packet(const PacketInfo& packet, 
                              const std::vector<uint8_t>& reassembled_data = {}) {
        ParsedPacket result;
        result.info = packet;
        result.protocol_name = descriptor_.name;
        result.is_handshake = false;
        result.is_complete = true;

        const std::vector<uint8_t>* data_to_parse = &packet.data;
        std::vector<uint8_t> combined_data;
        
        if (descriptor_.requires_reassembly && !reassembled_data.empty()) {
            combined_data = reassembled_data;
            data_to_parse = &combined_data;
        }

        Buffer buffer(*data_to_parse);
        std::unordered_map<std::string, uint64_t> parsed_ints;
        std::unordered_map<std::string, std::string> parsed_strings;

        for (const auto& field : descriptor_.fields) {
            if (!field.depends_on_field.empty()) {
                if (!check_dependency(field, parsed_ints, parsed_strings)) {
                    continue;
                }
            }

            try {
                FieldValue fv;
                fv.field_name = field.name;
                fv.offset = field.offset == static_cast<uint32_t>(-1) ? 
                           buffer.current_offset() : field.offset;
                fv.is_valid = true;

                if (field.offset != static_cast<uint32_t>(-1)) {
                    buffer.seek(field.offset);
                }

                uint32_t actual_length = field.length;
                if (field.is_variable_length && !field.length_field.empty()) {
                    auto it = parsed_ints.find(field.length_field);
                    if (it != parsed_ints.end()) {
                        actual_length = static_cast<uint32_t>(it->second);
                    }
                }

                fv.length = actual_length;

                switch (field.type) {
                    case FieldType::UINT8:
                        fv.value = buffer.read_u8();
                        parsed_ints[field.name] = std::get<uint64_t>(fv.value);
                        break;
                    case FieldType::UINT16:
                        fv.value = static_cast<uint64_t>(buffer.read_u16(field.byte_order));
                        parsed_ints[field.name] = std::get<uint64_t>(fv.value);
                        break;
                    case FieldType::UINT32:
                        fv.value = static_cast<uint64_t>(buffer.read_u32(field.byte_order));
                        parsed_ints[field.name] = std::get<uint64_t>(fv.value);
                        break;
                    case FieldType::UINT64:
                        fv.value = buffer.read_u64(field.byte_order);
                        parsed_ints[field.name] = std::get<uint64_t>(fv.value);
                        break;
                    case FieldType::INT8:
                        fv.value = static_cast<int64_t>(buffer.read_i8());
                        break;
                    case FieldType::INT16:
                        fv.value = static_cast<int64_t>(buffer.read_i16(field.byte_order));
                        break;
                    case FieldType::INT32:
                        fv.value = static_cast<int64_t>(buffer.read_i32(field.byte_order));
                        break;
                    case FieldType::INT64:
                        fv.value = static_cast<int64_t>(buffer.read_i64(field.byte_order));
                        break;
                    case FieldType::STRING:
                        if (field.is_variable_length) {
                            fv.value = buffer.read_cstring();
                        } else {
                            fv.value = buffer.read_string(actual_length);
                        }
                        parsed_strings[field.name] = std::get<std::string>(fv.value);
                        break;
                    case FieldType::IPV4:
                        fv.value = buffer.read_ipv4();
                        parsed_strings[field.name] = std::get<std::string>(fv.value);
                        break;
                    case FieldType::IPV6:
                        fv.value = buffer.read_ipv6();
                        parsed_strings[field.name] = std::get<std::string>(fv.value);
                        break;
                    case FieldType::MAC:
                        fv.value = buffer.read_mac();
                        parsed_strings[field.name] = std::get<std::string>(fv.value);
                        break;
                    case FieldType::BYTES:
                    case FieldType::VARIABLE:
                        fv.value = buffer.read_bytes(actual_length);
                        break;
                }

                if (!field.valid_values.empty() && 
                    std::holds_alternative<uint64_t>(fv.value)) {
                    uint64_t val = std::get<uint64_t>(fv.value);
                    if (std::find(field.valid_values.begin(), 
                                  field.valid_values.end(), val) == field.valid_values.end()) {
                        fv.is_valid = false;
                        result.warnings.push_back(
                            "Field " + field.name + " has unexpected value: " + 
                            std::to_string(val));
                    }
                }

                if (!field.fixed_value.empty()) {
                    bool matches = true;
                    if (std::holds_alternative<uint64_t>(fv.value)) {
                        uint64_t val = std::get<uint64_t>(fv.value);
                        std::vector<uint8_t> bytes;
                        for (size_t i = 0; i < field.fixed_value.size(); i++) {
                            bytes.push_back((val >> (8 * (field.fixed_value.size() - 1 - i))) & 0xFF);
                        }
                        matches = (bytes == field.fixed_value);
                    } else if (std::holds_alternative<std::vector<uint8_t>>(fv.value)) {
                        matches = (std::get<std::vector<uint8_t>>(fv.value) == field.fixed_value);
                    }
                    if (!matches) {
                        fv.is_valid = false;
                        result.warnings.push_back(
                            "Field " + field.name + " does not match expected fixed value");
                    }
                }

                result.fields.push_back(fv);

                if (std::find(descriptor_.handshake_fields.begin(), 
                              descriptor_.handshake_fields.end(), 
                              field.name) != descriptor_.handshake_fields.end()) {
                    result.is_handshake = true;
                }

            } catch (const std::exception& e) {
                result.errors.push_back(
                    "Error parsing field " + field.name + ": " + e.what());
                result.is_complete = false;
                break;
            }
        }

        return result;
    }

    std::vector<ParsedPacket> parse_stream(const std::vector<PacketInfo>& packets,
                                           const std::vector<uint8_t>& reassembled_data) {
        std::vector<ParsedPacket> results;
        
        if (!reassembled_data.empty()) {
            PacketInfo fake_packet;
            fake_packet.packet_id = 0;
            fake_packet.timestamp = packets.empty() ? 0 : packets[0].timestamp;
            fake_packet.data = reassembled_data;
            if (!packets.empty()) {
                fake_packet.src_ip = packets[0].src_ip;
                fake_packet.dst_ip = packets[0].dst_ip;
                fake_packet.src_port = packets[0].src_port;
                fake_packet.dst_port = packets[0].dst_port;
            }
            
            auto parsed = parse_packet(fake_packet, reassembled_data);
            results.push_back(parsed);
        } else {
            for (const auto& packet : packets) {
                results.push_back(parse_packet(packet));
            }
        }
        
        return results;
    }

private:
    ProtocolDescriptor descriptor_;

    bool check_dependency(const FieldDescriptor& field,
                          const std::unordered_map<std::string, uint64_t>& parsed_ints,
                          const std::unordered_map<std::string, std::string>& parsed_strings) {
        if (field.depends_on_condition.empty()) return true;

        auto it_int = parsed_ints.find(field.depends_on_field);
        auto it_str = parsed_strings.find(field.depends_on_field);

        std::regex eq_regex(R"(==\s*(\d+))");
        std::regex neq_regex(R"(!=\s*(\d+))");
        std::regex gt_regex(R"(>\s*(\d+))");
        std::regex lt_regex(R"(<\s*(\d+))");
        std::regex ge_regex(R"(>=\s*(\d+))");
        std::regex le_regex(R"(<=\s*(\d+))");
        std::smatch match;

        if (it_int != parsed_ints.end()) {
            uint64_t val = it_int->second;
            if (std::regex_search(field.depends_on_condition, match, eq_regex)) {
                return val == std::stoull(match[1].str());
            }
            if (std::regex_search(field.depends_on_condition, match, neq_regex)) {
                return val != std::stoull(match[1].str());
            }
            if (std::regex_search(field.depends_on_condition, match, gt_regex)) {
                return val > std::stoull(match[1].str());
            }
            if (std::regex_search(field.depends_on_condition, match, lt_regex)) {
                return val < std::stoull(match[1].str());
            }
            if (std::regex_search(field.depends_on_condition, match, ge_regex)) {
                return val >= std::stoull(match[1].str());
            }
            if (std::regex_search(field.depends_on_condition, match, le_regex)) {
                return val <= std::stoull(match[1].str());
            }
        }

        return true;
    }
};

}
