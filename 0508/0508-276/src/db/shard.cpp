#include "shard.h"
#include <filesystem>
#include <algorithm>

namespace vectordb {

namespace fs = std::filesystem;

Shard::Shard(uint32_t id, const CollectionConfig& config, const std::string& data_dir)
  : id_(id), config_(config), data_dir_(data_dir), shard_count_(config.shard_count) {
  fs::create_directories(data_dir_);

  if (config_.index_type == IndexType::HNSW) {
    HNSWIndex::Config hnsw_config;
    hnsw_config.dimension = config_.dimension;
    hnsw_config.distance_metric = config_.distance_metric;
    hnsw_config.m = 16;
    hnsw_config.ef_construction = 200;
    hnsw_config.ef_search = 50;
    index_ = std::make_unique<HNSWIndex>(hnsw_config);
  } else if (config_.index_type == IndexType::IVF_PQ) {
    IVFPQIndex::Config ivf_config;
    ivf_config.dimension = config_.dimension;
    ivf_config.distance_metric = config_.distance_metric;
    ivf_config.nlist = 1024;
    ivf_config.m = 8;
    ivf_config.nbits = 8;
    ivf_config.nprobe = 10;
    index_ = std::make_unique<IVFPQIndex>(ivf_config);
  }
}

Shard::~Shard() {
  Save();
}

uint32_t Shard::HashId(uint64_t id) {
  uint64_t hash = id;
  hash ^= hash >> 33;
  hash *= 0xff51afd7ed558ccdULL;
  hash ^= hash >> 33;
  hash *= 0xc4ceb9fe1a85ec53ULL;
  hash ^= hash >> 33;
  return static_cast<uint32_t>(hash);
}

bool Shard::BelongsToShard(uint64_t vector_id) const {
  return (HashId(vector_id) % shard_count_) == id_;
}

std::string Shard::GetIndexPath() const {
  return data_dir_ + "/shard_" + std::to_string(id_) + ".index";
}

bool Shard::Insert(uint64_t vector_id, const std::vector<float>& vec) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (!index_) return false;
  return index_->Insert(vector_id, vec);
}

bool Shard::Delete(uint64_t vector_id) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (!index_) return false;
  return index_->Delete(vector_id);
}

bool Shard::Update(uint64_t vector_id, const std::vector<float>& vec) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (!index_) return false;
  return index_->Update(vector_id, vec);
}

std::vector<SearchResult> Shard::Search(const std::vector<float>& query, uint32_t top_k) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (!index_) return {};
  return index_->Search(query, top_k);
}

bool Shard::Train(const std::vector<std::vector<float>>& training_data) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (!index_) return false;
  if (config_.index_type == IndexType::IVF_PQ) {
    auto* ivf_index = static_cast<IVFPQIndex*>(index_.get());
    if (!ivf_index->IsTrained()) {
      return ivf_index->Train(training_data);
    }
  }
  return true;
}

bool Shard::Save() {
  std::lock_guard<std::mutex> lock(mutex_);
  if (!index_) return false;
  return index_->Save(GetIndexPath());
}

bool Shard::Load() {
  std::lock_guard<std::mutex> lock(mutex_);
  if (!index_) return false;
  return index_->Load(GetIndexPath());
}

size_t Shard::Size() const {
  std::lock_guard<std::mutex> lock(mutex_);
  if (!index_) return 0;
  return index_->Size();
}

}
