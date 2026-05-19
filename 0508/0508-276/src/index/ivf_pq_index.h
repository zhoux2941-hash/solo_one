#pragma once

#include "vector_index.h"
#include "../common/distance.h"
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <mutex>
#include <random>

namespace vectordb {

class IVFPQIndex : public VectorIndex {
public:
  struct Config {
    uint32_t dimension;
    DistanceMetric distance_metric;
    uint32_t nlist = 256;
    uint32_t m = 16;
    uint32_t nbits = 8;
    uint32_t nprobe = 100;
    bool use_residual = true;
  };

  explicit IVFPQIndex(const Config& config);
  ~IVFPQIndex() override;

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

  bool Train(const std::vector<std::vector<float>>& training_data);
  bool IsTrained() const { return trained_; }

private:
  uint32_t FindNearestCentroid(const std::vector<float>& vec) const;
  std::vector<float> ComputeResidual(const std::vector<float>& vec,
                                      const std::vector<float>& centroid) const;
  std::vector<uint8_t> EncodePQ(const std::vector<float>& vec) const;
  float DecodeAndDistance(const std::vector<uint8_t>& code,
                           const std::vector<float>& query_residual) const;
  void KMeans(const std::vector<std::vector<float>>& data, uint32_t k,
              std::vector<std::vector<float>>& centroids, int max_iter);
  void TrainPQ(const std::vector<std::vector<float>>& data);

  Config config_;
  std::vector<std::vector<float>> centroids_;
  std::vector<std::vector<std::vector<float>>> pq_centroids_;
  std::unordered_map<uint64_t, std::pair<uint32_t, std::vector<uint8_t>>> id_to_code_;
  std::vector<std::vector<uint64_t>> inverted_lists_;
  std::unordered_map<uint64_t, std::vector<float>> original_vectors_;
  std::unordered_set<uint64_t> deleted_ids_;
  bool trained_;
  uint32_t ksub_;
  uint32_t dsub_;
  mutable std::mutex mutex_;
  std::mt19937 rng_;
};

}
