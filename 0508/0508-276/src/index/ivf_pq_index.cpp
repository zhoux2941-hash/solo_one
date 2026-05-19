#include "ivf_pq_index.h"
#include "../common/vector.h"
#include <algorithm>
#include <fstream>
#include <cmath>
#include <limits>
#include <queue>

namespace vectordb {

IVFPQIndex::IVFPQIndex(const Config& config)
  : config_(config), trained_(false), rng_(std::random_device{}()) {
  ksub_ = 1 << config_.nbits;
  dsub_ = config_.dimension / config_.m;
  inverted_lists_.resize(config_.nlist);
}

IVFPQIndex::~IVFPQIndex() = default;

uint32_t IVFPQIndex::FindNearestCentroid(const std::vector<float>& vec) const {
  uint32_t nearest = 0;
  float min_dist = std::numeric_limits<float>::max();
  for (uint32_t i = 0; i < centroids_.size(); ++i) {
    float dist = Distance::Compute(config_.distance_metric, vec, centroids_[i]);
    if (dist < min_dist) {
      min_dist = dist;
      nearest = i;
    }
  }
  return nearest;
}

std::vector<float> IVFPQIndex::ComputeResidual(const std::vector<float>& vec,
                                                const std::vector<float>& centroid) const {
  std::vector<float> residual(vec.size());
  for (size_t i = 0; i < vec.size(); ++i) {
    residual[i] = vec[i] - centroid[i];
  }
  return residual;
}

std::vector<uint8_t> IVFPQIndex::EncodePQ(const std::vector<float>& vec) const {
  std::vector<uint8_t> code(config_.m);
  for (uint32_t m = 0; m < config_.m; ++m) {
    uint32_t start = m * dsub_;
    float min_dist = std::numeric_limits<float>::max();
    uint8_t best = 0;
    for (uint32_t k = 0; k < ksub_; ++k) {
      float dist = 0.0f;
      for (uint32_t d = 0; d < dsub_; ++d) {
        float diff = vec[start + d] - pq_centroids_[m][k][d];
        dist += diff * diff;
      }
      if (dist < min_dist) {
        min_dist = dist;
        best = static_cast<uint8_t>(k);
      }
    }
    code[m] = best;
  }
  return code;
}

float IVFPQIndex::DecodeAndDistance(const std::vector<uint8_t>& code,
                                     const std::vector<float>& query_residual) const {
  float dist = 0.0f;
  for (uint32_t m = 0; m < config_.m; ++m) {
    uint32_t start = m * dsub_;
    uint8_t k = code[m];
    for (uint32_t d = 0; d < dsub_; ++d) {
      float diff = query_residual[start + d] - pq_centroids_[m][k][d];
      dist += diff * diff;
    }
  }
  return std::sqrt(dist);
}

void IVFPQIndex::KMeans(const std::vector<std::vector<float>>& data, uint32_t k,
                        std::vector<std::vector<float>>& centroids, int max_iter) {
  if (data.empty()) return;

  uint32_t dim = data[0].size();
  centroids.resize(k);

  std::uniform_int_distribution<size_t> dist(0, data.size() - 1);
  std::unordered_set<size_t> used;
  for (uint32_t i = 0; i < k; ++i) {
    size_t idx;
    do {
      idx = dist(rng_);
    } while (used.count(idx) > 0 && used.size() < data.size());
    used.insert(idx);
    centroids[i] = data[idx];
  }

  for (int iter = 0; iter < max_iter; ++iter) {
    std::vector<std::vector<float>> new_centroids(k, std::vector<float>(dim, 0.0f));
    std::vector<uint32_t> counts(k, 0);

    for (const auto& vec : data) {
      uint32_t nearest = 0;
      float min_dist = std::numeric_limits<float>::max();
      for (uint32_t i = 0; i < k; ++i) {
        float d = Distance::Euclidean(vec, centroids[i]);
        if (d < min_dist) {
          min_dist = d;
          nearest = i;
        }
      }
      for (uint32_t d = 0; d < dim; ++d) {
        new_centroids[nearest][d] += vec[d];
      }
      counts[nearest]++;
    }

    for (uint32_t i = 0; i < k; ++i) {
      if (counts[i] > 0) {
        float inv = 1.0f / counts[i];
        for (uint32_t d = 0; d < dim; ++d) {
          new_centroids[i][d] *= inv;
        }
      }
    }

    centroids = std::move(new_centroids);
  }
}

void IVFPQIndex::TrainPQ(const std::vector<std::vector<float>>& data) {
  pq_centroids_.resize(config_.m);
  for (uint32_t m = 0; m < config_.m; ++m) {
    std::vector<std::vector<float>> subvectors;
    uint32_t start = m * dsub_;
    for (const auto& vec : data) {
      std::vector<float> sub(dsub_);
      for (uint32_t d = 0; d < dsub_; ++d) {
        sub[d] = vec[start + d];
      }
      subvectors.push_back(std::move(sub));
    }
    KMeans(subvectors, ksub_, pq_centroids_[m], 50);
  }
}

bool IVFPQIndex::Train(const std::vector<std::vector<float>>& training_data) {
  auto start = std::chrono::high_resolution_clock::now();
  std::lock_guard<std::mutex> lock(mutex_);
  if (training_data.empty()) {
    return false;
  }

  std::vector<std::vector<float>> normalized_data;
  if (config_.distance_metric == DistanceMetric::COSINE) {
    for (const auto& vec : training_data) {
      normalized_data.push_back(VectorUtils::Normalized(vec));
    }
  } else {
    normalized_data = training_data;
  }

  KMeans(normalized_data, config_.nlist, centroids_, 100);

  if (config_.use_residual) {
    std::vector<std::vector<float>> residuals;
    for (const auto& vec : normalized_data) {
      uint32_t centroid_id = FindNearestCentroid(vec);
      residuals.push_back(ComputeResidual(vec, centroids_[centroid_id]));
    }
    TrainPQ(residuals);
  } else {
    TrainPQ(normalized_data);
  }

  trained_ = true;

  auto end = std::chrono::high_resolution_clock::now();
  double duration_ms = std::chrono::duration<double, std::milli>(end - start).count();
  PerfMonitor::Instance().SetCurrentMetricName(metric_name_);
  PerfMonitor::Instance().RecordBuildTime(duration_ms);

  return true;
}

bool IVFPQIndex::Insert(uint64_t id, const std::vector<float>& vec) {
  auto start = std::chrono::high_resolution_clock::now();
  std::lock_guard<std::mutex> lock(mutex_);
  if (!trained_ || vec.size() != config_.dimension) {
    return false;
  }

  if (id_to_code_.count(id) > 0 && deleted_ids_.count(id) == 0) {
    return false;
  }

  std::vector<float> normalized_vec = vec;
  if (config_.distance_metric == DistanceMetric::COSINE) {
    VectorUtils::Normalize(normalized_vec);
  }

  uint32_t centroid_id = FindNearestCentroid(normalized_vec);

  std::vector<uint8_t> code;
  if (config_.use_residual) {
    std::vector<float> residual = ComputeResidual(normalized_vec, centroids_[centroid_id]);
    code = EncodePQ(residual);
  } else {
    code = EncodePQ(normalized_vec);
  }

  id_to_code_[id] = {centroid_id, code};
  inverted_lists_[centroid_id].push_back(id);
  original_vectors_[id] = normalized_vec;
  deleted_ids_.erase(id);

  auto end = std::chrono::high_resolution_clock::now();
  double duration_ms = std::chrono::duration<double, std::milli>(end - start).count();
  PerfMonitor::Instance().SetCurrentMetricName(metric_name_);
  PerfMonitor::Instance().RecordInsert(1, duration_ms);

  return true;
}

bool IVFPQIndex::Delete(uint64_t id) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (id_to_code_.count(id) == 0) {
    return false;
  }
  deleted_ids_.insert(id);
  return true;
}

bool IVFPQIndex::Update(uint64_t id, const std::vector<float>& vec) {
  if (!Delete(id)) {
    return false;
  }
  return Insert(id, vec);
}

std::vector<SearchResult> IVFPQIndex::Search(const std::vector<float>& query, uint32_t top_k) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (!trained_ || query.size() != config_.dimension) {
    return {};
  }

  std::vector<float> normalized_query = query;
  if (config_.distance_metric == DistanceMetric::COSINE) {
    VectorUtils::Normalize(normalized_query);
  }

  std::vector<std::pair<float, uint32_t>> centroid_distances;
  for (uint32_t i = 0; i < centroids_.size(); ++i) {
    float dist = Distance::Compute(config_.distance_metric, normalized_query, centroids_[i]);
    centroid_distances.emplace_back(dist, i);
  }
  std::sort(centroid_distances.begin(), centroid_distances.end());

  uint32_t nprobe = std::min(config_.nprobe, static_cast<uint32_t>(centroid_distances.size()));

  std::vector<uint64_t> candidate_ids;
  for (uint32_t i = 0; i < nprobe; ++i) {
    uint32_t centroid_id = centroid_distances[i].second;
    for (uint64_t id : inverted_lists_[centroid_id]) {
      if (deleted_ids_.count(id) == 0) {
        candidate_ids.push_back(id);
      }
    }
  }

  const uint32_t rerank_k = std::min(static_cast<uint32_t>(candidate_ids.size()), top_k * 10);

  std::vector<std::pair<float, uint64_t>> pq_results;
  pq_results.reserve(candidate_ids.size());

  for (uint64_t id : candidate_ids) {
    auto it = id_to_code_.find(id);
    if (it != id_to_code_.end()) {
      float dist;
      if (config_.use_residual) {
        uint32_t centroid_id = it->second.first;
        std::vector<float> query_residual = ComputeResidual(normalized_query, centroids_[centroid_id]);
        dist = DecodeAndDistance(it->second.second, query_residual);
      } else {
        dist = DecodeAndDistance(it->second.second, normalized_query);
      }
      pq_results.emplace_back(dist, id);
    }
  }

  std::partial_sort(pq_results.begin(),
                    pq_results.begin() + std::min(rerank_k, static_cast<uint32_t>(pq_results.size())),
                    pq_results.end());

  std::vector<SearchResult> final_results;
  final_results.reserve(top_k);

  uint32_t re_rank_count = std::min(rerank_k, static_cast<uint32_t>(pq_results.size()));
  for (uint32_t i = 0; i < re_rank_count; ++i) {
    uint64_t id = pq_results[i].second;
    auto vec_it = original_vectors_.find(id);
    if (vec_it != original_vectors_.end()) {
      float exact_dist = Distance::Compute(config_.distance_metric, normalized_query, vec_it->second);
      final_results.emplace_back(id, exact_dist);
    }
  }

  std::sort(final_results.begin(), final_results.end());
  if (final_results.size() > top_k) {
    final_results.resize(top_k);
  }

  auto end = std::chrono::high_resolution_clock::now();
  double duration_ms = std::chrono::duration<double, std::milli>(end - start).count();
  PerfMonitor::Instance().SetCurrentMetricName(metric_name_);
  PerfMonitor::Instance().RecordSearch(1, duration_ms);

  return final_results;
}

size_t IVFPQIndex::EstimateMemoryUsage() const {
  std::lock_guard<std::mutex> lock(mutex_);
  size_t total = 0;

  for (const auto& centroid : centroids_) {
    total += centroid.capacity() * sizeof(float);
  }

  for (const auto& pq_m : pq_centroids_) {
    for (const auto& centroid : pq_m) {
      total += centroid.capacity() * sizeof(float);
    }
  }

  for (const auto& [id, code_pair] : id_to_code_) {
    total += sizeof(uint64_t) + sizeof(uint32_t) + code_pair.second.capacity();
  }

  for (const auto& list : inverted_lists_) {
    total += list.capacity() * sizeof(uint64_t);
  }

  for (const auto& [id, vec] : original_vectors_) {
    total += sizeof(uint64_t) + vec.capacity() * sizeof(float);
  }

  total += deleted_ids_.size() * sizeof(uint64_t);

  return total;
}

size_t IVFPQIndex::Size() const {
  std::lock_guard<std::mutex> lock(mutex_);
  return id_to_code_.size() - deleted_ids_.size();
}

uint32_t IVFPQIndex::Dimension() const {
  return config_.dimension;
}

DistanceMetric IVFPQIndex::GetDistanceMetric() const {
  return config_.distance_metric;
}

bool IVFPQIndex::Save(const std::string& path) const {
  std::lock_guard<std::mutex> lock(mutex_);
  std::ofstream ofs(path, std::ios::binary);
  if (!ofs) return false;

  ofs.write(reinterpret_cast<const char*>(&config_.dimension), sizeof(config_.dimension));
  ofs.write(reinterpret_cast<const char*>(&config_.distance_metric), sizeof(config_.distance_metric));
  ofs.write(reinterpret_cast<const char*>(&config_.nlist), sizeof(config_.nlist));
  ofs.write(reinterpret_cast<const char*>(&config_.m), sizeof(config_.m));
  ofs.write(reinterpret_cast<const char*>(&config_.nbits), sizeof(config_.nbits));
  ofs.write(reinterpret_cast<const char*>(&config_.nprobe), sizeof(config_.nprobe));
  ofs.write(reinterpret_cast<const char*>(&config_.use_residual), sizeof(config_.use_residual));
  ofs.write(reinterpret_cast<const char*>(&trained_), sizeof(trained_));

  size_t num_centroids = centroids_.size();
  ofs.write(reinterpret_cast<const char*>(&num_centroids), sizeof(num_centroids));
  for (const auto& centroid : centroids_) {
    size_t size = centroid.size();
    ofs.write(reinterpret_cast<const char*>(&size), sizeof(size));
    ofs.write(reinterpret_cast<const char*>(centroid.data()), size * sizeof(float));
  }

  size_t num_pq_m = pq_centroids_.size();
  ofs.write(reinterpret_cast<const char*>(&num_pq_m), sizeof(num_pq_m));
  for (const auto& m_centroids : pq_centroids_) {
    size_t num_k = m_centroids.size();
    ofs.write(reinterpret_cast<const char*>(&num_k), sizeof(num_k));
    for (const auto& centroid : m_centroids) {
      size_t size = centroid.size();
      ofs.write(reinterpret_cast<const char*>(&size), sizeof(size));
      ofs.write(reinterpret_cast<const char*>(centroid.data()), size * sizeof(float));
    }
  }

  size_t num_codes = id_to_code_.size();
  ofs.write(reinterpret_cast<const char*>(&num_codes), sizeof(num_codes));
  for (const auto& [id, code_pair] : id_to_code_) {
    ofs.write(reinterpret_cast<const char*>(&id), sizeof(id));
    ofs.write(reinterpret_cast<const char*>(&code_pair.first), sizeof(code_pair.first));
    size_t code_size = code_pair.second.size();
    ofs.write(reinterpret_cast<const char*>(&code_size), sizeof(code_size));
    ofs.write(reinterpret_cast<const char*>(code_pair.second.data()), code_size);
  }

  size_t num_lists = inverted_lists_.size();
  ofs.write(reinterpret_cast<const char*>(&num_lists), sizeof(num_lists));
  for (const auto& list : inverted_lists_) {
    size_t list_size = list.size();
    ofs.write(reinterpret_cast<const char*>(&list_size), sizeof(list_size));
    ofs.write(reinterpret_cast<const char*>(list.data()), list_size * sizeof(uint64_t));
  }

  size_t num_vectors = original_vectors_.size();
  ofs.write(reinterpret_cast<const char*>(&num_vectors), sizeof(num_vectors));
  for (const auto& [id, vec] : original_vectors_) {
    ofs.write(reinterpret_cast<const char*>(&id), sizeof(id));
    size_t vec_size = vec.size();
    ofs.write(reinterpret_cast<const char*>(&vec_size), sizeof(vec_size));
    ofs.write(reinterpret_cast<const char*>(vec.data()), vec_size * sizeof(float));
  }

  size_t deleted_size = deleted_ids_.size();
  ofs.write(reinterpret_cast<const char*>(&deleted_size), sizeof(deleted_size));
  for (uint64_t id : deleted_ids_) {
    ofs.write(reinterpret_cast<const char*>(&id), sizeof(id));
  }

  return true;
}

bool IVFPQIndex::Load(const std::string& path) {
  std::lock_guard<std::mutex> lock(mutex_);
  std::ifstream ifs(path, std::ios::binary);
  if (!ifs) return false;

  ifs.read(reinterpret_cast<char*>(&config_.dimension), sizeof(config_.dimension));
  ifs.read(reinterpret_cast<char*>(&config_.distance_metric), sizeof(config_.distance_metric));
  ifs.read(reinterpret_cast<char*>(&config_.nlist), sizeof(config_.nlist));
  ifs.read(reinterpret_cast<char*>(&config_.m), sizeof(config_.m));
  ifs.read(reinterpret_cast<char*>(&config_.nbits), sizeof(config_.nbits));
  ifs.read(reinterpret_cast<char*>(&config_.nprobe), sizeof(config_.nprobe));
  ifs.read(reinterpret_cast<char*>(&config_.use_residual), sizeof(config_.use_residual));
  ifs.read(reinterpret_cast<char*>(&trained_), sizeof(trained_));

  ksub_ = 1 << config_.nbits;
  dsub_ = config_.dimension / config_.m;

  size_t num_centroids;
  ifs.read(reinterpret_cast<char*>(&num_centroids), sizeof(num_centroids));
  centroids_.resize(num_centroids);
  for (size_t i = 0; i < num_centroids; ++i) {
    size_t size;
    ifs.read(reinterpret_cast<char*>(&size), sizeof(size));
    centroids_[i].resize(size);
    ifs.read(reinterpret_cast<char*>(centroids_[i].data()), size * sizeof(float));
  }

  size_t num_pq_m;
  ifs.read(reinterpret_cast<char*>(&num_pq_m), sizeof(num_pq_m));
  pq_centroids_.resize(num_pq_m);
  for (size_t m = 0; m < num_pq_m; ++m) {
    size_t num_k;
    ifs.read(reinterpret_cast<char*>(&num_k), sizeof(num_k));
    pq_centroids_[m].resize(num_k);
    for (size_t k = 0; k < num_k; ++k) {
      size_t size;
      ifs.read(reinterpret_cast<char*>(&size), sizeof(size));
      pq_centroids_[m][k].resize(size);
      ifs.read(reinterpret_cast<char*>(pq_centroids_[m][k].data()), size * sizeof(float));
    }
  }

  size_t num_codes;
  ifs.read(reinterpret_cast<char*>(&num_codes), sizeof(num_codes));
  id_to_code_.clear();
  for (size_t i = 0; i < num_codes; ++i) {
    uint64_t id;
    uint32_t centroid_id;
    size_t code_size;
    ifs.read(reinterpret_cast<char*>(&id), sizeof(id));
    ifs.read(reinterpret_cast<char*>(&centroid_id), sizeof(centroid_id));
    ifs.read(reinterpret_cast<char*>(&code_size), sizeof(code_size));
    std::vector<uint8_t> code(code_size);
    ifs.read(reinterpret_cast<char*>(code.data()), code_size);
    id_to_code_[id] = {centroid_id, std::move(code)};
  }

  size_t num_lists;
  ifs.read(reinterpret_cast<char*>(&num_lists), sizeof(num_lists));
  inverted_lists_.resize(num_lists);
  for (size_t i = 0; i < num_lists; ++i) {
    size_t list_size;
    ifs.read(reinterpret_cast<char*>(&list_size), sizeof(list_size));
    inverted_lists_[i].resize(list_size);
    ifs.read(reinterpret_cast<char*>(inverted_lists_[i].data()), list_size * sizeof(uint64_t));
  }

  size_t num_vectors;
  ifs.read(reinterpret_cast<char*>(&num_vectors), sizeof(num_vectors));
  original_vectors_.clear();
  for (size_t i = 0; i < num_vectors; ++i) {
    uint64_t id;
    size_t vec_size;
    ifs.read(reinterpret_cast<char*>(&id), sizeof(id));
    ifs.read(reinterpret_cast<char*>(&vec_size), sizeof(vec_size));
    std::vector<float> vec(vec_size);
    ifs.read(reinterpret_cast<char*>(vec.data()), vec_size * sizeof(float));
    original_vectors_[id] = std::move(vec);
  }

  size_t deleted_size;
  ifs.read(reinterpret_cast<char*>(&deleted_size), sizeof(deleted_size));
  deleted_ids_.clear();
  for (size_t i = 0; i < deleted_size; ++i) {
    uint64_t id;
    ifs.read(reinterpret_cast<char*>(&id), sizeof(id));
    deleted_ids_.insert(id);
  }

  return true;
}

}
