#include "paxos/snapshot_manager.h"
#include "common/utils.h"
#include <filesystem>
#include <sstream>
#include <iomanip>
#include <openssl/sha.h>

namespace fs = std::filesystem;

namespace paxoskv {

SnapshotManager::SnapshotManager() = default;

SnapshotManager::~SnapshotManager() {
    for (auto& [id, stream] : in_progress_snapshots_) {
        if (stream.is_open()) {
            stream.close();
        }
    }
    in_progress_snapshots_.clear();
}

bool SnapshotManager::Init(const std::string& snapshot_dir) {
    snapshot_dir_ = snapshot_dir;
    if (!fs::exists(snapshot_dir_)) {
        fs::create_directories(snapshot_dir_);
    }

    CleanupIncompleteSnapshots();

    std::string latest = GetLatestSnapshot();
    if (!latest.empty()) {
        SnapshotMetadata meta;
        if (ReadMetadata(latest, meta)) {
            latest_metadata_ = meta;
        }
    }

    SPDLOG_INFO("SnapshotManager initialized at {}", snapshot_dir_);
    return true;
}

std::string SnapshotManager::GenerateSnapshotFilename(uint64_t index) {
    std::ostringstream oss;
    oss << "snapshot_" << std::setw(12) << std::setfill('0') << index << ".dat";
    return oss.str();
}

std::string SnapshotManager::ComputeChecksum(const std::string& data) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256(reinterpret_cast<const unsigned char*>(data.data()), data.size(), hash);
    std::ostringstream oss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) {
        oss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(hash[i]);
    }
    return oss.str();
}

bool SnapshotManager::WriteMetadata(const std::string& path, const SnapshotMetadata& metadata) {
    std::ofstream meta_file(path + ".meta", std::ios::binary);
    if (!meta_file.is_open()) {
        return false;
    }

    meta_file.write(reinterpret_cast<const char*>(&metadata.last_included_index), sizeof(uint64_t));
    meta_file.write(reinterpret_cast<const char*>(&metadata.last_included_term), sizeof(uint64_t));
    meta_file.write(reinterpret_cast<const char*>(&metadata.data_size), sizeof(uint64_t));
    meta_file.write(reinterpret_cast<const char*>(&metadata.timestamp), sizeof(uint64_t));

    uint32_t checksum_len = static_cast<uint32_t>(metadata.checksum.size());
    meta_file.write(reinterpret_cast<const char*>(&checksum_len), sizeof(uint32_t));
    meta_file.write(metadata.checksum.data(), checksum_len);

    meta_file.close();
    return true;
}

bool SnapshotManager::ReadMetadata(const std::string& path, SnapshotMetadata& metadata) {
    std::ifstream meta_file(path + ".meta", std::ios::binary);
    if (!meta_file.is_open()) {
        return false;
    }

    meta_file.read(reinterpret_cast<char*>(&metadata.last_included_index), sizeof(uint64_t));
    meta_file.read(reinterpret_cast<char*>(&metadata.last_included_term), sizeof(uint64_t));
    meta_file.read(reinterpret_cast<char*>(&metadata.data_size), sizeof(uint64_t));
    meta_file.read(reinterpret_cast<char*>(&metadata.timestamp), sizeof(uint64_t));

    uint32_t checksum_len;
    meta_file.read(reinterpret_cast<char*>(&checksum_len), sizeof(uint32_t));
    std::vector<char> checksum_buf(checksum_len);
    meta_file.read(checksum_buf.data(), checksum_len);
    metadata.checksum.assign(checksum_buf.begin(), checksum_buf.end());

    meta_file.close();
    return true;
}

bool SnapshotManager::CreateSnapshot(StorageEngine* engine,
                                     uint64_t last_included_index,
                                     uint64_t last_included_term,
                                     std::string& snapshot_path) {
    std::lock_guard<std::mutex> lock(mutex_);

    snapshot_path = snapshot_dir_ + "/" + GenerateSnapshotFilename(last_included_index);

    SPDLOG_INFO("Creating snapshot at {} for index {}", snapshot_path, last_included_index);

    std::ofstream data_file(snapshot_path, std::ios::binary | std::ios::trunc);
    if (!data_file.is_open()) {
        SPDLOG_ERROR("Failed to create snapshot file: {}", snapshot_path);
        return false;
    }

    SnapshotMetadata metadata;
    metadata.last_included_index = last_included_index;
    metadata.last_included_term = last_included_term;
    metadata.timestamp = Utils::NowMillis();

    std::string all_data;
    auto it = engine->NewIterator();
    uint64_t count = 0;

    for (; it->Valid(); it->Next()) {
        std::string key = it->Key();
        std::string value = it->Value();

        uint32_t key_len = static_cast<uint32_t>(key.size());
        uint32_t val_len = static_cast<uint32_t>(value.size());

        data_file.write(reinterpret_cast<const char*>(&key_len), sizeof(uint32_t));
        data_file.write(key.data(), key_len);
        data_file.write(reinterpret_cast<const char*>(&val_len), sizeof(uint32_t));
        data_file.write(value.data(), val_len);

        all_data.append(key);
        all_data.append(value);
        count++;
    }

    delete it;
    data_file.close();

    metadata.data_size = fs::file_size(snapshot_path);
    metadata.checksum = ComputeChecksum(all_data);

    if (!WriteMetadata(snapshot_path, metadata)) {
        SPDLOG_ERROR("Failed to write snapshot metadata");
        fs::remove(snapshot_path);
        return false;
    }

    latest_metadata_ = metadata;
    SPDLOG_INFO("Snapshot created successfully: {} entries, {} bytes", count, metadata.data_size);

    return true;
}

bool SnapshotManager::LoadSnapshot(const std::string& snapshot_path,
                                   StorageEngine* engine,
                                   SnapshotMetadata& metadata) {
    std::lock_guard<std::mutex> lock(mutex_);

    SPDLOG_INFO("Loading snapshot from {}", snapshot_path);

    if (!ReadMetadata(snapshot_path, metadata)) {
        SPDLOG_ERROR("Failed to read snapshot metadata");
        return false;
    }

    if (!VerifySnapshotFile(snapshot_path, metadata)) {
        SPDLOG_ERROR("Snapshot verification failed");
        return false;
    }

    std::ifstream data_file(snapshot_path, std::ios::binary);
    if (!data_file.is_open()) {
        SPDLOG_ERROR("Failed to open snapshot data file: {}", snapshot_path);
        return false;
    }

    std::string all_data;
    all_data.reserve(metadata.data_size);

    std::vector<std::pair<std::string, std::string>> kv_pairs;
    kv_pairs.reserve(10000);

    uint64_t count = 0;

    while (data_file.peek() != EOF) {
        uint32_t key_len, val_len;
        data_file.read(reinterpret_cast<char*>(&key_len), sizeof(uint32_t));
        if (data_file.eof()) break;

        std::vector<char> key_buf(key_len);
        data_file.read(key_buf.data(), key_len);
        std::string key(key_buf.begin(), key_buf.end());

        data_file.read(reinterpret_cast<char*>(&val_len), sizeof(uint32_t));
        std::vector<char> val_buf(val_len);
        data_file.read(val_buf.data(), val_len);
        std::string value(val_buf.begin(), val_buf.end());

        kv_pairs.emplace_back(std::move(key), std::move(value));
        count++;
    }

    data_file.close();

    std::string computed_checksum;
    for (const auto& kv : kv_pairs) {
        all_data.append(kv.first);
        all_data.append(kv.second);
    }
    computed_checksum = ComputeChecksum(all_data);

    if (computed_checksum != metadata.checksum) {
        SPDLOG_ERROR("Snapshot checksum mismatch");
        return false;
    }

    SPDLOG_INFO("Parsed {} entries from snapshot, applying to storage engine...", count);

    rocksdb::WriteBatch batch;

    auto it = engine->NewIterator();
    uint64_t delete_count = 0;
    for (; it->Valid(); it->Next()) {
        batch.Delete(it->Key());
        delete_count++;
    }
    delete it;

    SPDLOG_INFO("Deleted {} existing keys", delete_count);

    for (const auto& kv : kv_pairs) {
        batch.Put(kv.first, kv.second);
    }

    if (!engine->WriteBatch(batch)) {
        SPDLOG_ERROR("Failed to apply snapshot to storage engine");
        return false;
    }

    SPDLOG_INFO("Snapshot loaded successfully: {} entries applied", count);
    latest_metadata_ = metadata;
    return true;
}

bool SnapshotManager::ApplySnapshotChunk(const std::string& snapshot_id,
                                        uint64_t offset,
                                        const std::string& data,
                                        bool done) {
    std::lock_guard<std::mutex> lock(mutex_);

    auto it = in_progress_snapshots_.find(snapshot_id);
    if (it == in_progress_snapshots_.end()) {
        std::string path = snapshot_dir_ + "/" + snapshot_id + ".tmp";
        auto& stream = in_progress_snapshots_[snapshot_id];
        stream.open(path, std::ios::binary | std::ios::trunc);
        if (!stream.is_open()) {
            SPDLOG_ERROR("Failed to create snapshot chunk file: {}", path);
            in_progress_snapshots_.erase(snapshot_id);
            return false;
        }
    }

    auto& stream = in_progress_snapshots_[snapshot_id];
    stream.write(data.data(), data.size());

    if (done) {
        stream.close();
    }

    return true;
}

bool SnapshotManager::FinalizeSnapshot(const std::string& snapshot_id,
                                      StorageEngine* engine,
                                      SnapshotMetadata& metadata) {
    std::lock_guard<std::mutex> lock(mutex_);

    auto it = in_progress_snapshots_.find(snapshot_id);
    if (it != in_progress_snapshots_.end()) {
        if (it->second.is_open()) {
            it->second.close();
        }
    }

    std::string tmp_path = snapshot_dir_ + "/" + snapshot_id + ".tmp";
    std::string final_path = snapshot_dir_ + "/" + snapshot_id;

    if (fs::exists(tmp_path)) {
        std::error_code ec;
        fs::rename(tmp_path, final_path, ec);
        if (ec) {
            SPDLOG_ERROR("Failed to rename snapshot from {} to {}: {}", tmp_path, final_path, ec.message());
            fs::remove(tmp_path, ec);
            in_progress_snapshots_.erase(snapshot_id);
            return false;
        }
        SPDLOG_INFO("Snapshot file renamed from {} to {}", tmp_path, final_path);
    } else if (!fs::exists(final_path)) {
        SPDLOG_ERROR("Snapshot file not found: {}", snapshot_id);
        in_progress_snapshots_.erase(snapshot_id);
        return false;
    }

    in_progress_snapshots_.erase(snapshot_id);

    return true;
}

std::string SnapshotManager::GetLatestSnapshot() {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!fs::exists(snapshot_dir_)) {
        return "";
    }

    std::string latest;
    uint64_t latest_index = 0;

    for (const auto& entry : fs::directory_iterator(snapshot_dir_)) {
        if (entry.path().extension() == ".dat") {
            std::string filename = entry.path().filename().string();
            size_t pos = filename.find('_');
            if (pos != std::string::npos) {
                size_t dot_pos = filename.find('.', pos);
                if (dot_pos != std::string::npos) {
                    uint64_t index = std::stoull(filename.substr(pos + 1, dot_pos - pos - 1));
                    if (index > latest_index) {
                        latest_index = index;
                        latest = entry.path().string();
                    }
                }
            }
        }
    }

    return latest;
}

bool SnapshotManager::DeleteOldSnapshots(uint64_t keep_count) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (!fs::exists(snapshot_dir_)) {
        return true;
    }

    std::vector<std::pair<uint64_t, fs::path>> snapshots;

    for (const auto& entry : fs::directory_iterator(snapshot_dir_)) {
        if (entry.path().extension() == ".dat") {
            std::string filename = entry.path().filename().string();
            size_t pos = filename.find('_');
            if (pos != std::string::npos) {
                size_t dot_pos = filename.find('.', pos);
                if (dot_pos != std::string::npos) {
                    uint64_t index = std::stoull(filename.substr(pos + 1, dot_pos - pos - 1));
                    snapshots.push_back({index, entry.path()});
                }
            }
        }
    }

    std::sort(snapshots.begin(), snapshots.end(),
              [](const auto& a, const auto& b) { return a.first > b.first; });

    for (size_t i = keep_count; i < snapshots.size(); ++i) {
        fs::remove(snapshots[i].second);
        fs::remove(snapshots[i].second.string() + ".meta");
        SPDLOG_INFO("Deleted old snapshot: {}", snapshots[i].second.string());
    }

    return true;
}

void SnapshotManager::CleanupIncompleteSnapshots() {
    if (!fs::exists(snapshot_dir_)) {
        return;
    }

    uint64_t cleaned_count = 0;

    for (const auto& entry : fs::directory_iterator(snapshot_dir_)) {
        if (entry.path().extension() == ".tmp") {
            std::string tmp_path = entry.path().string();
            std::error_code ec;
            fs::remove(tmp_path, ec);
            if (!ec) {
                SPDLOG_INFO("Cleaned up incomplete snapshot: {}", tmp_path);
                cleaned_count++;
            } else {
                SPDLOG_WARN("Failed to clean up {}: {}", tmp_path, ec.message());
            }
        }
    }

    for (const auto& entry : fs::directory_iterator(snapshot_dir_)) {
        if (entry.path().extension() == ".dat") {
            std::string dat_path = entry.path().string();
            std::string meta_path = dat_path + ".meta";
            if (!fs::exists(meta_path)) {
                std::error_code ec;
                fs::remove(dat_path, ec);
                if (!ec) {
                    SPDLOG_INFO("Cleaned up orphaned snapshot data: {}", dat_path);
                    cleaned_count++;
                }
            }
        }
    }

    if (cleaned_count > 0) {
        SPDLOG_INFO("Cleaned up {} incomplete snapshot files", cleaned_count);
    }
}

bool SnapshotManager::AbortSnapshot(const std::string& snapshot_id) {
    std::lock_guard<std::mutex> lock(mutex_);

    auto it = in_progress_snapshots_.find(snapshot_id);
    if (it != in_progress_snapshots_.end()) {
        if (it->second.is_open()) {
            it->second.close();
        }
        in_progress_snapshots_.erase(it);
    }

    std::string tmp_path = snapshot_dir_ + "/" + snapshot_id + ".tmp";
    if (fs::exists(tmp_path)) {
        std::error_code ec;
        fs::remove(tmp_path, ec);
        if (ec) {
            SPDLOG_WARN("Failed to remove tmp file {}: {}", tmp_path, ec.message());
            return false;
        }
        SPDLOG_INFO("Aborted snapshot {}, removed tmp file", snapshot_id);
    }

    return true;
}

bool SnapshotManager::VerifySnapshotFile(const std::string& snapshot_path, const SnapshotMetadata& metadata) {
    if (!fs::exists(snapshot_path)) {
        SPDLOG_ERROR("Snapshot file not found: {}", snapshot_path);
        return false;
    }

    uint64_t file_size = fs::file_size(snapshot_path);
    if (file_size != metadata.data_size) {
        SPDLOG_ERROR("Snapshot size mismatch: expected {}, got {}", metadata.data_size, file_size);
        return false;
    }

    std::string meta_path = snapshot_path + ".meta";
    if (!fs::exists(meta_path)) {
        SPDLOG_ERROR("Snapshot metadata file not found: {}", meta_path);
        return false;
    }

    SnapshotMetadata stored_meta;
    if (!ReadMetadata(snapshot_path, stored_meta)) {
        SPDLOG_ERROR("Failed to read snapshot metadata");
        return false;
    }

    if (stored_meta.last_included_index != metadata.last_included_index ||
        stored_meta.last_included_term != metadata.last_included_term ||
        stored_meta.checksum != metadata.checksum ||
        stored_meta.data_size != metadata.data_size) {
        SPDLOG_ERROR("Snapshot metadata mismatch");
        return false;
    }

    SPDLOG_INFO("Snapshot file verified: index={}, size={}",
               metadata.last_included_index, file_size);
    return true;
}

} 
