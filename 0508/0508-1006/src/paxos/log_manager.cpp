#include "paxos/log_manager.h"

namespace paxoskv {

LogManager::LogManager() = default;

LogManager::~LogManager() {
    Close();
}

std::string LogManager::GetLogKey(uint64_t index) {
    std::string key;
    key.reserve(9);
    key.push_back('L');
    for (int i = 7; i >= 0; --i) {
        key.push_back(static_cast<char>((index >> (i * 8)) & 0xFF));
    }
    return key;
}

std::string LogManager::GetMetaKey(const std::string& name) {
    return "M:" + name;
}

bool LogManager::Init(const std::string& log_path) {
    log_path_ = log_path;
    options_.create_if_missing = true;
    options_.create_missing_column_families = true;
    options_.write_buffer_size = 64 * 1024 * 1024;
    options_.max_write_buffer_number = 3;
    options_.min_write_buffer_number_to_merge = 1;

    rocksdb::Status s = rocksdb::DB::Open(options_, log_path_, &db_);
    if (!s.ok()) {
        SPDLOG_ERROR("Failed to open log DB at {}: {}", log_path_, s.ToString());
        return false;
    }

    if (!LoadFromDisk()) {
        SPDLOG_ERROR("Failed to load logs from disk");
        return false;
    }

    SPDLOG_INFO("LogManager initialized, loaded {} entries, last_index={}, last_term={}",
                log_entries_.size(), last_log_index_, last_log_term_);
    return true;
}

void LogManager::Close() {
    if (db_) {
        delete db_;
        db_ = nullptr;
    }
}

bool LogManager::LoadFromDisk() {
    std::lock_guard<std::mutex> lock(mutex_);

    log_entries_.clear();
    first_log_index_ = 0;
    last_log_index_ = 0;
    last_log_term_ = 0;

    std::string meta_value;
    auto s = db_->Get(rocksdb::ReadOptions(), GetMetaKey("first_log_index"), &meta_value);
    if (s.ok() && !meta_value.empty()) {
        memcpy(&first_log_index_, meta_value.data(), sizeof(uint64_t));
    }

    s = db_->Get(rocksdb::ReadOptions(), GetMetaKey("last_log_index"), &meta_value);
    if (s.ok() && !meta_value.empty()) {
        memcpy(&last_log_index_, meta_value.data(), sizeof(uint64_t));
    }

    s = db_->Get(rocksdb::ReadOptions(), GetMetaKey("last_log_term"), &meta_value);
    if (s.ok() && !meta_value.empty()) {
        memcpy(&last_log_term_, meta_value.data(), sizeof(uint64_t));
    }

    s = db_->Get(rocksdb::ReadOptions(), GetMetaKey("commit_index"), &meta_value);
    if (s.ok() && !meta_value.empty()) {
        memcpy(&commit_index_, meta_value.data(), sizeof(uint64_t));
    }

    s = db_->Get(rocksdb::ReadOptions(), GetMetaKey("snapshot_last_index"), &meta_value);
    if (s.ok() && !meta_value.empty()) {
        memcpy(&snapshot_last_index_, meta_value.data(), sizeof(uint64_t));
    }

    s = db_->Get(rocksdb::ReadOptions(), GetMetaKey("snapshot_last_term"), &meta_value);
    if (s.ok() && !meta_value.empty()) {
        memcpy(&snapshot_last_term_, meta_value.data(), sizeof(uint64_t));
    }

    s = db_->Get(rocksdb::ReadOptions(), GetMetaKey("current_term"), &meta_value);
    if (s.ok() && !meta_value.empty()) {
        memcpy(&current_term_, meta_value.data(), sizeof(uint64_t));
    }

    s = db_->Get(rocksdb::ReadOptions(), GetMetaKey("voted_for"), &meta_value);
    if (s.ok() && !meta_value.empty()) {
        memcpy(&voted_for_, meta_value.data(), sizeof(uint64_t));
    }

    auto it = db_->NewIterator(rocksdb::ReadOptions());
    for (it->Seek(GetLogKey(first_log_index_ + 1));
         it->Valid() && it->key().starts_with("L");
         it->Next()) {
        LogEntry entry;
        if (entry.ParseFromString(it->value().ToString())) {
            log_entries_.push_back(entry);
        }
    }
    delete it;

    if (!log_entries_.empty()) {
        if (first_log_index_ == 0) {
            first_log_index_ = log_entries_.front().index();
        }
        if (last_log_index_ == 0) {
            last_log_index_ = log_entries_.back().index();
            last_log_term_ = log_entries_.back().term();
        }
    }

    return true;
}

bool LogManager::PersistEntry(const LogEntry& entry) {
    rocksdb::WriteOptions write_opts;
    write_opts.sync = true;
    auto s = db_->Put(write_opts, GetLogKey(entry.index()), entry.SerializeAsString());
    return s.ok();
}

uint64_t LogManager::Append(const LogEntry& entry) {
    std::lock_guard<std::mutex> lock(mutex_);

    uint64_t new_index = last_log_index_ + 1;
    LogEntry new_entry = entry;
    new_entry.set_index(new_index);
    new_entry.set_timestamp(Utils::NowMillis());

    if (!PersistEntry(new_entry)) {
        SPDLOG_ERROR("Failed to persist log entry at index {}", new_index);
        return 0;
    }

    log_entries_.push_back(new_entry);
    last_log_index_ = new_index;
    last_log_term_ = new_entry.term();

    std::string idx_str(reinterpret_cast<char*>(&last_log_index_), sizeof(uint64_t));
    std::string term_str(reinterpret_cast<char*>(&last_log_term_), sizeof(uint64_t));
    rocksdb::WriteBatch batch;
    batch.Put(GetMetaKey("last_log_index"), idx_str);
    batch.Put(GetMetaKey("last_log_term"), term_str);
    db_->Write(rocksdb::WriteOptions(), &batch);

    return new_index;
}

bool LogManager::Append(const std::vector<LogEntry>& entries) {
    std::lock_guard<std::mutex> lock(mutex_);

    rocksdb::WriteBatch batch;
    uint64_t current_index = last_log_index_;
    uint64_t current_term = last_log_term_;

    for (const auto& entry : entries) {
        current_index++;
        LogEntry new_entry = entry;
        new_entry.set_index(current_index);
        new_entry.set_timestamp(Utils::NowMillis());

        batch.Put(GetLogKey(current_index), new_entry.SerializeAsString());
        log_entries_.push_back(new_entry);
        current_term = new_entry.term();
    }

    last_log_index_ = current_index;
    last_log_term_ = current_term;

    std::string idx_str(reinterpret_cast<char*>(&last_log_index_), sizeof(uint64_t));
    std::string term_str(reinterpret_cast<char*>(&last_log_term_), sizeof(uint64_t));
    batch.Put(GetMetaKey("last_log_index"), idx_str);
    batch.Put(GetMetaKey("last_log_term"), term_str);

    rocksdb::WriteOptions write_opts;
    write_opts.sync = true;
    auto s = db_->Write(write_opts, &batch);
    if (!s.ok()) {
        SPDLOG_ERROR("Failed to persist batch log entries: {}", s.ToString());
        return false;
    }

    return true;
}

std::optional<LogEntry> LogManager::GetEntry(uint64_t index) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (index <= snapshot_last_index_) {
        SPDLOG_WARN("Requested log entry at {} is in snapshot", index);
        return std::nullopt;
    }

    if (index < first_log_index_ || index > last_log_index_) {
        return std::nullopt;
    }

    size_t pos = static_cast<size_t>(index - first_log_index_);
    if (pos >= log_entries_.size()) {
        return std::nullopt;
    }

    return log_entries_[pos];
}

bool LogManager::GetEntries(uint64_t start, uint64_t end, std::vector<LogEntry>& entries) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (start < first_log_index_) {
        start = first_log_index_;
    }
    if (end > last_log_index_) {
        end = last_log_index_;
    }
    if (start > end) {
        return true;
    }

    size_t start_pos = static_cast<size_t>(start - first_log_index_);
    size_t end_pos = static_cast<size_t>(end - first_log_index_ + 1);

    if (start_pos >= log_entries_.size()) {
        return false;
    }
    if (end_pos > log_entries_.size()) {
        end_pos = log_entries_.size();
    }

    entries.reserve(end_pos - start_pos);
    for (size_t i = start_pos; i < end_pos; ++i) {
        entries.push_back(log_entries_[i]);
    }

    return true;
}

bool LogManager::Truncate(uint64_t index) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (index <= snapshot_last_index_) {
        SPDLOG_ERROR("Cannot truncate log before snapshot index {}", snapshot_last_index_);
        return false;
    }

    if (index > last_log_index_) {
        return true;
    }

    size_t pos = static_cast<size_t>(index - first_log_index_);
    if (pos > log_entries_.size()) {
        return true;
    }

    rocksdb::WriteBatch batch;
    for (uint64_t i = index; i <= last_log_index_; ++i) {
        batch.Delete(GetLogKey(i));
    }

    log_entries_.erase(log_entries_.begin() + pos, log_entries_.end());
    last_log_index_ = index - 1;
    if (!log_entries_.empty()) {
        last_log_term_ = log_entries_.back().term();
    } else {
        last_log_term_ = 0;
    }

    std::string idx_str(reinterpret_cast<char*>(&last_log_index_), sizeof(uint64_t));
    std::string term_str(reinterpret_cast<char*>(&last_log_term_), sizeof(uint64_t));
    batch.Put(GetMetaKey("last_log_index"), idx_str);
    batch.Put(GetMetaKey("last_log_term"), term_str);

    rocksdb::WriteOptions write_opts;
    write_opts.sync = true;
    auto s = db_->Write(write_opts, &batch);
    if (!s.ok()) {
        SPDLOG_ERROR("Failed to truncate logs: {}", s.ToString());
        return false;
    }

    SPDLOG_INFO("Log truncated to index {}", last_log_index_);
    return true;
}

void LogManager::SetSnapshotMetadata(uint64_t last_included_index, uint64_t last_included_term) {
    std::lock_guard<std::mutex> lock(mutex_);
    snapshot_last_index_ = last_included_index;
    snapshot_last_term_ = last_included_term;

    std::string idx_str(reinterpret_cast<char*>(&snapshot_last_index_), sizeof(uint64_t));
    std::string term_str(reinterpret_cast<char*>(&snapshot_last_term_), sizeof(uint64_t));

    rocksdb::WriteBatch batch;
    batch.Put(GetMetaKey("snapshot_last_index"), idx_str);
    batch.Put(GetMetaKey("snapshot_last_term"), term_str);

    db_->Write(rocksdb::WriteOptions(), &batch);
}

bool LogManager::Compact(uint64_t up_to_index) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (up_to_index <= snapshot_last_index_) {
        SPDLOG_WARN("Compact index {} is before snapshot index {}", up_to_index, snapshot_last_index_);
        return true;
    }

    if (up_to_index > last_log_index_) {
        up_to_index = last_log_index_;
    }

    size_t entries_to_remove = static_cast<size_t>(up_to_index - first_log_index_ + 1);
    if (entries_to_remove >= log_entries_.size()) {
        SPDLOG_WARN("Cannot compact all log entries");
        return true;
    }

    rocksdb::WriteBatch batch;
    for (uint64_t i = first_log_index_; i <= up_to_index; ++i) {
        batch.Delete(GetLogKey(i));
    }

    log_entries_.erase(log_entries_.begin(), log_entries_.begin() + entries_to_remove);
    first_log_index_ = up_to_index + 1;

    std::string idx_str(reinterpret_cast<char*>(&first_log_index_), sizeof(uint64_t));
    batch.Put(GetMetaKey("first_log_index"), idx_str);

    rocksdb::WriteOptions write_opts;
    write_opts.sync = true;
    auto s = db_->Write(write_opts, &batch);
    if (!s.ok()) {
        SPDLOG_ERROR("Failed to compact logs: {}", s.ToString());
        return false;
    }

    SPDLOG_INFO("Log compacted up to index {}, new first_log_index={}", up_to_index, first_log_index_);
    return true;
}

void LogManager::SaveSnapshotProgress(uint64_t offset, const std::string& snapshot_id) {
    std::string key = GetMetaKey("snapshot_progress");
    std::string value;
    value.append(reinterpret_cast<char*>(&offset), sizeof(uint64_t));
    value.append(snapshot_id);

    rocksdb::WriteOptions opts;
    opts.sync = true;
    db_->Put(opts, key, value);
}

std::pair<uint64_t, std::string> LogManager::LoadSnapshotProgress() {
    std::string key = GetMetaKey("snapshot_progress");
    std::string value;
    auto s = db_->Get(rocksdb::ReadOptions(), key, &value);

    if (s.ok() && value.size() >= sizeof(uint64_t)) {
        uint64_t offset = *reinterpret_cast<const uint64_t*>(value.data());
        std::string snapshot_id = value.substr(sizeof(uint64_t));
        return {offset, snapshot_id};
    }
    return {0, ""};
}

void LogManager::SetCurrentTerm(uint64_t term) {
    std::lock_guard<std::mutex> lock(mutex_);
    current_term_ = term;
    voted_for_ = 0;

    std::string term_str(reinterpret_cast<char*>(&current_term_), sizeof(uint64_t));
    std::string voted_str(reinterpret_cast<char*>(&voted_for_), sizeof(uint64_t));

    rocksdb::WriteBatch batch;
    batch.Put(GetMetaKey("current_term"), term_str);
    batch.Put(GetMetaKey("voted_for"), voted_str);

    db_->Write(rocksdb::WriteOptions(), &batch);
}

void LogManager::SetVotedFor(uint64_t node_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    voted_for_ = node_id;

    std::string voted_str(reinterpret_cast<char*>(&voted_for_), sizeof(uint64_t));
    db_->Put(rocksdb::WriteOptions(), GetMetaKey("voted_for"), voted_str);
}

} 
