#pragma once

#include <string>
#include <memory>
#include <optional>
#include <rocksdb/db.h>
#include <rocksdb/options.h>
#include <rocksdb/slice.h>
#include <rocksdb/write_batch.h>
#include <spdlog/spdlog.h>

namespace paxoskv {

class StorageEngine {
public:
    StorageEngine();
    ~StorageEngine();

    bool Init(const std::string& db_path);
    void Close();

    bool Put(const std::string& key, const std::string& value);
    std::optional<std::string> Get(const std::string& key);
    bool Delete(const std::string& key);
    bool MultiPut(const std::vector<std::pair<std::string, std::string>>& kvs);
    bool MultiDelete(const std::vector<std::string>& keys);

    bool WriteBatch(rocksdb::WriteBatch& batch);

    class Iterator {
    public:
        Iterator(rocksdb::Iterator* it) : iter_(it) { iter_->SeekToFirst(); }
        ~Iterator() { delete iter_; }

        bool Valid() const { return iter_->Valid(); }
        void Next() { iter_->Next(); }
        void Prev() { iter_->Prev(); }
        void SeekToFirst() { iter_->SeekToFirst(); }
        void SeekToLast() { iter_->SeekToLast(); }
        std::string Key() const { return iter_->key().ToString(); }
        std::string Value() const { return iter_->value().ToString(); }
        bool status() const { return iter_->status().ok(); }

    private:
        rocksdb::Iterator* iter_;
    };

    Iterator* NewIterator();

    rocksdb::DB* GetDB() { return db_; }

    uint64_t GetApproximateSize();

private:
    rocksdb::DB* db_ = nullptr;
    rocksdb::Options options_;
    std::string db_path_;
};

} 
