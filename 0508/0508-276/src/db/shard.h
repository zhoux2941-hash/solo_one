#pragma once

#include "../index/vector_index.h"
#include "../index/hnsw_index.h"
#include "../index/ivf_pq_index.h"
#include "../common/types.h"
#include <memory>
#include <string>
#include <vector>
#include <mutex>

namespace vectordb {

class Shard {
public:
  Shard(uint32_t id, const CollectionConfig& config, const std::string& data_dir);
  ~Shard();

  bool Insert(uint64_t vector_id, const std::vector<float>& vec);
  bool Delete(uint64_t vector_id);
  bool Update(uint64_t vector_id, const std::vector<float>& vec);
  std::vector<SearchResult> Search(const std::vector<float>& query, uint32_t top_k);

  bool Train(const std::vector<std::vector<float>>& training_data);
  bool Save();
  bool Load();

  uint32_t Id() const { return id_; }
  size_t Size() const;
  uint32_t Dimension() const { return config_.dimension; }

  bool BelongsToShard(uint64_t vector_id) const;

private:
  std::string GetIndexPath() const;
  static uint32_t HashId(uint64_t id);

  uint32_t id_;
  CollectionConfig config_;
  std::string data_dir_;
  std::unique_ptr<VectorIndex> index_;
  mutable std::mutex mutex_;
  uint32_t shard_count_;
};

}
