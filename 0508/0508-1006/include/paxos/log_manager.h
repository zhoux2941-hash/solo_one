#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <mutex>
#include <deque>
#include <memory>
#include <optional>
#include <rocksdb/db.h>
#include <rocksdb/options.h>
#include <rocksdb/write_batch.h>
#include <spdlog/spdlog.h>
#include "paxos.pb.h"
#include "common/utils.h"

namespace paxoskv {

class LogManager {
public:
    LogManager();
    ~LogManager();

    bool Init(const std::string& log_path);
    void Close();

    uint64_t Append(const LogEntry& entry);
    bool Append(const std::vector<LogEntry>& entries);

    std::optional<LogEntry> GetEntry(uint64_t index);
    bool GetEntries(uint64_t start, uint64_t end, std::vector<LogEntry>& entries);

    uint64_t LastLogIndex() const { return last_log_index_; }
    uint64_t LastLogTerm() const { return last_log_term_; }

    uint64_t CommitIndex() const { return commit_index_; }
    void SetCommitIndex(uint64_t index) { commit_index_ = index; }

    uint64_t LastApplied() const { return last_applied_; }
    void SetLastApplied(uint64_t index) { last_applied_ = index; }

    uint64_t FirstLogIndex() const { return first_log_index_; }

    bool Truncate(uint64_t index);

    void SetSnapshotMetadata(uint64_t last_included_index, uint64_t last_included_term);
    uint64_t GetLastIncludedIndex() const { return snapshot_last_index_; }
    uint64_t GetLastIncludedTerm() const { return snapshot_last_term_; }

    bool Compact(uint64_t up_to_index);

    size_t Size() const { return log_entries_.size(); }

    void SaveSnapshotProgress(uint64_t offset, const std::string& snapshot_id);
    std::pair<uint64_t, std::string> LoadSnapshotProgress();

    void SetCurrentTerm(uint64_t term);
    uint64_t GetCurrentTerm() const { return current_term_; }
    void SetVotedFor(uint64_t node_id);
    uint64_t GetVotedFor() const { return voted_for_; }

private:
    bool LoadFromDisk();
    bool PersistEntry(const LogEntry& entry);
    std::string GetLogKey(uint64_t index);
    std::string GetMetaKey(const std::string& name);

    rocksdb::DB* db_ = nullptr;
    rocksdb::Options options_;
    std::string log_path_;

    mutable std::mutex mutex_;
    std::deque<LogEntry> log_entries_;

    uint64_t first_log_index_ = 0;
    uint64_t last_log_index_ = 0;
    uint64_t last_log_term_ = 0;
    uint64_t commit_index_ = 0;
    uint64_t last_applied_ = 0;

    uint64_t snapshot_last_index_ = 0;
    uint64_t snapshot_last_term_ = 0;

    uint64_t current_term_ = 0;
    uint64_t voted_for_ = 0;
};

} 
