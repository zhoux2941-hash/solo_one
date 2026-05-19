#include "fec.h"
#include <stdexcept>
#include <algorithm>
#include <cstring>
#include <iostream>

GaloisField::GaloisField() {
    exp_table_.resize(512, 0);
    log_table_.resize(256, 0);
    
    uint8_t x = 1;
    for (int i = 0; i < 255; ++i) {
        exp_table_[i] = x;
        log_table_[x] = static_cast<uint8_t>(i);
        x = static_cast<uint8_t>((x << 1) ^ (x & 0x80 ? 0x1D : 0));
    }
    
    for (int i = 255; i < 512; ++i) {
        exp_table_[i] = exp_table_[i - 255];
    }
}

uint8_t GaloisField::add(uint8_t a, uint8_t b) const {
    return a ^ b;
}

uint8_t GaloisField::mul(uint8_t a, uint8_t b) const {
    if (a == 0 || b == 0) return 0;
    return exp_table_[log_table_[a] + log_table_[b]];
}

uint8_t GaloisField::div(uint8_t a, uint8_t b) const {
    if (b == 0) throw std::runtime_error("Division by zero");
    if (a == 0) return 0;
    return exp_table_[255 + log_table_[a] - log_table_[b]];
}

uint8_t GaloisField::exp(uint8_t a, int power) const {
    if (power == 0) return 1;
    if (a == 0) return 0;
    
    uint8_t result = 1;
    uint8_t base = a;
    int p = power;
    
    while (p > 0) {
        if (p & 1) result = mul(result, base);
        base = mul(base, base);
        p >>= 1;
    }
    return result;
}

uint8_t GaloisField::inverse(uint8_t a) const {
    if (a == 0) throw std::runtime_error("Inverse of zero");
    return exp_table_[255 - log_table_[a]];
}

ReedSolomonEncoder::ReedSolomonEncoder(size_t data_shards, size_t parity_shards)
    : data_shards_(data_shards), parity_shards_(parity_shards),
      total_shards_(data_shards + parity_shards) {
    build_vandermonde_matrix();
}

void ReedSolomonEncoder::build_vandermonde_matrix() {
    matrix_.resize(parity_shards_, std::vector<uint8_t>(data_shards_, 0));
    
    for (size_t i = 0; i < parity_shards_; ++i) {
        for (size_t j = 0; j < data_shards_; ++j) {
            matrix_[i][j] = gf_.exp(static_cast<uint8_t>(i + data_shards_), 
                                      static_cast<int>(j));
        }
    }
}

bool ReedSolomonEncoder::encode(const std::vector<std::vector<uint8_t>>& data,
                                 std::vector<std::vector<uint8_t>>& parity) {
    if (data.size() != data_shards_) return false;
    
    size_t shard_size = data[0].size();
    for (const auto& shard : data) {
        if (shard.size() != shard_size) return false;
    }
    
    parity.resize(parity_shards_, std::vector<uint8_t>(shard_size, 0));
    
    for (size_t i = 0; i < parity_shards_; ++i) {
        for (size_t j = 0; j < data_shards_; ++j) {
            uint8_t coeff = matrix_[i][j];
            if (coeff != 0) {
                for (size_t k = 0; k < shard_size; ++k) {
                    parity[i][k] = gf_.add(parity[i][k], gf_.mul(coeff, data[j][k]));
                }
            }
        }
    }
    
    return true;
}

ReedSolomonDecoder::ReedSolomonDecoder(size_t data_shards, size_t parity_shards)
    : data_shards_(data_shards), parity_shards_(parity_shards),
      total_shards_(data_shards + parity_shards) {}

std::vector<std::vector<uint8_t>> ReedSolomonDecoder::invert_matrix(
    const std::vector<std::vector<uint8_t>>& matrix, size_t size) {
    
    std::vector<std::vector<uint8_t>> aug(size, std::vector<uint8_t>(size * 2, 0));
    
    for (size_t i = 0; i < size; ++i) {
        for (size_t j = 0; j < size; ++j) {
            aug[i][j] = matrix[i][j];
        }
        aug[i][size + i] = 1;
    }
    
    for (size_t i = 0; i < size; ++i) {
        if (aug[i][i] == 0) {
            for (size_t j = i + 1; j < size; ++j) {
                if (aug[j][i] != 0) {
                    std::swap(aug[i], aug[j]);
                    break;
                }
            }
        }
        
        if (aug[i][i] == 0) {
            throw std::runtime_error("Matrix is singular");
        }
        
        uint8_t inv = gf_.inverse(aug[i][i]);
        for (size_t j = i; j < size * 2; ++j) {
            aug[i][j] = gf_.mul(aug[i][j], inv);
        }
        
        for (size_t j = 0; j < size; ++j) {
            if (j != i && aug[j][i] != 0) {
                uint8_t coeff = aug[j][i];
                for (size_t k = i; k < size * 2; ++k) {
                    aug[j][k] = gf_.add(aug[j][k], gf_.mul(coeff, aug[i][k]));
                }
            }
        }
    }
    
    std::vector<std::vector<uint8_t>> result(size, std::vector<uint8_t>(size));
    for (size_t i = 0; i < size; ++i) {
        for (size_t j = 0; j < size; ++j) {
            result[i][j] = aug[i][size + j];
        }
    }
    
    return result;
}

void ReedSolomonDecoder::multiply_matrix(
    const std::vector<std::vector<uint8_t>>& matrix,
    const std::vector<std::vector<uint8_t>>& input,
    std::vector<std::vector<uint8_t>>& output,
    size_t rows, size_t cols) {
    
    size_t shard_size = input[0].size();
    output.resize(rows, std::vector<uint8_t>(shard_size, 0));
    
    for (size_t i = 0; i < rows; ++i) {
        for (size_t j = 0; j < cols; ++j) {
            uint8_t coeff = matrix[i][j];
            if (coeff != 0) {
                for (size_t k = 0; k < shard_size; ++k) {
                    output[i][k] = gf_.add(output[i][k], gf_.mul(coeff, input[j][k]));
                }
            }
        }
    }
}

bool ReedSolomonDecoder::decode(std::vector<std::vector<uint8_t>>& shards,
                                  const std::vector<bool>& present) {
    if (shards.size() != total_shards_) return false;
    
    size_t present_count = 0;
    for (bool p : present) {
        if (p) present_count++;
    }
    
    if (present_count < data_shards_) return false;
    
    std::vector<size_t> indices;
    std::vector<std::vector<uint8_t>> data_subset;
    
    for (size_t i = 0; i < total_shards_ && indices.size() < data_shards_; ++i) {
        if (present[i]) {
            indices.push_back(i);
            data_subset.push_back(shards[i]);
        }
    }
    
    if (data_subset.size() != data_shards_) return false;
    
    std::vector<std::vector<uint8_t>> decode_matrix(data_shards_, std::vector<uint8_t>(data_shards_));
    for (size_t i = 0; i < data_shards_; ++i) {
        for (size_t j = 0; j < data_shards_; ++j) {
            decode_matrix[i][j] = gf_.exp(static_cast<uint8_t>(indices[i]), static_cast<int>(j));
        }
    }
    
    try {
        auto inv_matrix = invert_matrix(decode_matrix, data_shards_);
        
        std::vector<std::vector<uint8_t>> recovered;
        multiply_matrix(inv_matrix, data_subset, recovered, data_shards_, data_shards_);
        
        std::vector<std::vector<uint8_t>> encode_matrix(data_shards_, std::vector<uint8_t>(data_shards_));
        for (size_t i = 0; i < data_shards_; ++i) {
            for (size_t j = 0; j < data_shards_; ++j) {
                encode_matrix[i][j] = gf_.exp(static_cast<uint8_t>(i), static_cast<int>(j));
            }
        }
        
        std::vector<std::vector<uint8_t>> reconstructed;
        multiply_matrix(encode_matrix, recovered, reconstructed, data_shards_, data_shards_);
        
        for (size_t i = 0; i < data_shards_; ++i) {
            if (!present[i]) {
                shards[i] = reconstructed[i];
            }
        }
        
        return true;
    } catch (...) {
        return false;
    }
}

FecEncoder::FecEncoder() : rs_encoder_(DATA_SHARDS, PARITY_SHARDS), fec_group_id_(0) {
    data_shards_.resize(DATA_SHARDS);
}

void FecEncoder::add_packet(const Packet& packet) {
    buffer_.push_back(packet);
}

bool FecEncoder::ready_to_encode() const {
    return buffer_.size() >= DATA_SHARDS;
}

bool FecEncoder::encode(std::vector<Packet>& redundant_packets,
                         uint32_t conn_id, uint32_t stream_id) {
    if (!ready_to_encode()) return false;
    
    size_t max_size = 0;
    for (size_t i = 0; i < DATA_SHARDS; ++i) {
        max_size = std::max(max_size, buffer_[i].payload.size());
    }
    
    for (size_t i = 0; i < DATA_SHARDS; ++i) {
        data_shards_[i] = buffer_[i].payload;
        data_shards_[i].resize(max_size, 0);
    }
    
    std::vector<std::vector<uint8_t>> parity;
    if (!rs_encoder_.encode(data_shards_, parity)) return false;
    
    uint64_t base_seq = buffer_[0].header.sequence_number;
    
    for (size_t i = 0; i < PARITY_SHARDS; ++i) {
        Packet pkt(PacketType::FEC_REDUNDANT, conn_id, stream_id, base_seq + DATA_SHARDS + i);
        pkt.payload = parity[i];
        
        pkt.payload.resize(sizeof(uint64_t) * 2);
        *reinterpret_cast<uint64_t*>(pkt.payload.data()) = fec_group_id_;
        *reinterpret_cast<uint64_t*>(pkt.payload.data() + sizeof(uint64_t)) = DATA_SHARDS + i;
        
        pkt.payload.insert(pkt.payload.end(), parity[i].begin(), parity[i].end());
        
        redundant_packets.push_back(pkt);
    }
    
    fec_group_id_++;
    buffer_.erase(buffer_.begin(), buffer_.begin() + DATA_SHARDS);
    
    return true;
}

void FecEncoder::reset() {
    buffer_.clear();
    fec_group_id_ = 0;
}

FecDecoder::FecDecoder() : rs_decoder_(DATA_SHARDS, PARITY_SHARDS) {}

void FecDecoder::add_data_packet(const Packet& packet, uint64_t group_id, size_t index) {
    if (groups_[group_id].group_id = group_id;
    
    auto& group = groups_[group_id];
    if (group.shards.empty()) {
        group.shards.resize(DATA_SHARDS + PARITY_SHARDS);
        group.present.resize(DATA_SHARDS + PARITY_SHARDS, false);
        group.sequence_numbers.resize(DATA_SHARDS + PARITY_SHARDS, 0);
        group.data_count = 0;
        group.parity_count = 0;
    }
    
    if (index < DATA_SHARDS) {
        group.shards[index] = packet.payload;
        group.present[index] = true;
        group.sequence_numbers[index] = packet.header.sequence_number;
        group.data_count++;
    }
}

void FecDecoder::add_redundant_packet(const Packet& packet, uint64_t group_id, size_t index) {
    auto& group = groups_[group_id];
    if (group.shards.empty()) {
        group.shards.resize(DATA_SHARDS + PARITY_SHARDS);
        group.present.resize(DATA_SHARDS + PARITY_SHARDS, false);
        group.sequence_numbers.resize(DATA_SHARDS + PARITY_SHARDS, 0);
        group.data_count = 0;
        group.parity_count = 0;
    }
    
    if (index >= DATA_SHARDS && index < DATA_SHARDS + PARITY_SHARDS) {
        size_t parity_index = index - DATA_SHARDS;
        if (packet.payload.size() > sizeof(uint64_t) * 2) {
            group.shards[index] = std::vector<uint8_t>(
                packet.payload.begin() + sizeof(uint64_t) * 2,
                packet.payload.end()
            );
            group.present[index] = true;
            group.parity_count++;
        }
    }
}

bool FecDecoder::try_recover(uint64_t group_id, std::vector<Packet>& recovered) {
    auto it = groups_.find(group_id);
    if (it == groups_.end()) return false;
    
    auto& group = it->second;
    
    size_t present_count = 0;
    for (bool p : group.present) {
        if (p) present_count++;
    }
    
    if (present_count < DATA_SHARDS) return false;
    
    if (present_count == DATA_SHARDS + PARITY_SHARDS) return false;
    
    size_t max_size = 0;
    for (size_t i = 0; i < DATA_SHARDS + PARITY_SHARDS; ++i) {
        if (group.present[i]) {
            max_size = std::max(max_size, group.shards[i].size());
        }
    }
    
    for (size_t i = 0; i < DATA_SHARDS + PARITY_SHARDS; ++i) {
        if (group.present[i]) {
            group.shards[i].resize(max_size, 0);
        } else {
            group.shards[i].resize(max_size, 0);
        }
    }
    
    if (!rs_decoder_.decode(group.shards, group.present)) {
        return false;
    }
    
    for (size_t i = 0; i < DATA_SHARDS; ++i) {
        if (!group.present[i]) {
            Packet pkt;
            pkt.payload = group.shards[i];
            pkt.header.sequence_number = group.sequence_numbers[i];
            recovered.push_back(pkt);
        }
    }
    
    return !recovered.empty();
}

bool FecDecoder::is_group_complete(uint64_t group_id) const {
    auto it = groups_.find(group_id);
    if (it == groups_.end()) return false;
    
    const auto& group = it->second;
    for (size_t i = 0; i < DATA_SHARDS; ++i) {
        if (!group.present[i]) return false;
    }
    return true;
}

void FecDecoder::remove_group(uint64_t group_id) {
    groups_.erase(group_id);
}

void FecDecoder::reset() {
    groups_.clear();
}
