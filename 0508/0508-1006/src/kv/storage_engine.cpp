#include "kv/storage_engine.h"

namespace paxoskv {

StorageEngine::StorageEngine() = default;

StorageEngine::~StorageEngine() {
    Close();
}

bool StorageEngine::Init(const std::string& db_path) {
    db_path_ = db_path;
    options_.create_if_missing = true;
    options_.create_missing_column_families = true;
    options_.optimize_level_style_compaction();
    options_.IncreaseParallelism();
    options_.OptimizeLevelStyleCompaction();

    rocksdb::Status s = rocksdb::DB::Open(options_, db_path_, &db_);
    if (!s.ok()) {
        SPDLOG_ERROR("Failed to open RocksDB at {}: {}", db_path_, s.ToString());
        return false;
    }
    SPDLOG_INFO("RocksDB initialized at {}", db_path_);
    return true;
}

void StorageEngine::Close() {
    if (db_) {
        delete db_;
        db_ = nullptr;
        SPDLOG_INFO("RocksDB closed");
    }
}

bool StorageEngine::Put(const std::string& key, const std::string& value) {
    rocksdb::WriteOptions write_opts;
    write_opts.sync = true;
    rocksdb::Status s = db_->Put(write_opts, key, value);
    if (!s.ok()) {
        SPDLOG_ERROR("Put failed: {}", s.ToString());
        return false;
    }
    return true;
}

std::optional<std::string> StorageEngine::Get(const std::string& key) {
    std::string value;
    rocksdb::ReadOptions read_opts;
    rocksdb::Status s = db_->Get(read_opts, key, &value);
    if (s.IsNotFound()) {
        return std::nullopt;
    }
    if (!s.ok()) {
        SPDLOG_ERROR("Get failed: {}", s.ToString());
        return std::nullopt;
    }
    return value;
}

bool StorageEngine::Delete(const std::string& key) {
    rocksdb::WriteOptions write_opts;
    write_opts.sync = true;
    rocksdb::Status s = db_->Delete(write_opts, key);
    if (!s.ok()) {
        SPDLOG_ERROR("Delete failed: {}", s.ToString());
        return false;
    }
    return true;
}

bool StorageEngine::MultiPut(const std::vector<std::pair<std::string, std::string>>& kvs) {
    rocksdb::WriteBatch batch;
    for (const auto& kv : kvs) {
        batch.Put(kv.first, kv.second);
    }
    rocksdb::WriteOptions write_opts;
    write_opts.sync = true;
    rocksdb::Status s = db_->Write(write_opts, &batch);
    if (!s.ok()) {
        SPDLOG_ERROR("MultiPut failed: {}", s.ToString());
        return false;
    }
    return true;
}

bool StorageEngine::MultiDelete(const std::vector<std::string>& keys) {
    rocksdb::WriteBatch batch;
    for (const auto& key : keys) {
        batch.Delete(key);
    }
    rocksdb::WriteOptions write_opts;
    write_opts.sync = true;
    rocksdb::Status s = db_->Write(write_opts, &batch);
    if (!s.ok()) {
        SPDLOG_ERROR("MultiDelete failed: {}", s.ToString());
        return false;
    }
    return true;
}

bool StorageEngine::WriteBatch(rocksdb::WriteBatch& batch) {
    rocksdb::WriteOptions write_opts;
    write_opts.sync = true;
    rocksdb::Status s = db_->Write(write_opts, &batch);
    if (!s.ok()) {
        SPDLOG_ERROR("WriteBatch failed: {}", s.ToString());
        return false;
    }
    return true;
}

StorageEngine::Iterator* StorageEngine::NewIterator() {
    rocksdb::ReadOptions read_opts;
    auto* it = db_->NewIterator(read_opts);
    return new Iterator(it);
}

uint64_t StorageEngine::GetApproximateSize() {
    if (!db_) return 0;

    uint64_t size = 0;
    std::string start, end;
    auto range = rocksdb::Range(rocksdb::Slice(), rocksdb::Slice("\xff"));
    db_->GetApproximateSizes(&range, 1, &size);
    return size;
}

} 
