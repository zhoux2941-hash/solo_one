#pragma once

#include "protocol.h"
#include <string>
#include <fstream>
#include <vector>
#include <map>
#include <set>
#include <mutex>
#include <atomic>
#include <memory>

struct FileInfo {
    std::string filename;
    uint64_t file_size;
    uint64_t chunk_count;
    uint32_t stream_id;
    std::atomic<bool> completed;
    
    FileInfo();
};

class FileSender {
public:
    FileSender();
    ~FileSender();
    
    bool open_file(const std::string& filepath, uint32_t stream_id);
    bool read_chunk(uint64_t chunk_index, std::vector<uint8_t>& data);
    bool get_next_chunk(std::vector<uint8_t>& data, uint64_t& chunk_index);
    
    uint64_t file_size() const { return file_size_; }
    uint64_t chunk_count() const { return chunk_count_; }
    const std::string& filename() const { return filename_; }
    uint32_t stream_id() const { return stream_id_; }
    
    bool is_complete() const;
    float get_progress() const;
    
    void mark_chunk_acked(uint64_t chunk_index);
    bool is_chunk_acked(uint64_t chunk_index) const;
    uint64_t get_next_unacked_chunk() const;
    
    void close();
    
private:
    std::ifstream file_;
    std::string filename_;
    uint64_t file_size_;
    uint64_t chunk_count_;
    uint32_t stream_id_;
    uint64_t current_chunk_;
    
    std::set<uint64_t> acked_chunks_;
    mutable std::mutex mutex_;
    
    static constexpr size_t CHUNK_SIZE = MAX_PAYLOAD_SIZE;
};

class FileReceiver {
public:
    FileReceiver();
    ~FileReceiver();
    
    bool create_file(const std::string& filepath, uint64_t file_size, uint32_t stream_id);
    bool write_chunk(uint64_t chunk_index, const std::vector<uint8_t>& data);
    bool flush();
    
    uint64_t file_size() const { return file_size_; }
    uint64_t chunk_count() const { return chunk_count_; }
    const std::string& filename() const { return filename_; }
    uint32_t stream_id() const { return stream_id_; }
    
    bool is_complete() const;
    float get_progress() const;
    
    bool has_chunk(uint64_t chunk_index) const;
    std::vector<uint64_t> get_missing_chunks() const;
    
    void close();
    
private:
    std::ofstream file_;
    std::string filename_;
    uint64_t file_size_;
    uint64_t chunk_count_;
    uint32_t stream_id_;
    
    std::set<uint64_t> received_chunks_;
    std::map<uint64_t, std::vector<uint8_t>> chunk_buffer_;
    mutable std::mutex mutex_;
    
    static constexpr size_t CHUNK_SIZE = MAX_PAYLOAD_SIZE;
    static constexpr size_t BUFFER_THRESHOLD = 1000;
};

class FileManager {
public:
    FileManager() = default;
    ~FileManager();
    
    bool add_sender(const std::string& filepath, uint32_t stream_id);
    bool add_receiver(const std::string& filepath, uint64_t file_size, uint32_t stream_id);
    
    std::shared_ptr<FileSender> get_sender(uint32_t stream_id);
    std::shared_ptr<FileReceiver> get_receiver(uint32_t stream_id);
    
    void remove_stream(uint32_t stream_id);
    void clear();
    
    std::vector<uint32_t> get_active_streams() const;
    size_t active_stream_count() const;
    
private:
    std::map<uint32_t, std::shared_ptr<FileSender>> senders_;
    std::map<uint32_t, std::shared_ptr<FileReceiver>> receivers_;
    mutable std::mutex mutex_;
};
