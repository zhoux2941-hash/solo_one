#include "protocol.h"
#include <random>
#include <chrono>
#include <algorithm>

#ifdef _WIN32
#include <winsock2.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <arpa/inet.h>
#endif

inline uint64_t htobe64(uint64_t value) {
    static const int num = 42;
    if (*reinterpret_cast<const char*>(&num) == num) {
        uint8_t* bytes = reinterpret_cast<uint8_t*>(&value);
        std::reverse(bytes, bytes + 8);
    }
    return value;
}

inline uint64_t be64toh(uint64_t value) {
    return htobe64(value);
}

Packet::Packet() {
    std::memset(&header, 0, sizeof(header));
    header.magic = MAGIC;
    header.version = VERSION;
    header.timestamp = get_timestamp_ms();
}

Packet::Packet(PacketType type, uint32_t conn_id, uint32_t stream_id, uint64_t seq) {
    std::memset(&header, 0, sizeof(header));
    header.magic = MAGIC;
    header.version = VERSION;
    header.type = type;
    header.connection_id = conn_id;
    header.stream_id = stream_id;
    header.sequence_number = seq;
    header.timestamp = get_timestamp_ms();
}

size_t Packet::serialize(uint8_t* buffer, size_t buffer_size) const {
    if (buffer_size < sizeof(PacketHeader) + payload.size()) {
        return 0;
    }
    
    PacketHeader net_header = header;
    net_header.magic = htonl(header.magic);
    net_header.version = htons(header.version);
    net_header.connection_id = htonl(header.connection_id);
    net_header.stream_id = htonl(header.stream_id);
    net_header.sequence_number = htobe64(header.sequence_number);
    net_header.timestamp = htobe64(header.timestamp);
    net_header.payload_length = htons(static_cast<uint16_t>(payload.size()));
    net_header.checksum = 0;
    
    std::memcpy(buffer, &net_header, sizeof(PacketHeader));
    if (!payload.empty()) {
        std::memcpy(buffer + sizeof(PacketHeader), payload.data(), payload.size());
    }
    
    uint32_t checksum = calculate_checksum();
    *reinterpret_cast<uint32_t*>(buffer + offsetof(PacketHeader, checksum)) = htonl(checksum);
    
    return sizeof(PacketHeader) + payload.size();
}

bool Packet::deserialize(const uint8_t* buffer, size_t buffer_size) {
    if (buffer_size < sizeof(PacketHeader)) {
        return false;
    }
    
    std::memcpy(&header, buffer, sizeof(PacketHeader));
    header.magic = ntohl(header.magic);
    header.version = ntohs(header.version);
    header.connection_id = ntohl(header.connection_id);
    header.stream_id = ntohl(header.stream_id);
    header.sequence_number = be64toh(header.sequence_number);
    header.timestamp = be64toh(header.timestamp);
    header.payload_length = ntohs(header.payload_length);
    header.checksum = ntohl(header.checksum);
    
    if (header.magic != MAGIC) {
        return false;
    }
    
    if (buffer_size < sizeof(PacketHeader) + header.payload_length) {
        return false;
    }
    
    if (header.payload_length > 0) {
        payload.resize(header.payload_length);
        std::memcpy(payload.data(), buffer + sizeof(PacketHeader), header.payload_length);
    }
    
    return verify_checksum();
}

uint32_t Packet::calculate_checksum() const {
    uint32_t checksum = 0;
    const uint8_t* ptr = reinterpret_cast<const uint8_t*>(&header);
    for (size_t i = 0; i < offsetof(PacketHeader, checksum); ++i) {
        checksum += ptr[i];
    }
    for (uint8_t byte : payload) {
        checksum += byte;
    }
    return checksum;
}

bool Packet::verify_checksum() const {
    uint32_t stored_checksum = header.checksum;
    const_cast<PacketHeader&>(header).checksum = 0;
    uint32_t calculated = calculate_checksum();
    const_cast<PacketHeader&>(header).checksum = stored_checksum;
    return calculated == stored_checksum;
}

uint32_t generate_connection_id() {
    static std::random_device rd;
    static std::mt19937 gen(rd());
    static std::uniform_int_distribution<uint32_t> dist;
    return dist(gen);
}

uint64_t get_timestamp_ms() {
    return std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::steady_clock::now().time_since_epoch()
    ).count();
}
