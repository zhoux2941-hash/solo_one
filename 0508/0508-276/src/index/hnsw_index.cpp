#include "hnsw_index.h"
#include "../common/vector.h"
#include <algorithm>
#include <fstream>
#include <stdexcept>
#include <queue>
#include <unordered_set>
#include <limits>

namespace vectordb {

HNSWIndex::HNSWIndex(const Config& config)
  : config_(config), max_level_(-1), enter_point_(0), rng_(std::random_device{}()) {
  level_multiplier_ = 1.0f / std::log(config_.m);
}

HNSWIndex::~HNSWIndex() = default;

int HNSWIndex::RandomLevel() {
  std::uniform_real_distribution<float> dist(0.0f, 1.0f);
  float r = -std::log(dist(rng_)) * level_multiplier_;
  return static_cast<int>(r);
}

std::vector<uint32_t> HNSWIndex::SearchLayer(const std::vector<float>& query, uint32_t ep, int level, uint32_t ef) {
  std::priority_queue<std::pair<float, uint32_t>> candidates;
  std::unordered_set<uint32_t> visited;
  std::vector<uint32_t> result;

  float dist = Distance::Compute(config_.distance_metric, query, nodes_[ep].vec);
  candidates.emplace(-dist, ep);
  visited.insert(ep);

  const uint32_t max_iterations = 1000000;
  uint32_t iteration = 0;

  while (!candidates.empty() && iteration < max_iterations) {
    auto [current_dist, current_idx] = candidates.top();
    candidates.pop();
    current_dist = -current_dist;

    bool improved = false;
    size_t old_visited_size = visited.size();

    for (uint32_t neighbor_idx : nodes_[current_idx].neighbors[level]) {
      if (visited.count(neighbor_idx) == 0) {
        visited.insert(neighbor_idx);
        float d = Distance::Compute(config_.distance_metric, query, nodes_[neighbor_idx].vec);
        if (candidates.size() < ef || d < -candidates.top().first) {
          candidates.emplace(-d, neighbor_idx);
          improved = true;
        }
      }
    }

    if (!improved && visited.size() == old_visited_size) {
      break;
    }

    iteration++;
  }

  while (!candidates.empty() && result.size() < ef) {
    result.push_back(candidates.top().second);
    candidates.pop();
  }

  return result;
}

void HNSWIndex::Connect(uint32_t node_idx, uint32_t neighbor_idx, int level) {
  auto& neighbors = nodes_[node_idx].neighbors[level];
  if (std::find(neighbors.begin(), neighbors.end(), neighbor_idx) == neighbors.end()) {
    neighbors.push_back(neighbor_idx);
    if (neighbors.size() > config_.m_max) {
      ShrinkNeighbors(node_idx, level, config_.m_max);
    }
  }

  auto& reverse_neighbors = nodes_[neighbor_idx].neighbors[level];
  if (std::find(reverse_neighbors.begin(), reverse_neighbors.end(), node_idx) == reverse_neighbors.end()) {
    reverse_neighbors.push_back(node_idx);
    if (reverse_neighbors.size() > config_.m_max) {
      ShrinkNeighbors(neighbor_idx, level, config_.m_max);
    }
  }
}

void HNSWIndex::ShrinkNeighbors(uint32_t node_idx, int level, uint32_t max_neighbors) {
  auto& neighbors = nodes_[node_idx].neighbors[level];
  if (neighbors.size() <= max_neighbors) {
    return;
  }

  std::vector<std::pair<float, uint32_t>> distances;
  for (uint32_t neighbor_idx : neighbors) {
    float d = Distance::Compute(config_.distance_metric, nodes_[node_idx].vec, nodes_[neighbor_idx].vec);
    distances.emplace_back(d, neighbor_idx);
  }

  std::sort(distances.begin(), distances.end());

  neighbors.clear();
  for (size_t i = 0; i < std::min(static_cast<size_t>(max_neighbors), distances.size()); ++i) {
    neighbors.push_back(distances[i].second);
  }
}

void HNSWIndex::SelectNeighborsHeuristic(const std::vector<float>& query,
                                          const std::vector<uint32_t>& candidates,
                                          std::vector<uint32_t>& result,
                                          uint32_t m, int level, bool keep_pruned) {
  if (candidates.empty()) {
    return;
  }

  std::vector<std::pair<float, uint32_t>> sorted_candidates;
  for (uint32_t idx : candidates) {
    float d = Distance::Compute(config_.distance_metric, query, nodes_[idx].vec);
    sorted_candidates.emplace_back(d, idx);
  }
  std::sort(sorted_candidates.begin(), sorted_candidates.end());

  std::unordered_set<uint32_t> selected_set;
  std::vector<uint32_t> pruned;

  for (const auto& [dist, idx] : sorted_candidates) {
    bool closer_to_query = true;
    for (uint32_t selected_idx : result) {
      float d = Distance::Compute(config_.distance_metric, nodes_[idx].vec, nodes_[selected_idx].vec);
      if (d < dist) {
        closer_to_query = false;
        break;
      }
    }

    if (closer_to_query) {
      result.push_back(idx);
      selected_set.insert(idx);
      if (result.size() >= m) {
        break;
      }
    } else if (keep_pruned) {
      pruned.push_back(idx);
    }
  }

  if (keep_pruned && result.size() < m) {
    for (uint32_t idx : pruned) {
      if (result.size() >= m) {
        break;
      }
      result.push_back(idx);
    }
  }
}

bool HNSWIndex::Insert(uint64_t id, const std::vector<float>& vec) {
  auto start = std::chrono::high_resolution_clock::now();
  std::lock_guard<std::mutex> lock(mutex_);

  if (vec.size() != config_.dimension) {
    return false;
  }

  if (id_to_idx_.count(id) > 0 && deleted_ids_.count(id) == 0) {
    return false;
  }

  std::vector<float> normalized_vec = vec;
  if (config_.distance_metric == DistanceMetric::COSINE) {
    VectorUtils::Normalize(normalized_vec);
  }

  int new_level = RandomLevel();
  uint32_t new_idx = static_cast<uint32_t>(nodes_.size());
  nodes_.emplace_back(id, normalized_vec, std::max(new_level, max_level_));

  if (max_level_ < 0) {
    max_level_ = new_level;
    enter_point_ = new_idx;
    id_to_idx_[id] = new_idx;

    auto end = std::chrono::high_resolution_clock::now();
    double duration_ms = std::chrono::duration<double, std::milli>(end - start).count();
    PerfMonitor::Instance().SetCurrentMetricName(metric_name_);
    PerfMonitor::Instance().RecordInsert(1, duration_ms);
    return true;
  }

  uint32_t ep = enter_point_;
  for (int level = max_level_; level > new_level; --level) {
    auto nearest = SearchLayer(normalized_vec, ep, level, 1);
    if (!nearest.empty()) {
      ep = nearest[0];
    }
  }

  for (int level = std::min(new_level, max_level_); level >= 0; --level) {
    auto nearest = SearchLayer(normalized_vec, ep, level, config_.ef_construction);
    std::vector<uint32_t> neighbors;

    if (config_.use_heuristic) {
      SelectNeighborsHeuristic(normalized_vec, nearest, neighbors, config_.m, level, true);
    } else {
      SelectNeighborsHeuristic(normalized_vec, nearest, neighbors, config_.m, level, false);
    }

    for (uint32_t neighbor_idx : neighbors) {
      Connect(new_idx, neighbor_idx, level);
    }

    if (!nearest.empty()) {
      ep = nearest[0];
    }
  }

  if (new_level > max_level_) {
    max_level_ = new_level;
    enter_point_ = new_idx;
  }

  id_to_idx_[id] = new_idx;
  deleted_ids_.erase(id);

  auto end = std::chrono::high_resolution_clock::now();
  double duration_ms = std::chrono::duration<double, std::milli>(end - start).count();
  PerfMonitor::Instance().SetCurrentMetricName(metric_name_);
  PerfMonitor::Instance().RecordInsert(1, duration_ms);

  return true;
}

bool HNSWIndex::Delete(uint64_t id) {
  std::lock_guard<std::mutex> lock(mutex_);
  if (id_to_idx_.count(id) == 0) {
    return false;
  }
  deleted_ids_.insert(id);
  return true;
}

bool HNSWIndex::Update(uint64_t id, const std::vector<float>& vec) {
  if (!Delete(id)) {
    return false;
  }
  return Insert(id, vec);
}

std::vector<SearchResult> HNSWIndex::Search(const std::vector<float>& query, uint32_t top_k) {
  auto start = std::chrono::high_resolution_clock::now();
  std::lock_guard<std::mutex> lock(mutex_);

  if (query.size() != config_.dimension || nodes_.empty()) {
    return {};
  }

  std::vector<float> normalized_query = query;
  if (config_.distance_metric == DistanceMetric::COSINE) {
    VectorUtils::Normalize(normalized_query);
  }

  uint32_t ep = enter_point_;
  for (int level = max_level_; level > 0; --level) {
    auto nearest = SearchLayer(normalized_query, ep, level, 1);
    if (!nearest.empty()) {
      ep = nearest[0];
    }
  }

  uint32_t ef = std::max(config_.ef_search, top_k);
  auto candidates = SearchLayer(normalized_query, ep, 0, ef);

  std::vector<SearchResult> results;
  for (uint32_t idx : candidates) {
    uint64_t node_id = nodes_[idx].id;
    if (deleted_ids_.count(node_id) == 0) {
      float dist = Distance::Compute(config_.distance_metric, normalized_query, nodes_[idx].vec);
      results.emplace_back(node_id, dist);
    }
  }

  std::sort(results.begin(), results.end());
  if (results.size() > top_k) {
    results.resize(top_k);
  }

  auto end = std::chrono::high_resolution_clock::now();
  double duration_ms = std::chrono::duration<double, std::milli>(end - start).count();
  PerfMonitor::Instance().SetCurrentMetricName(metric_name_);
  PerfMonitor::Instance().RecordSearch(1, duration_ms);

  return results;
}

size_t HNSWIndex::EstimateMemoryUsage() const {
  std::lock_guard<std::mutex> lock(mutex_);
  size_t total = 0;

  for (const auto& node : nodes_) {
    total += sizeof(node.id);
    total += node.vec.capacity() * sizeof(float);
    for (const auto& neighbors : node.neighbors) {
      total += neighbors.capacity() * sizeof(uint32_t);
    }
  }

  total += id_to_idx_.size() * (sizeof(uint64_t) + sizeof(uint32_t));
  total += deleted_ids_.size() * sizeof(uint64_t);

  return total;
}

size_t HNSWIndex::Size() const {
  std::lock_guard<std::mutex> lock(mutex_);
  return id_to_idx_.size() - deleted_ids_.size();
}

uint32_t HNSWIndex::Dimension() const {
  return config_.dimension;
}

DistanceMetric HNSWIndex::GetDistanceMetric() const {
  return config_.distance_metric;
}

bool HNSWIndex::Save(const std::string& path) const {
  std::lock_guard<std::mutex> lock(mutex_);
  std::ofstream ofs(path, std::ios::binary);
  if (!ofs) return false;

  ofs.write(reinterpret_cast<const char*>(&config_.dimension), sizeof(config_.dimension));
  ofs.write(reinterpret_cast<const char*>(&config_.distance_metric), sizeof(config_.distance_metric));
  ofs.write(reinterpret_cast<const char*>(&config_.m), sizeof(config_.m));
  ofs.write(reinterpret_cast<const char*>(&config_.m_max), sizeof(config_.m_max));
  ofs.write(reinterpret_cast<const char*>(&config_.ef_construction), sizeof(config_.ef_construction));
  ofs.write(reinterpret_cast<const char*>(&config_.ef_search), sizeof(config_.ef_search));
  ofs.write(reinterpret_cast<const char*>(&config_.use_heuristic), sizeof(config_.use_heuristic));

  size_t num_nodes = nodes_.size();
  ofs.write(reinterpret_cast<const char*>(&num_nodes), sizeof(num_nodes));
  ofs.write(reinterpret_cast<const char*>(&max_level_), sizeof(max_level_));
  ofs.write(reinterpret_cast<const char*>(&enter_point_), sizeof(enter_point_));

  for (const auto& node : nodes_) {
    ofs.write(reinterpret_cast<const char*>(&node.id), sizeof(node.id));
    size_t vec_size = node.vec.size();
    ofs.write(reinterpret_cast<const char*>(&vec_size), sizeof(vec_size));
    ofs.write(reinterpret_cast<const char*>(node.vec.data()), vec_size * sizeof(float));

    size_t num_levels = node.neighbors.size();
    ofs.write(reinterpret_cast<const char*>(&num_levels), sizeof(num_levels));
    for (const auto& level_neighbors : node.neighbors) {
      size_t num_neighbors = level_neighbors.size();
      ofs.write(reinterpret_cast<const char*>(&num_neighbors), sizeof(num_neighbors));
      ofs.write(reinterpret_cast<const char*>(level_neighbors.data()), num_neighbors * sizeof(uint32_t));
    }
  }

  size_t id_map_size = id_to_idx_.size();
  ofs.write(reinterpret_cast<const char*>(&id_map_size), sizeof(id_map_size));
  for (const auto& [id, idx] : id_to_idx_) {
    ofs.write(reinterpret_cast<const char*>(&id), sizeof(id));
    ofs.write(reinterpret_cast<const char*>(&idx), sizeof(idx));
  }

  size_t deleted_size = deleted_ids_.size();
  ofs.write(reinterpret_cast<const char*>(&deleted_size), sizeof(deleted_size));
  for (uint64_t id : deleted_ids_) {
    ofs.write(reinterpret_cast<const char*>(&id), sizeof(id));
  }

  return true;
}

bool HNSWIndex::Load(const std::string& path) {
  std::lock_guard<std::mutex> lock(mutex_);
  std::ifstream ifs(path, std::ios::binary);
  if (!ifs) return false;

  ifs.read(reinterpret_cast<char*>(&config_.dimension), sizeof(config_.dimension));
  ifs.read(reinterpret_cast<char*>(&config_.distance_metric), sizeof(config_.distance_metric));
  ifs.read(reinterpret_cast<char*>(&config_.m), sizeof(config_.m));
  ifs.read(reinterpret_cast<char*>(&config_.m_max), sizeof(config_.m_max));
  ifs.read(reinterpret_cast<char*>(&config_.ef_construction), sizeof(config_.ef_construction));
  ifs.read(reinterpret_cast<char*>(&config_.ef_search), sizeof(config_.ef_search));
  ifs.read(reinterpret_cast<char*>(&config_.use_heuristic), sizeof(config_.use_heuristic));

  level_multiplier_ = 1.0f / std::log(config_.m);

  size_t num_nodes;
  ifs.read(reinterpret_cast<char*>(&num_nodes), sizeof(num_nodes));
  ifs.read(reinterpret_cast<char*>(&max_level_), sizeof(max_level_));
  ifs.read(reinterpret_cast<char*>(&enter_point_), sizeof(enter_point_));

  nodes_.clear();
  nodes_.reserve(num_nodes);
  for (size_t i = 0; i < num_nodes; ++i) {
    HNSWNode node;
    ifs.read(reinterpret_cast<char*>(&node.id), sizeof(node.id));
    size_t vec_size;
    ifs.read(reinterpret_cast<char*>(&vec_size), sizeof(vec_size));
    node.vec.resize(vec_size);
    ifs.read(reinterpret_cast<char*>(node.vec.data()), vec_size * sizeof(float));

    size_t num_levels;
    ifs.read(reinterpret_cast<char*>(&num_levels), sizeof(num_levels));
    node.neighbors.resize(num_levels);
    for (size_t l = 0; l < num_levels; ++l) {
      size_t num_neighbors;
      ifs.read(reinterpret_cast<char*>(&num_neighbors), sizeof(num_neighbors));
      node.neighbors[l].resize(num_neighbors);
      ifs.read(reinterpret_cast<char*>(node.neighbors[l].data()), num_neighbors * sizeof(uint32_t));
    }
    nodes_.push_back(std::move(node));
  }

  size_t id_map_size;
  ifs.read(reinterpret_cast<char*>(&id_map_size), sizeof(id_map_size));
  id_to_idx_.clear();
  for (size_t i = 0; i < id_map_size; ++i) {
    uint64_t id;
    uint32_t idx;
    ifs.read(reinterpret_cast<char*>(&id), sizeof(id));
    ifs.read(reinterpret_cast<char*>(&idx), sizeof(idx));
    id_to_idx_[id] = idx;
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
