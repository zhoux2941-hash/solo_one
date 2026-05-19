#pragma once

#include <cstdint>
#include <string>
#include <mutex>
#include <memory>
#include <fstream>
#include <vector>
#include <unordered_map>
#include <spdlog/spdlog.h>
#include "kv/storage_engine.h"

namespace paxoskv {

struct SnapshotMetadata {
    uint64_t last_included_index = 0;
    uint64_t last_included_term = 0;
    uint64_t data_size = 0;
    std::string checksum;
    uint64_t timestamp = 0;
};

class SnapshotManager {
public:
    SnapshotManager();
    ~SnapshotManager();

    bool Init(const std::string& snapshot_dir);

    bool CreateSnapshot(StorageEngine* engine,
                       uint64_t last_included_index,
                       uint64_t last_included_term,
                       std::string& snapshot_path);

    bool LoadSnapshot(const std::string& snapshot_path,
                     StorageEngine* engine,
                     SnapshotMetadata& metadata);

    bool ApplySnapshotChunk(const std::string& snapshot_id,
                           uint64_t offset,
                           const std::string& data,
                           bool done);

    bool FinalizeSnapshot(const std::string& snapshot_id,
                         StorageEngine* engine,
                         SnapshotMetadata& metadata);

    std::string GetLatestSnapshot();

    bool DeleteOldSnapshots(uint64_t keep_count = 3);

    const SnapshotMetadata& GetLatestMetadata() const { return latest_metadata_; }

    void CleanupIncompleteSnapshots();
    bool AbortSnapshot(const std::string& snapshot_id);
    bool VerifySnapshotFile(const std::string& snapshot_path, const SnapshotMetadata& metadata);

private:
    std::string GenerateSnapshotFilename(uint64_t index);
    bool WriteMetadata(const std::string& path, const SnapshotMetadata& metadata);
    bool ReadMetadata(const std::string& path, SnapshotMetadata& metadata);
    std::string ComputeChecksum(const std::string& data);

    std::string snapshot_dir_;
    std::mutex mutex_;
    SnapshotMetadata latest_metadata_;

    std::unordered_map<std::string, std::ofstream> in_progress_snapshots_;
};

} 
