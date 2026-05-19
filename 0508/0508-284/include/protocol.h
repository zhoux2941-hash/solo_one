#pragma once

#include <cstdint>
#include <cstring>
#include <vector>
#include <string>
#include <chrono>
#include <map>
#include <set>
#include <queue>
#include <memory>
#include <functional>

constexpr uint32_t MAGIC = 0x52554450;
constexpr uint16_t VERSION = 0x0100;
constexpr size_t MAX_PAYLOAD_SIZE = 1400;
constexpr size_t FEC_DATA_PACKETS = 10;
constexpr size_t FEC_REDUNDANT_PACKETS = 2;
constexpr size_t FEC_TOTAL_PACKETS = FEC_DATA_PACKETS + FEC_REDUNDANT_PACKETS;

enum class PacketType : uint8_t {
    HANDSHAKE_SYN = 0x01,
    HANDSHAKE_SYN_ACK = 0x02,
    HANDSHAKE_ACK = 0x03,
    DATA = 0x04,
    ACK = 0x05,
    NACK = 0x06,
    FEC_DATA = 0x07,
    FEC_REDUNDANT = 0x08,
    FILE_INFO = 0x09,
    FIN = 0x0A,
    PATH_CHALLENGE = 0x0B,
    PATH_RESPONSE = 0x0C,
    NEW_CONNECTION_ID = 0x0D,
    RETIRE_CONNECTION_ID = 0x0E,
    ADDRESS_UPDATE = 0x0F
};

#pragma pack(push, 1)
struct PacketHeader {
    uint32_t magic;
    uint16_t version;
    PacketType type;
    uint8_t flags;
    uint32_t connection_id;
    uint32_t stream_id;
    uint64_t sequence_number;
    uint64_t timestamp;
    uint16_t payload_length;
    uint32_t checksum;
};

struct HandshakeSyn {
    uint32_t initial_sequence;
    uint32_t max_stream_count;
    uint32_t recv_window_size;
};

struct HandshakeSynAck {
    uint32_t initial_sequence;
    uint32_t peer_initial_sequence;
    uint32_t max_stream_count;
    uint32_t recv_window_size;
};

struct HandshakeAck {
    uint32_t peer_initial_sequence;
};

struct AckPacket {
    uint64_t ack_sequence;
    uint32_t ack_delay;
    uint8_t ack_block_count;
};

struct AckBlock {
    uint64_t gap;
    uint64_t length;
};

struct NackPacket {
    uint16_t missing_count;
};

struct FileInfoPacket {
    uint64_t file_size;
    uint64_t chunk_count;
    uint32_t filename_length;
};

struct PathChallenge {
    uint64_t challenge_data[2];
};

struct PathResponse {
    uint64_t response_data[2];
};

struct NewConnectionId {
    uint32_t new_connection_id;
    uint8_t retire_prior_to;
    uint8_t sequence_number;
};

struct RetireConnectionId {
    uint32_t connection_id;
};

struct AddressUpdate {
    uint8_t ip_type;
    uint8_t ip_bytes[16];
    uint16_t port;
};

constexpr uint8_t IPV4 = 4;
constexpr uint8_t IPV6 = 6;

#pragma pack(pop)

struct ConnectionIdInfo {
    uint32_t connection_id;
    uint8_t sequence_number;
    bool is_active;
    std::chrono::steady_clock::time_point created_time;
};

enum class PathStatus {
    UNKNOWN,
    PROBING,
    VALIDATED,
    FAILED
};

struct PathInfo {
    NetworkAddress address;
    PathStatus status;
    uint64_t challenge_data[2];
    std::chrono::steady_clock::time_point last_challenge_time;
    std::chrono::steady_clock::time_point last_active_time;
    uint64_t rtt_us;
    uint32_t challenge_attempts;
    bool is_preferred;
};

constexpr size_t MAX_ACTIVE_CIDS = 8;
constexpr size_t MAX_PATHS_PER_CONNECTION = 4;
constexpr uint64_t PATH_PROBE_TIMEOUT_US = 3000000;
constexpr uint64_t MAX_PATH_PROBE_ATTEMPTS = 3;

class Packet {
public:
    PacketHeader header;
    std::vector<uint8_t> payload;

    Packet();
    Packet(PacketType type, uint32_t conn_id, uint32_t stream_id, uint64_t seq);
    
    size_t serialize(uint8_t* buffer, size_t buffer_size) const;
    bool deserialize(const uint8_t* buffer, size_t buffer_size);
    uint32_t calculate_checksum() const;
    bool verify_checksum() const;
    uint64_t timestamp() const { return header.timestamp; }
};

using SequenceNumber = uint64_t;
using StreamId = uint32_t;
using ConnectionId = uint32_t;

struct RetransmissionInfo {
    Packet packet;
    std::chrono::steady_clock::time_point send_time;
    size_t retransmit_count;
    bool is_fec;
};

enum class ConnectionState {
    CLOSED,
    LISTENING,
    SYN_SENT,
    SYN_RECEIVED,
    ESTABLISHED,
    CLOSING
};

uint32_t generate_connection_id();
uint64_t get_timestamp_ms();
