#include "file_transfer.h"
#include <algorithm>
#include <filesystem>
#include <iostream>

FileInfo::FileInfo() : file_size(0), chunk_count(0), stream_id(0), completed(false) {}

FileSender::FileSender()
    : file_size_(0), chunk_count_(0), stream_id_(0), current_chunk_(0) {}

FileSender::~FileSender() {
    close();
}

bool FileSender::open_file(const std::string& filepath, uint32_t stream_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    file_.open(filepath, std::ios::binary);
    if (!file_.is_open()) {
        return false;
    }
    
    std::filesystem::path path(filepath);
    filename_ = path.filename().string();
    stream_id_ = stream_id;
    current_chunk_ = 0;
    
    file_.seekg(0, std::ios::end);
    file_size_ = static_cast<uint64_t>(file_.tellg());
    file_.seekg(0, std::ios::beg);
    
    chunk_count_ = (file_size_ + CHUNK_SIZE - 1) / CHUNK_SIZE;
    
    return true;
}

bool FileSender::read_chunk(uint64_t chunk_index, std::vector<uint8_t>& data) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (chunk_index >= chunk_count_) {
        return false;
    }
    
    uint64_t offset = chunk_index * CHUNK_SIZE;
    file_.seekg(static_cast<std::streamoff>(offset), std::ios::beg);
    
    size_t to_read = static_cast<size_t>(std::min(
        static_cast<uint64_t>(CHUNK_SIZE),
        file_size_ - offset
    ));
    
    data.resize(to_read);
    file_.read(reinterpret_cast<char*>(data.data()), static_cast<std::streamsize>(to_read));
    
    return file_.gcount() == static_cast<std::streamsize>(to_read);
}

bool FileSender::get_next_chunk(std::vector<uint8_t>& data, uint64_t& chunk_index) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    while (current_chunk_ < chunk_count_) {
        if (acked_chunks_.find(current_chunk_) == acked_chunks_.end()) {
            uint64_t offset = current_chunk_ * CHUNK_SIZE;
            file_.seekg(static_cast<std::streamoff>(offset), std::ios::beg);
            
            size_t to_read = static_cast<size_t>(std::min(
                static_cast<uint64_t>(CHUNK_SIZE),
                file_size_ - offset
            ));
            
            data.resize(to_read);
            file_.read(reinterpret_cast<char*>(data.data()), static_cast<std::streamsize>(to_read));
            
            if (file_.gcount() == static_cast<std::streamsize>(to_read)) {
                chunk_index = current_chunk_;
                current_chunk_++;
                return true;
            }
        }
        current_chunk_++;
    }
    
    return false;
}

bool FileSender::is_complete() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return acked_chunks_.size() == chunk_count_;
}

float FileSender::get_progress() const {
    std::lock_guard<std::mutex> lock(mutex_);
    if (chunk_count_ == 0) return 0.0f;
    return static_cast<float>(acked_chunks_.size()) / chunk_count_ * 100.0f;
}

void FileSender::mark_chunk_acked(uint64_t chunk_index) {
    std::lock_guard<std::mutex> lock(mutex_);
    acked_chunks_.insert(chunk_index);
}

bool FileSender::is_chunk_acked(uint64_t chunk_index) const {
    std::lock_guard<std::mutex> lock(mutex_);
    return acked_chunks_.find(chunk_index) != acked_chunks_.end();
}

uint64_t FileSender::get_next_unacked_chunk() const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    for (uint64_t i = 0; i < chunk_count_; ++i) {
        if (acked_chunks_.find(i) == acked_chunks_.end()) {
            return i;
        }
    }
    return chunk_count_;
}

void FileSender::close() {
    if (file_.is_open()) {
        file_.close();
    }
}

FileReceiver::FileReceiver()
    : file_size_(0), chunk_count_(0), stream_id_(0) {}

FileReceiver::~FileReceiver() {
    close();
}

bool FileReceiver::create_file(const std::string& filepath, uint64_t file_size, uint32_t stream_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    file_.open(filepath, std::ios::binary | std::ios::trunc);
    if (!file_.is_open()) {
        return false;
    }
    
    std::filesystem::path path(filepath);
    filename_ = path.filename().string();
    file_size_ = file_size;
    stream_id_ = stream_id;
    
    chunk_count_ = (file_size_ + CHUNK_SIZE - 1) / CHUNK_SIZE;
    
    return true;
}

bool FileReceiver::write_chunk(uint64_t chunk_index, const std::vector<uint8_t>& data) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (chunk_index >= chunk_count_) {
        return false;
    }
    
    chunk_buffer_[chunk_index] = data;
    received_chunks_.insert(chunk_index);
    
    if (chunk_buffer_.size() >= BUFFER_THRESHOLD) {
        flush_internal();
    }
    
    return true;
}

bool FileReceiver::flush_internal() {
    uint64_t start_chunk = 0;
    
    while (!chunk_buffer_.empty()) {
        auto it = chunk_buffer_.find(start_chunk);
        if (it == chunk_buffer_.end()) {
            break;
        }
        
        uint64_t offset = start_chunk * CHUNK_SIZE;
        file_.seekp(static_cast<std::streamoff>(offset), std::ios::beg);
        file_.write(reinterpret_cast<const char*>(it->second.data()),
                    static_cast<std::streamsize>(it->second.size()));
        
        chunk_buffer_.erase(it);
        start_chunk++;
    }
    
    return true;
}

bool FileReceiver::flush() {
    std::lock_guard<std::mutex> lock(mutex_);
    return flush_internal();
}

bool FileReceiver::is_complete() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return received_chunks_.size() == chunk_count_;
}

float FileReceiver::get_progress() const {
    std::lock_guard<std::mutex> lock(mutex_);
    if (chunk_count_ == 0) return 0.0f;
    return static_cast<float>(received_chunks_.size()) / chunk_count_ * 100.0f;
}

bool FileReceiver::has_chunk(uint64_t chunk_index) const {
    std::lock_guard<std::mutex> lock(mutex_);
    return received_chunks_.find(chunk_index) != received_chunks_.end();
}

std::vector<uint64_t> FileReceiver::get_missing_chunks() const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    std::vector<uint64_t> missing;
    for (uint64_t i = 0; i < chunk_count_; ++i) {
        if (received_chunks_.find(i) == received_chunks_.end()) {
            missing.push_back(i);
        }
    }
    return missing;
}

void FileReceiver::close() {
    flush();
    if (file_.is_open()) {
        file_.close();
    }
}

FileManager::~FileManager() {
    clear();
}

bool FileManager::add_sender(const std::string& filepath, uint32_t stream_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto sender = std::make_shared<FileSender>();
    if (!sender->open_file(filepath, stream_id)) {
        return false;
    }
    
    senders_[stream_id] = sender;
    return true;
}

bool FileManager::add_receiver(const std::string& filepath, uint64_t file_size, uint32_t stream_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    auto receiver = std::make_shared<FileReceiver>();
    if (!receiver->create_file(filepath, file_size, stream_id)) {
        return false;
    }
    
    receivers_[stream_id] = receiver;
    return true;
}

std::shared_ptr<FileSender> FileManager::get_sender(uint32_t stream_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = senders_.find(stream_id);
    if (it != senders_.end()) {
        return it->second;
    }
    return nullptr;
}

std::shared_ptr<FileReceiver> FileManager::get_receiver(uint32_t stream_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = receivers_.find(stream_id);
    if (it != receivers_.end()) {
        return it->second;
    }
    return nullptr;
}

void FileManager::remove_stream(uint32_t stream_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    senders_.erase(stream_id);
    receivers_.erase(stream_id);
}

void FileManager::clear() {
    std::lock_guard<std::mutex> lock(mutex_);
    senders_.clear();
    receivers_.clear();
}

std::vector<uint32_t> FileManager::get_active_streams() const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    std::vector<uint32_t> streams;
    for (const auto& pair : senders_) {
        streams.push_back(pair.first);
    }
    for (const auto& pair : receivers_) {
        streams.push_back(pair.first);
    }
    return streams;
}

size_t FileManager::active_stream_count() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return senders_.size() + receivers_.size();
}
