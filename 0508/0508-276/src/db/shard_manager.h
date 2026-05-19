#pragma once

#include "shard.h"
#include "../common/types.h"
#include <vector>
#include <memory>
#include <string>
#include <mutex>
#include <unordered_map>

namespace vectordb {

class ShardManager {
public:
  ShardManager(const std::string& base_data_dir);
  ~ShardManager();

  bool CreateCollection(const CollectionConfig& config);
  bool DropCollection(const std::string& collection_name);

  bool Insert(const std::string& collection_name, uint64_t vector_id, const std::vector<float>& vec);
  bool Delete(const std::string& collection_name, uint64_t vector_id);
  bool Update(const std::string& collection_name, uint64_t vector_id, const std::vector<float>& vec);
  std::vector<SearchResult> Search(const std::string& collection_name, const std::vector<float>& query, uint32_t top_k);

  bool InsertBatch(const std::string& collection_name, const std::vector<Vector>& vectors);

  bool TrainCollection(const std::string& collection_name, const std::vector<std::vector<float>>& training_data);

  bool CollectionExists(const std::string& collection_name) const;
  size_t GetCollectionSize(const std::string& collection_name) const;

  bool SaveCollection(const std::string& collection_name);
  bool LoadCollection(const std::string& collection_name);

  void SaveAll();
  void LoadAll();

private:
  std::string GetCollectionDir(const std::string& collection_name) const;
  uint32_t GetShardId(uint64_t vector_id, uint32_t shard_count) const;

  std::string base_data_dir_;
  std::unordered_map<std::string, std::vector<std::unique_ptr<Shard>>> collections_;
  std::unordered_map<std::string, CollectionConfig> collection_configs_;
  mutable std::mutex mutex_;
};

}
