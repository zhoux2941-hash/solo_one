#pragma once

#include <string>
#include <vector>
#include <fstream>
#include <sstream>
#include <unordered_map>
#include "common/types.h"

namespace wps {

class JsonProtocolLoader {
public:
    JsonProtocolLoader() = default;

    ProtocolDescriptor load_from_file(const std::string& filename) {
        std::ifstream file(filename);
        if (!file.is_open()) {
            throw std::runtime_error("Failed to open protocol description file: " + filename);
        }

        std::stringstream buffer;
        buffer << file.rdbuf();
        std::string content = buffer.str();
        
        return parse(content);
    }

    ProtocolDescriptor parse(const std::string& json_content) {
        ProtocolDescriptor descriptor;
        size_t pos = 0;
        
        skip_whitespace(json_content, pos);
        expect_char(json_content, pos, '{');
        
        while (pos < json_content.size()) {
            skip_whitespace(json_content, pos);
            if (peek_char(json_content, pos) == '}') {
                pos++;
                break;
            }
            
            std::string key = parse_string(json_content, pos);
            skip_whitespace(json_content, pos);
            expect_char(json_content, pos, ':');
            skip_whitespace(json_content, pos);
            
            if (key == "name") {
                descriptor.name = parse_string(json_content, pos);
            } else if (key == "display_name") {
                descriptor.display_name = parse_string(json_content, pos);
            } else if (key == "short_name") {
                descriptor.short_name = parse_string(json_content, pos);
            } else if (key == "default_port") {
                descriptor.default_port = static_cast<uint16_t>(parse_number(json_content, pos));
                descriptor.default_port_tcp = descriptor.default_port;
                descriptor.default_port_udp = descriptor.default_port;
            } else if (key == "default_port_tcp") {
                descriptor.default_port_tcp = static_cast<uint16_t>(parse_number(json_content, pos));
            } else if (key == "default_port_udp") {
                descriptor.default_port_udp = static_cast<uint16_t>(parse_number(json_content, pos));
            } else if (key == "requires_reassembly") {
                descriptor.requires_reassembly = parse_bool(json_content, pos);
            } else if (key == "reassembly_timeout_ms") {
                descriptor.reassembly_timeout_ms = static_cast<uint32_t>(parse_number(json_content, pos));
            } else if (key == "handshake_fields") {
                descriptor.handshake_fields = parse_string_array(json_content, pos);
            } else if (key == "fields") {
                descriptor.fields = parse_fields(json_content, pos);
            } else {
                skip_value(json_content, pos);
            }
            
            skip_whitespace(json_content, pos);
            if (peek_char(json_content, pos) == ',') {
                pos++;
            }
        }
        
        return descriptor;
    }

    std::vector<HeuristicRule> load_heuristic_rules_from_file(const std::string& filename) {
        std::ifstream file(filename);
        if (!file.is_open()) {
            throw std::runtime_error("Failed to open heuristic rules file: " + filename);
        }

        std::stringstream buffer;
        buffer << file.rdbuf();
        std::string content = buffer.str();
        
        return parse_heuristic_rules(content);
    }

    std::vector<HeuristicRule> parse_heuristic_rules(const std::string& json_content) {
        std::vector<HeuristicRule> rules;
        size_t pos = 0;
        
        skip_whitespace(json_content, pos);
        expect_char(json_content, pos, '[');
        
        while (pos < json_content.size()) {
            skip_whitespace(json_content, pos);
            if (peek_char(json_content, pos) == ']') {
                pos++;
                break;
            }
            
            rules.push_back(parse_heuristic_rule(json_content, pos));
            
            skip_whitespace(json_content, pos);
            if (peek_char(json_content, pos) == ',') {
                pos++;
            }
        }
        
        return rules;
    }

private:
    char peek_char(const std::string& s, size_t pos) {
        if (pos >= s.size()) return '\0';
        return s[pos];
    }

    void expect_char(const std::string& s, size_t& pos, char c) {
        if (pos >= s.size() || s[pos] != c) {
            throw std::runtime_error("Expected '" + std::string(1, c) + 
                                    "' at position " + std::to_string(pos));
        }
        pos++;
    }

    void skip_whitespace(const std::string& s, size_t& pos) {
        while (pos < s.size() && std::isspace(static_cast<unsigned char>(s[pos]))) {
            pos++;
        }
    }

    std::string parse_string(const std::string& s, size_t& pos) {
        expect_char(s, pos, '"');
        std::string result;
        while (pos < s.size() && s[pos] != '"') {
            if (s[pos] == '\\' && pos + 1 < s.size()) {
                pos++;
                switch (s[pos]) {
                    case 'n': result += '\n'; break;
                    case 't': result += '\t'; break;
                    case 'r': result += '\r'; break;
                    case '"': result += '"'; break;
                    case '\\': result += '\\'; break;
                    default: result += s[pos];
                }
            } else {
                result += s[pos];
            }
            pos++;
        }
        expect_char(s, pos, '"');
        return result;
    }

    uint64_t parse_number(const std::string& s, size_t& pos) {
        skip_whitespace(s, pos);
        uint64_t result = 0;
        while (pos < s.size() && std::isdigit(static_cast<unsigned char>(s[pos]))) {
            result = result * 10 + (s[pos] - '0');
            pos++;
        }
        return result;
    }

    bool parse_bool(const std::string& s, size_t& pos) {
        skip_whitespace(s, pos);
        if (s.compare(pos, 4, "true") == 0) {
            pos += 4;
            return true;
        } else if (s.compare(pos, 5, "false") == 0) {
            pos += 5;
            return false;
        }
        throw std::runtime_error("Expected boolean at position " + std::to_string(pos));
    }

    std::vector<std::string> parse_string_array(const std::string& s, size_t& pos) {
        std::vector<std::string> result;
        expect_char(s, pos, '[');
        
        while (pos < s.size()) {
            skip_whitespace(s, pos);
            if (peek_char(s, pos) == ']') {
                pos++;
                break;
            }
            
            result.push_back(parse_string(s, pos));
            
            skip_whitespace(s, pos);
            if (peek_char(s, pos) == ',') {
                pos++;
            }
        }
        
        return result;
    }

    std::vector<uint8_t> parse_byte_array(const std::string& s, size_t& pos) {
        std::vector<uint8_t> result;
        expect_char(s, pos, '[');
        
        while (pos < s.size()) {
            skip_whitespace(s, pos);
            if (peek_char(s, pos) == ']') {
                pos++;
                break;
            }
            
            result.push_back(static_cast<uint8_t>(parse_number(s, pos)));
            
            skip_whitespace(s, pos);
            if (peek_char(s, pos) == ',') {
                pos++;
            }
        }
        
        return result;
    }

    std::vector<uint64_t> parse_number_array(const std::string& s, size_t& pos) {
        std::vector<uint64_t> result;
        expect_char(s, pos, '[');
        
        while (pos < s.size()) {
            skip_whitespace(s, pos);
            if (peek_char(s, pos) == ']') {
                pos++;
                break;
            }
            
            result.push_back(parse_number(s, pos));
            
            skip_whitespace(s, pos);
            if (peek_char(s, pos) == ',') {
                pos++;
            }
        }
        
        return result;
    }

    FieldType parse_field_type(const std::string& type_str) {
        static const std::unordered_map<std::string, FieldType> type_map = {
            {"uint8", FieldType::UINT8},
            {"uint16", FieldType::UINT16},
            {"uint32", FieldType::UINT32},
            {"uint64", FieldType::UINT64},
            {"int8", FieldType::INT8},
            {"int16", FieldType::INT16},
            {"int32", FieldType::INT32},
            {"int64", FieldType::INT64},
            {"string", FieldType::STRING},
            {"ipv4", FieldType::IPV4},
            {"ipv6", FieldType::IPV6},
            {"mac", FieldType::MAC},
            {"bytes", FieldType::BYTES},
            {"variable", FieldType::VARIABLE}
        };
        
        auto it = type_map.find(type_str);
        if (it == type_map.end()) {
            throw std::runtime_error("Unknown field type: " + type_str);
        }
        return it->second;
    }

    ByteOrder parse_byte_order(const std::string& order_str) {
        if (order_str == "big_endian" || order_str == "network" || order_str == "be") {
            return ByteOrder::BIG_ENDIAN;
        } else if (order_str == "little_endian" || order_str == "le") {
            return ByteOrder::LITTLE_ENDIAN;
        }
        return ByteOrder::BIG_ENDIAN;
    }

    std::vector<FieldDescriptor> parse_fields(const std::string& s, size_t& pos) {
        std::vector<FieldDescriptor> fields;
        expect_char(s, pos, '[');
        
        while (pos < s.size()) {
            skip_whitespace(s, pos);
            if (peek_char(s, pos) == ']') {
                pos++;
                break;
            }
            
            fields.push_back(parse_field(s, pos));
            
            skip_whitespace(s, pos);
            if (peek_char(s, pos) == ',') {
                pos++;
            }
        }
        
        return fields;
    }

    FieldDescriptor parse_field(const std::string& s, size_t& pos) {
        FieldDescriptor field;
        field.offset = static_cast<uint32_t>(-1);
        field.length = 0;
        field.byte_order = ByteOrder::BIG_ENDIAN;
        field.is_variable_length = false;
        
        expect_char(s, pos, '{');
        
        while (pos < s.size()) {
            skip_whitespace(s, pos);
            if (peek_char(s, pos) == '}') {
                pos++;
                break;
            }
            
            std::string key = parse_string(s, pos);
            skip_whitespace(s, pos);
            expect_char(s, pos, ':');
            skip_whitespace(s, pos);
            
            if (key == "name") {
                field.name = parse_string(s, pos);
            } else if (key == "display_name") {
                field.display_name = parse_string(s, pos);
            } else if (key == "type") {
                field.type = parse_field_type(parse_string(s, pos));
            } else if (key == "byte_order") {
                field.byte_order = parse_byte_order(parse_string(s, pos));
            } else if (key == "offset") {
                field.offset = static_cast<uint32_t>(parse_number(s, pos));
            } else if (key == "length") {
                field.length = static_cast<uint32_t>(parse_number(s, pos));
            } else if (key == "description") {
                field.description = parse_string(s, pos);
            } else if (key == "filter_name") {
                field.filter_name = parse_string(s, pos);
            } else if (key == "is_variable_length") {
                field.is_variable_length = parse_bool(s, pos);
            } else if (key == "length_field") {
                field.length_field = parse_string(s, pos);
            } else if (key == "fixed_value") {
                field.fixed_value = parse_byte_array(s, pos);
            } else if (key == "depends_on_field") {
                field.depends_on_field = parse_string(s, pos);
            } else if (key == "depends_on_condition") {
                field.depends_on_condition = parse_string(s, pos);
            } else if (key == "valid_values") {
                field.valid_values = parse_number_array(s, pos);
            } else {
                skip_value(s, pos);
            }
            
            skip_whitespace(s, pos);
            if (peek_char(s, pos) == ',') {
                pos++;
            }
        }
        
        if (field.filter_name.empty()) {
            field.filter_name = field.name;
        }
        if (field.display_name.empty()) {
            field.display_name = field.name;
        }
        
        return field;
    }

    HeuristicRule parse_heuristic_rule(const std::string& s, size_t& pos) {
        HeuristicRule rule;
        rule.offset = 0;
        rule.weight = 1.0;
        rule.use_tcp = true;
        rule.use_udp = true;
        
        expect_char(s, pos, '{');
        
        while (pos < s.size()) {
            skip_whitespace(s, pos);
            if (peek_char(s, pos) == '}') {
                pos++;
                break;
            }
            
            std::string key = parse_string(s, pos);
            skip_whitespace(s, pos);
            expect_char(s, pos, ':');
            skip_whitespace(s, pos);
            
            if (key == "type") {
                std::string type_str = parse_string(s, pos);
                if (type_str == "fixed_bytes") {
                    rule.type = HeuristicRule::RuleType::FIXED_BYTES;
                } else if (type_str == "port_range") {
                    rule.type = HeuristicRule::RuleType::PORT_RANGE;
                } else if (type_str == "entropy_range") {
                    rule.type = HeuristicRule::RuleType::ENTROPY_RANGE;
                } else if (type_str == "field_value") {
                    rule.type = HeuristicRule::RuleType::FIELD_VALUE;
                } else if (type_str == "protocol_pattern") {
                    rule.type = HeuristicRule::RuleType::PROTOCOL_PATTERN;
                }
            } else if (key == "name") {
                rule.name = parse_string(s, pos);
            } else if (key == "offset") {
                rule.offset = static_cast<uint32_t>(parse_number(s, pos));
            } else if (key == "expected_bytes") {
                rule.expected_bytes = parse_byte_array(s, pos);
            } else if (key == "mask") {
                rule.mask = parse_byte_array(s, pos);
            } else if (key == "port_min") {
                rule.port_min = static_cast<uint16_t>(parse_number(s, pos));
            } else if (key == "port_max") {
                rule.port_max = static_cast<uint16_t>(parse_number(s, pos));
            } else if (key == "entropy_min") {
                rule.entropy_min = parse_double(s, pos);
            } else if (key == "entropy_max") {
                rule.entropy_max = parse_double(s, pos);
            } else if (key == "weight") {
                rule.weight = parse_double(s, pos);
            } else if (key == "use_tcp") {
                rule.use_tcp = parse_bool(s, pos);
            } else if (key == "use_udp") {
                rule.use_udp = parse_bool(s, pos);
            } else {
                skip_value(s, pos);
            }
            
            skip_whitespace(s, pos);
            if (peek_char(s, pos) == ',') {
                pos++;
            }
        }
        
        return rule;
    }

    double parse_double(const std::string& s, size_t& pos) {
        skip_whitespace(s, pos);
        size_t start = pos;
        while (pos < s.size() && (std::isdigit(static_cast<unsigned char>(s[pos])) || 
                                  s[pos] == '.' || s[pos] == '-' || s[pos] == '+')) {
            pos++;
        }
        return std::stod(s.substr(start, pos - start));
    }

    void skip_value(const std::string& s, size_t& pos) {
        skip_whitespace(s, pos);
        if (pos >= s.size()) return;
        
        char c = s[pos];
        if (c == '"') {
            parse_string(s, pos);
        } else if (c == '{') {
            skip_object(s, pos);
        } else if (c == '[') {
            skip_array(s, pos);
        } else if (c == 't' || c == 'f') {
            parse_bool(s, pos);
        } else if (c == 'n') {
            pos += 4;
        } else if (std::isdigit(static_cast<unsigned char>(c)) || c == '-') {
            parse_number(s, pos);
        }
    }

    void skip_object(const std::string& s, size_t& pos) {
        expect_char(s, pos, '{');
        int depth = 1;
        while (pos < s.size() && depth > 0) {
            if (s[pos] == '{') depth++;
            else if (s[pos] == '}') depth--;
            else if (s[pos] == '"') {
                pos++;
                while (pos < s.size() && s[pos] != '"') {
                    if (s[pos] == '\\') pos++;
                    pos++;
                }
            }
            pos++;
        }
    }

    void skip_array(const std::string& s, size_t& pos) {
        expect_char(s, pos, '[');
        int depth = 1;
        while (pos < s.size() && depth > 0) {
            if (s[pos] == '[') depth++;
            else if (s[pos] == ']') depth--;
            else if (s[pos] == '"') {
                pos++;
                while (pos < s.size() && s[pos] != '"') {
                    if (s[pos] == '\\') pos++;
                    pos++;
                }
            }
            pos++;
        }
    }
};

}
