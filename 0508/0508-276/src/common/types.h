#pragma once

#include <cstdint>
#include <vector>
#include <string>

namespace vectordb {

enum class IndexType {
  HNSW,
  IVF_PQ
};

enum class DistanceMetric {
  EUCLIDEAN,
  COSINE
};

struct Vector {
  uint64_t id;
  std::vector<float> values;

  Vector() = default;
  Vector(uint64_t id, std::vector<float> values)
    : id(id), values(std::move(values)) {}
};

struct SearchResult {
  uint64_t id;
  float distance;

  SearchResult(uint64_t id, float distance)
    : id(id), distance(distance) {}

  bool operator<(const SearchResult& other) const {
    return distance < other.distance;
  }
};

struct CollectionConfig {
  std::string name;
  uint32_t dimension;
  IndexType index_type;
  DistanceMetric distance_metric;
  uint32_t shard_count;
};

}
