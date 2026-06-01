#pragma once

#include <string>
#include <vector>
#include <memory>
#include <fstream>
#include <cstring>
#include <cstdint>
#include <stdexcept>
#include <thread>
#include <atomic>
#include <queue>
#include <condition_variable>
#include <functional>
#include "common/types.h"
#include "common/buffer.h"

namespace wps {

struct PcapFileHeader {
    uint32_t magic_number;
    uint16_t version_major;
    uint16_t version_minor;
    int32_t thiszone;
    uint32_t sigfigs;
    uint32_t snaplen;
    uint32_t network;
};

struct PcapPacketHeader {
    uint32_t ts_sec;
    uint32_t ts_usec;
    uint32_t incl_len;
    uint32_t orig_len;
};

struct EthernetHeader {
    uint8_t dst_mac[6];
    uint8_t src_mac[6];
    uint16_t ethertype;
};

struct IPv4Header {
    uint8_t version_ihl;
    uint8_t tos;
    uint16_t total_length;
    uint16_t identification;
    uint16_t flags_fragment;
    uint8_t ttl;
    uint8_t protocol;
    uint16_t checksum;
    uint32_t src_ip;
    uint32_t dst_ip;
};

struct TCPHeader {
    uint16_t src_port;
    uint16_t dst_port;
    uint32_t seq;
    uint32_t ack;
    uint8_t data_offset;
    uint8_t flags;
    uint16_t window;
    uint16_t checksum;
    uint16_t urgent_ptr;
};

struct UDPHeader {
    uint16_t src_port;
    uint16_t dst_port;
    uint16_t length;
    uint16_t checksum;
};

class PcapReader {
public:
    PcapReader() 
        : packet_count_(0), 
          is_open_(false), 
          byte_swap_needed_(false),
          current_packet_id_(0),
          stop_reading_(false),
          prefetch_active_(false) {}

    ~PcapReader() {
        stop_prefetch();
        close();
    }

    bool open(const std::string& filename) {
        file_.open(filename, std::ios::binary);
        if (!file_.is_open()) return false;

        PcapFileHeader header;
        file_.read(reinterpret_cast<char*>(&header), sizeof(header));
        if (!file_.good()) {
            file_.close();
            return false;
        }

        if (header.magic_number == 0xd4c3b2a1 || header.magic_number == 0xa1b2c3d4) {
            byte_swap_needed_ = (header.magic_number == 0xd4c3b2a1);
        } else {
            file_.close();
            return false;
        }

        is_open_ = true;
        packet_count_ = 0;
        current_packet_id_ = 0;
        filename_ = filename;
        return true;
    }

    void close() {
        stop_prefetch();
        if (file_.is_open()) {
            file_.close();
        }
        is_open_ = false;
    }

    bool is_open() const { return is_open_; }
    uint64_t packet_count() const { return packet_count_; }
    const std::string& filename() const { return filename_; }

    std::vector<PacketInfo> read_all() {
        std::vector<PacketInfo> packets;
        PacketInfo packet;
        while (read_next(packet)) {
            packets.push_back(packet);
        }
        return packets;
    }

    bool read_next(PacketInfo& packet) {
        if (!is_open_) return false;

        PcapPacketHeader pcap_header;
        if (!file_.read(reinterpret_cast<char*>(&pcap_header), sizeof(pcap_header))) {
            return false;
        }

        if (byte_swap_needed_) {
            pcap_header.ts_sec = swap32(pcap_header.ts_sec);
            pcap_header.ts_usec = swap32(pcap_header.ts_usec);
            pcap_header.incl_len = swap32(pcap_header.incl_len);
            pcap_header.orig_len = swap32(pcap_header.orig_len);
        }

        std::vector<uint8_t> raw_data(pcap_header.incl_len);
        if (!file_.read(reinterpret_cast<char*>(raw_data.data()), pcap_header.incl_len)) {
            return false;
        }

        parse_raw_packet(raw_data, pcap_header, packet);
        packet_count_++;
        return true;
    }

    void start_prefetch(size_t queue_size = 10000) {
        if (prefetch_active_) return;
        
        stop_reading_ = false;
        prefetch_active_ = true;
        max_queue_size_ = queue_size;
        
        prefetch_thread_ = std::thread([this]() {
            PacketInfo packet;
            while (!stop_reading_ && read_next(packet)) {
                std::unique_lock<std::mutex> lock(queue_mutex_);
                queue_cv_.wait(lock, [this]() { 
                    return packet_queue_.size() < max_queue_size_ || stop_reading_; 
                });
                
                if (stop_reading_) break;
                
                packet_queue_.push(packet);
                queue_cv_.notify_all();
            }
            
            std::lock_guard<std::mutex> lock(queue_mutex_);
            prefetch_active_ = false;
            queue_cv_.notify_all();
        });
    }

    void stop_prefetch() {
        stop_reading_ = true;
        queue_cv_.notify_all();
        
        if (prefetch_thread_.joinable()) {
            prefetch_thread_.join();
        }
        
        std::lock_guard<std::mutex> lock(queue_mutex_);
        while (!packet_queue_.empty()) {
            packet_queue_.pop();
        }
    }

    bool get_prefetched(PacketInfo& packet, int timeout_ms = 100) {
        std::unique_lock<std::mutex> lock(queue_mutex_);
        
        if (packet_queue_.empty()) {
            queue_cv_.wait_for(lock, std::chrono::milliseconds(timeout_ms));
        }
        
        if (!packet_queue_.empty()) {
            packet = packet_queue_.front();
            packet_queue_.pop();
            queue_cv_.notify_all();
            return true;
        }
        
        return false;
    }

    bool has_more_packets() const {
        std::lock_guard<std::mutex> lock(queue_mutex_);
        return !packet_queue_.empty() || prefetch_active_;
    }

    size_t queue_size() const {
        std::lock_guard<std::mutex> lock(queue_mutex_);
        return packet_queue_.size();
    }

    void process_batch(size_t batch_size, 
                       std::function<void(const std::vector<PacketInfo>&)> processor) {
        std::vector<PacketInfo> batch;
        batch.reserve(batch_size);
        
        PacketInfo packet;
        while (get_prefetched(packet, 50)) {
            batch.push_back(packet);
            if (batch.size() >= batch_size) {
                processor(batch);
                batch.clear();
            }
        }
        
        if (!batch.empty()) {
            processor(batch);
        }
    }

private:
    std::ifstream file_;
    std::string filename_;
    bool is_open_;
    bool byte_swap_needed_;
    uint64_t packet_count_;
    uint64_t current_packet_id_;

    std::thread prefetch_thread_;
    mutable std::mutex queue_mutex_;
    std::condition_variable queue_cv_;
    std::queue<PacketInfo> packet_queue_;
    std::atomic<bool> stop_reading_;
    std::atomic<bool> prefetch_active_;
    size_t max_queue_size_;

    void parse_raw_packet(const std::vector<uint8_t>& raw_data,
                         const PcapPacketHeader& pcap_header,
                         PacketInfo& packet) {
        packet.packet_id = current_packet_id_++;
        packet.timestamp = pcap_header.ts_sec + pcap_header.ts_usec / 1000000.0;
        packet.captured_length = pcap_header.incl_len;
        packet.original_length = pcap_header.orig_len;
        packet.is_fragmented = false;
        packet.is_retransmit = false;

        Buffer buffer(raw_data);

        if (raw_data.size() < sizeof(EthernetHeader)) {
            packet.data = raw_data;
            return;
        }

        EthernetHeader eth;
        std::memcpy(&eth, raw_data.data(), sizeof(EthernetHeader));
        buffer.skip(sizeof(EthernetHeader));

        uint16_t ethertype = ntohs(eth.ethertype);
        
        if (ethertype == 0x0800 && buffer.remaining() >= sizeof(IPv4Header)) {
            parse_ipv4(buffer, packet);
        } else if (ethertype == 0x86dd) {
            packet.data = std::vector<uint8_t>(raw_data.begin() + sizeof(EthernetHeader), 
                                              raw_data.end());
        } else if (ethertype == 0x8100 && buffer.remaining() >= 4) {
            buffer.skip(4);
            if (buffer.remaining() >= sizeof(IPv4Header)) {
                uint16_t inner_type = buffer.get_u16(buffer.current_offset() - 2);
                if (ntohs(inner_type) == 0x0800) {
                    parse_ipv4(buffer, packet);
                }
            }
        } else {
            packet.data = std::vector<uint8_t>(raw_data.begin() + sizeof(EthernetHeader), 
                                              raw_data.end());
        }

        packet.stream_id = packet.src_ip + ":" + std::to_string(packet.src_port) + 
                          "-" + packet.dst_ip + ":" + std::to_string(packet.dst_port);
    }

    void parse_ipv4(Buffer& buffer, PacketInfo& packet) {
        size_t ip_start = buffer.current_offset();
        uint8_t version_ihl = buffer.get_u8(ip_start);
        uint8_t ihl = (version_ihl & 0x0F) * 4;
        
        packet.protocol = buffer.get_u8(ip_start + 9);
        
        char src_ip[INET_ADDRSTRLEN];
        char dst_ip[INET_ADDRSTRLEN];
        uint32_t src_addr = buffer.get_u32(ip_start + 12, ByteOrder::BIG_ENDIAN);
        uint32_t dst_addr = buffer.get_u32(ip_start + 16, ByteOrder::BIG_ENDIAN);
        
        inet_ntop(AF_INET, &src_addr, src_ip, INET_ADDRSTRLEN);
        inet_ntop(AF_INET, &dst_addr, dst_ip, INET_ADDRSTRLEN);
        
        packet.src_ip = src_ip;
        packet.dst_ip = dst_ip;

        uint16_t flags_fragment = buffer.get_u16(ip_start + 6, ByteOrder::BIG_ENDIAN);
        uint16_t fragment_offset = flags_fragment & 0x1FFF;
        uint8_t flags = (flags_fragment >> 13) & 0x07;
        packet.is_fragmented = (fragment_offset != 0) || ((flags & 0x01) != 0);

        buffer.skip(ihl);

        if (packet.protocol == 6 && buffer.remaining() >= sizeof(TCPHeader)) {
            parse_tcp(buffer, packet);
        } else if (packet.protocol == 17 && buffer.remaining() >= sizeof(UDPHeader)) {
            parse_udp(buffer, packet);
        } else {
            if (buffer.remaining() > 0) {
                packet.data = buffer.read_bytes(buffer.remaining());
            }
        }
    }

    void parse_tcp(Buffer& buffer, PacketInfo& packet) {
        size_t tcp_start = buffer.current_offset();
        
        packet.src_port = buffer.get_u16(tcp_start, ByteOrder::BIG_ENDIAN);
        packet.dst_port = buffer.get_u16(tcp_start + 2, ByteOrder::BIG_ENDIAN);
        packet.seq = buffer.get_u32(tcp_start + 4, ByteOrder::BIG_ENDIAN);
        packet.ack = buffer.get_u32(tcp_start + 8, ByteOrder::BIG_ENDIAN);
        
        uint8_t data_offset = (buffer.get_u8(tcp_start + 12) >> 4) * 4;
        packet.flags = buffer.get_u8(tcp_start + 13);

        buffer.skip(data_offset);

        if (buffer.remaining() > 0) {
            packet.data = buffer.read_bytes(buffer.remaining());
        }
    }

    void parse_udp(Buffer& buffer, PacketInfo& packet) {
        size_t udp_start = buffer.current_offset();
        
        packet.src_port = buffer.get_u16(udp_start, ByteOrder::BIG_ENDIAN);
        packet.dst_port = buffer.get_u16(udp_start + 2, ByteOrder::BIG_ENDIAN);
        uint16_t length = buffer.get_u16(udp_start + 4, ByteOrder::BIG_ENDIAN);

        buffer.skip(sizeof(UDPHeader));

        size_t payload_length = length - sizeof(UDPHeader);
        if (payload_length > buffer.remaining()) {
            payload_length = buffer.remaining();
        }
        
        if (payload_length > 0) {
            packet.data = buffer.read_bytes(payload_length);
        }
    }

    uint32_t swap32(uint32_t val) const {
        return ((val & 0xFF) << 24) |
               ((val & 0xFF00) << 8) |
               ((val & 0xFF0000) >> 8) |
               ((val & 0xFF000000) >> 24);
    }
};

}
