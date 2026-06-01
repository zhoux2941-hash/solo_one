#pragma once

#include <vector>
#include <cstdint>
#include <cstring>
#include <stdexcept>
#include <string>
#include <arpa/inet.h>
#include "common/types.h"

namespace wps {

class Buffer {
public:
    Buffer() : data_(), offset_(0) {}
    
    explicit Buffer(const std::vector<uint8_t>& data) : data_(data), offset_(0) {}
    
    Buffer(const uint8_t* data, size_t length) : data_(data, data + length), offset_(0) {}

    void set_data(const std::vector<uint8_t>& data) {
        data_ = data;
        offset_ = 0;
    }

    size_t size() const { return data_.size(); }
    size_t remaining() const { return data_.size() - offset_; }
    size_t current_offset() const { return offset_; }
    
    void seek(size_t offset) {
        if (offset > data_.size()) {
            throw std::out_of_range("Buffer seek out of range");
        }
        offset_ = offset;
    }

    void skip(size_t bytes) {
        if (offset_ + bytes > data_.size()) {
            throw std::out_of_range("Buffer skip out of range");
        }
        offset_ += bytes;
    }

    const uint8_t* peek() const {
        if (offset_ >= data_.size()) {
            throw std::out_of_range("Buffer peek out of range");
        }
        return &data_[offset_];
    }

    const uint8_t* peek_at(size_t offset) const {
        if (offset >= data_.size()) {
            throw std::out_of_range("Buffer peek_at out of range");
        }
        return &data_[offset];
    }

    uint8_t read_u8() {
        check_remaining(1);
        return data_[offset_++];
    }

    uint16_t read_u16(ByteOrder order = ByteOrder::BIG_ENDIAN) {
        check_remaining(2);
        uint16_t value;
        std::memcpy(&value, &data_[offset_], 2);
        offset_ += 2;
        if (order == ByteOrder::BIG_ENDIAN) {
            return ntohs(value);
        }
        return value;
    }

    uint32_t read_u32(ByteOrder order = ByteOrder::BIG_ENDIAN) {
        check_remaining(4);
        uint32_t value;
        std::memcpy(&value, &data_[offset_], 4);
        offset_ += 4;
        if (order == ByteOrder::BIG_ENDIAN) {
            return ntohl(value);
        }
        return value;
    }

    uint64_t read_u64(ByteOrder order = ByteOrder::BIG_ENDIAN) {
        check_remaining(8);
        uint64_t value;
        std::memcpy(&value, &data_[offset_], 8);
        offset_ += 8;
        if (order == ByteOrder::BIG_ENDIAN) {
            return be64toh(value);
        }
        return value;
    }

    int8_t read_i8() {
        return static_cast<int8_t>(read_u8());
    }

    int16_t read_i16(ByteOrder order = ByteOrder::BIG_ENDIAN) {
        return static_cast<int16_t>(read_u16(order));
    }

    int32_t read_i32(ByteOrder order = ByteOrder::BIG_ENDIAN) {
        return static_cast<int32_t>(read_u32(order));
    }

    int64_t read_i64(ByteOrder order = ByteOrder::BIG_ENDIAN) {
        return static_cast<int64_t>(read_u64(order));
    }

    std::vector<uint8_t> read_bytes(size_t length) {
        check_remaining(length);
        std::vector<uint8_t> result(&data_[offset_], &data_[offset_ + length]);
        offset_ += length;
        return result;
    }

    std::string read_string(size_t length) {
        check_remaining(length);
        std::string result(reinterpret_cast<const char*>(&data_[offset_]), length);
        offset_ += length;
        return result;
    }

    std::string read_cstring() {
        size_t start = offset_;
        while (offset_ < data_.size() && data_[offset_] != '\0') {
            offset_++;
        }
        if (offset_ >= data_.size()) {
            throw std::out_of_range("Null-terminated string not found");
        }
        std::string result(reinterpret_cast<const char*>(&data_[start]), offset_ - start);
        offset_++;
        return result;
    }

    std::string read_ipv4() {
        check_remaining(4);
        char buf[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, &data_[offset_], buf, INET_ADDRSTRLEN);
        offset_ += 4;
        return std::string(buf);
    }

    std::string read_ipv6() {
        check_remaining(16);
        char buf[INET6_ADDRSTRLEN];
        inet_ntop(AF_INET6, &data_[offset_], buf, INET6_ADDRSTRLEN);
        offset_ += 16;
        return std::string(buf);
    }

    std::string read_mac() {
        check_remaining(6);
        char buf[18];
        std::snprintf(buf, sizeof(buf), "%02x:%02x:%02x:%02x:%02x:%02x",
            data_[offset_], data_[offset_ + 1], data_[offset_ + 2],
            data_[offset_ + 3], data_[offset_ + 4], data_[offset_ + 5]);
        offset_ += 6;
        return std::string(buf);
    }

    uint8_t get_u8(size_t offset) const {
        if (offset + 1 > data_.size()) {
            throw std::out_of_range("Buffer get_u8 out of range");
        }
        return data_[offset];
    }

    uint16_t get_u16(size_t offset, ByteOrder order = ByteOrder::BIG_ENDIAN) const {
        if (offset + 2 > data_.size()) {
            throw std::out_of_range("Buffer get_u16 out of range");
        }
        uint16_t value;
        std::memcpy(&value, &data_[offset], 2);
        if (order == ByteOrder::BIG_ENDIAN) {
            return ntohs(value);
        }
        return value;
    }

    uint32_t get_u32(size_t offset, ByteOrder order = ByteOrder::BIG_ENDIAN) const {
        if (offset + 4 > data_.size()) {
            throw std::out_of_range("Buffer get_u32 out of range");
        }
        uint32_t value;
        std::memcpy(&value, &data_[offset], 4);
        if (order == ByteOrder::BIG_ENDIAN) {
            return ntohl(value);
        }
        return value;
    }

    uint64_t get_u64(size_t offset, ByteOrder order = ByteOrder::BIG_ENDIAN) const {
        if (offset + 8 > data_.size()) {
            throw std::out_of_range("Buffer get_u64 out of range");
        }
        uint64_t value;
        std::memcpy(&value, &data_[offset], 8);
        if (order == ByteOrder::BIG_ENDIAN) {
            return be64toh(value);
        }
        return value;
    }

    std::vector<uint8_t> get_bytes(size_t offset, size_t length) const {
        if (offset + length > data_.size()) {
            throw std::out_of_range("Buffer get_bytes out of range");
        }
        return std::vector<uint8_t>(&data_[offset], &data_[offset + length]);
    }

    std::string get_string(size_t offset, size_t length) const {
        if (offset + length > data_.size()) {
            throw std::out_of_range("Buffer get_string out of range");
        }
        return std::string(reinterpret_cast<const char*>(&data_[offset]), length);
    }

    double calculate_entropy(size_t offset, size_t length) const {
        if (offset + length > data_.size()) {
            throw std::out_of_range("Buffer calculate_entropy out of range");
        }
        if (length == 0) return 0.0;

        uint64_t counts[256] = {0};
        for (size_t i = 0; i < length; i++) {
            counts[data_[offset + i]]++;
        }

        double entropy = 0.0;
        double inv_length = 1.0 / length;
        for (int i = 0; i < 256; i++) {
            if (counts[i] > 0) {
                double p = counts[i] * inv_length;
                entropy -= p * std::log2(p);
            }
        }
        return entropy;
    }

    bool compare_bytes(size_t offset, const std::vector<uint8_t>& expected, 
                       const std::vector<uint8_t>& mask = {}) const {
        if (offset + expected.size() > data_.size()) {
            return false;
        }
        for (size_t i = 0; i < expected.size(); i++) {
            uint8_t actual = data_[offset + i];
            uint8_t exp = expected[i];
            if (!mask.empty()) {
                actual &= mask[i];
                exp &= mask[i];
            }
            if (actual != exp) {
                return false;
            }
        }
        return true;
    }

private:
    std::vector<uint8_t> data_;
    size_t offset_;

    void check_remaining(size_t bytes) const {
        if (offset_ + bytes > data_.size()) {
            throw std::out_of_range("Buffer read out of range");
        }
    }

    uint64_t be64toh(uint64_t value) const {
#if __BYTE_ORDER__ == __ORDER_LITTLE_ENDIAN__
        return ((uint64_t)ntohl((uint32_t)value) << 32) | ntohl((uint32_t)(value >> 32));
#else
        return value;
#endif
    }
};

}
