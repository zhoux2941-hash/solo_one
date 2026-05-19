#pragma once

#include "protocol.h"
#include <vector>
#include <cstdint>
#include <memory>

class GaloisField {
public:
    GaloisField();
    uint8_t add(uint8_t a, uint8_t b) const;
    uint8_t mul(uint8_t a, uint8_t b) const;
    uint8_t div(uint8_t a, uint8_t b) const;
    uint8_t exp(uint8_t a, int power) const;
    uint8_t inverse(uint8_t a) const;
    
private:
    std::vector<uint8_t> exp_table_;
    std::vector<uint8_t> log_table_;
};

class ReedSolomonEncoder {
public:
    ReedSolomonEncoder(size_t data_shards, size_t parity_shards);
    
    bool encode(const std::vector<std::vector<uint8_t>>& data,
                std::vector<std::vector<uint8_t>>& parity);
    
    size_t data_shards() const { return data_shards_; }
    size_t parity_shards() const { return parity_shards_; }
    
private:
    size_t data_shards_;
    size_t parity_shards_;
    size_t total_shards_;
    GaloisField gf_;
    std::vector<std::vector<uint8_t>> matrix_;
    
    void build_vandermonde_matrix();
};

class ReedSolomonDecoder {
public:
    ReedSolomonDecoder(size_t data_shards, size_t parity_shards);
    
    bool decode(std::vector<std::vector<uint8_t>>& shards,
                const std::vector<bool>& present);
    
    size_t data_shards() const { return data_shards_; }
    size_t parity_shards() const { return parity_shards_; }
    
private:
    size_t data_shards_;
    size_t parity_shards_;
    size_t total_shards_;
    GaloisField gf_;
    
    std::vector<std::vector<uint8_t>> invert_matrix(
        const std::vector<std::vector<uint8_t>>& matrix, size_t size);
    
    void multiply_matrix(const std::vector<std::vector<uint8_t>>& matrix,
                         const std::vector<std::vector<uint8_t>>& input,
                         std::vector<std::vector<uint8_t>>& output,
                         size_t rows, size_t cols);
};

class FecEncoder {
public:
    FecEncoder();
    
    void add_packet(const Packet& packet);
    bool ready_to_encode() const;
    bool encode(std::vector<Packet>& redundant_packets,
                uint32_t conn_id, uint32_t stream_id);
    
    void reset();
    size_t buffered_count() const { return buffer_.size(); }
    
private:
    static constexpr size_t DATA_SHARDS = FEC_DATA_PACKETS;
    static constexpr size_t PARITY_SHARDS = FEC_REDUNDANT_PACKETS;
    
    ReedSolomonEncoder rs_encoder_;
    std::vector<Packet> buffer_;
    std::vector<std::vector<uint8_t>> data_shards_;
    uint64_t fec_group_id_;
};

class FecDecoder {
public:
    FecDecoder();
    
    void add_data_packet(const Packet& packet, uint64_t group_id, size_t index);
    void add_redundant_packet(const Packet& packet, uint64_t group_id, size_t index);
    
    bool try_recover(uint64_t group_id, std::vector<Packet>& recovered);
    bool is_group_complete(uint64_t group_id) const;
    
    void remove_group(uint64_t group_id);
    void reset();
    
private:
    static constexpr size_t DATA_SHARDS = FEC_DATA_PACKETS;
    static constexpr size_t PARITY_SHARDS = FEC_REDUNDANT_PACKETS;
    
    ReedSolomonDecoder rs_decoder_;
    
    struct FecGroup {
        uint64_t group_id;
        std::vector<std::vector<uint8_t>> shards;
        std::vector<bool> present;
        std::vector<uint64_t> sequence_numbers;
        size_t data_count;
        size_t parity_count;
    };
    
    std::map<uint64_t, FecGroup> groups_;
};
