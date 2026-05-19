#pragma once

#include "vector_index.h"
#include "../common/distance.h"
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <random>
#include <mutex>
#include <cmath>

namespace vectordb {

struct HNSWNode {
  uint64_t id;
  std::vector<float> vec;
  std::vector<std::vector<uint32_t>> neighbors;

  HNSWNode() : id(0) {}
  HNSWNode(uint64_t id, std::vector<float> vec, size_t max_level)
    : id(id), vec(std::move(vec)), neighbors(max_level + 1) {}
};

class HNSWIndex : public VectorIndex {
public:
  struct Config {
    uint32_t dimension;
    DistanceMetric distance_metric;
    uint32_t m = 16;
    uint32_t m_max = 32;
    uint32_t ef_construction = 200;
    uint32_t ef_search = 50;
    bool use_heuristic = true;
  };

  explicit HNSWIndex(const Config& config);
  ~HNSWIndex() override;

  bool Insert(uint64_t id, const std::vector<float>& vec) override;
  bool Delete(uint64_t id) override;
  bool Update(uint64_t id, const std::vector<float>& vec) override;
  std::vector<SearchResult> Search(const std::vector<float>& query, uint32_t top_k) override;

  size_t Size() const override;
  uint32_t Dimension() const override;
  DistanceMetric GetDistanceMetric() const override;
  size_t EstimateMemoryUsage() const override;

  bool Save(const std::string& path) const override;
  bool Load(const std::string& path) override;

private:
  int RandomLevel();
  std::vector<uint32_t> SearchLayer(const std::vector<float>& vec, uint32_t ep, int level, uint32_t ef);
  void Connect(uint32_t node_idx, uint32_t neighbor_idx, int level);
  void ShrinkNeighbors(uint32_t node_idx, int level, uint32_t max_neighbors);
  void SelectNeighborsHeuristic(const std::vector<float>& query, const std::vector<uint32_t>& candidates,
                                 std::vector<uint32_t>& result, uint32_t m, int level, bool keep_pruned);

  Config config_;
  std::vector<HNSWNode> nodes_;
  std::unordered_map<uint64_t, uint32_t> id_to_idx_;
  std::unordered_set<uint64_t> deleted_ids_;
  int max_level_;
  uint32_t enter_point_;
  std::mt19937 rng_;
  float level_multiplier_;
  mutable std::mutex mutex_;
};

}
