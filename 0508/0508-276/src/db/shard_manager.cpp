#include "shard_manager.h"
#include <filesystem>
#include <algorithm>
#include <set>

namespace vectordb {

namespace fs = std::filesystem;

ShardManager::ShardManager(const std::string& base_data_dir)
  : base_data_dir_(base_data_dir) {
  fs::create_directories(base_data_dir_);
}

ShardManager::~ShardManager() {
  SaveAll();
}

std::string ShardManager::GetCollectionDir(const std::string& collection_name) const {
  return base_data_dir_ + "/" + collection_name;
}

uint32_t ShardManager::GetShardId(uint64_t vector_id, uint32_t shard_count) const {
  return Shard::HashId(vector_id) % shard_count;
}

bool ShardManager::CreateCollection(const CollectionConfig& config) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (collections_.count(config.name) > 0) {
    return false;
  }

  std::string collection_dir = GetCollectionDir(config.name);
  fs::create_directories(collection_dir);

  std::vector<std::unique_ptr<Shard>> shards;
  for (uint32_t i = 0; i < config.shard_count; ++i) {
    shards.push_back(std::make_unique<Shard>(i, config, collection_dir));
  }

  collections_[config.name] = std::move(shards);
  collection_configs_[config.name] = config;

  return true;
}

bool ShardManager::DropCollection(const std::string& collection_name) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (collections_.count(collection_name) == 0) {
    return false;
  }

  collections_.erase(collection_name);
  collection_configs_.erase(collection_name);

  std::string collection_dir = GetCollectionDir(collection_name);
  fs::remove_all(collection_dir);

  return true;
}

bool ShardManager::Insert(const std::string& collection_name, uint64_t vector_id, const std::vector<float>& vec) {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = collections_.find(collection_name);
  if (it == collections_.end()) {
    return false;
  }

  const auto& config = collection_configs_[collection_name];
  uint32_t shard_id = GetShardId(vector_id, config.shard_count);
  return it->second[shard_id]->Insert(vector_id, vec);
}

bool ShardManager::Delete(const std::string& collection_name, uint64_t vector_id) {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = collections_.find(collection_name);
  if (it == collections_.end()) {
    return false;
  }

  const auto& config = collection_configs_[collection_name];
  uint32_t shard_id = GetShardId(vector_id, config.shard_count);
  return it->second[shard_id]->Delete(vector_id);
}

bool ShardManager::Update(const std::string& collection_name, uint64_t vector_id, const std::vector<float>& vec) {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = collections_.find(collection_name);
  if (it == collections_.end()) {
    return false;
  }

  const auto& config = collection_configs_[collection_name];
  uint32_t shard_id = GetShardId(vector_id, config.shard_count);
  return it->second[shard_id]->Update(vector_id, vec);
}

std::vector<SearchResult> ShardManager::Search(const std::string& collection_name,
                                                const std::vector<float>& query, uint32_t top_k) {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = collections_.find(collection_name);
  if (it == collections_.end()) {
    return {};
  }

  std::vector<SearchResult> all_results;
  for (auto& shard : it->second) {
    auto shard_results = shard->Search(query, top_k);
    all_results.insert(all_results.end(), shard_results.begin(), shard_results.end());
  }

  std::sort(all_results.begin(), all_results.end());
  if (all_results.size() > top_k) {
    all_results.resize(top_k);
  }

  return all_results;
}

bool ShardManager::InsertBatch(const std::string& collection_name, const std::vector<Vector>& vectors) {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = collections_.find(collection_name);
  if (it == collections_.end()) {
    return false;
  }

  const auto& config = collection_configs_[collection_name];

  for (const auto& vec : vectors) {
    uint32_t shard_id = GetShardId(vec.id, config.shard_count);
    it->second[shard_id]->Insert(vec.id, vec.values);
  }

  return true;
}

bool ShardManager::TrainCollection(const std::string& collection_name,
                                    const std::vector<std::vector<float>>& training_data) {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = collections_.find(collection_name);
  if (it == collections_.end()) {
    return false;
  }

  for (auto& shard : it->second) {
    if (!shard->Train(training_data)) {
      return false;
    }
  }

  return true;
}

bool ShardManager::CollectionExists(const std::string& collection_name) const {
  std::lock_guard<std::mutex> lock(mutex_);
  return collections_.count(collection_name) > 0;
}

size_t ShardManager::GetCollectionSize(const std::string& collection_name) const {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = collections_.find(collection_name);
  if (it == collections_.end()) {
    return 0;
  }

  size_t total = 0;
  for (const auto& shard : it->second) {
    total += shard->Size();
  }

  return total;
}

bool ShardManager::SaveCollection(const std::string& collection_name) {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = collections_.find(collection_name);
  if (it == collections_.end()) {
    return false;
  }

  for (auto& shard : it->second) {
    if (!shard->Save()) {
      return false;
    }
  }

  return true;
}

bool ShardManager::LoadCollection(const std::string& collection_name) {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = collections_.find(collection_name);
  if (it == collections_.end()) {
    return false;
  }

  for (auto& shard : it->second) {
    if (!shard->Load()) {
      return false;
    }
  }

  return true;
}

void ShardManager::SaveAll() {
  std::lock_guard<std::mutex> lock(mutex_);
  for (auto& [name, shards] : collections_) {
    for (auto& shard : shards) {
      shard->Save();
    }
  }
}

void ShardManager::LoadAll() {
}

}
