#pragma once

#include "../common/types.h"
#include "../common/perf_monitor.h"
#include <vector>
#include <cstdint>
#include <string>

namespace vectordb {

class VectorIndex {
public:
  virtual ~VectorIndex() = default;

  virtual bool Insert(uint64_t id, const std::vector<float>& vec) = 0;
  virtual bool Delete(uint64_t id) = 0;
  virtual bool Update(uint64_t id, const std::vector<float>& vec) = 0;
  virtual std::vector<SearchResult> Search(const std::vector<float>& query, uint32_t top_k) = 0;

  virtual size_t Size() const = 0;
  virtual uint32_t Dimension() const = 0;
  virtual DistanceMetric GetDistanceMetric() const = 0;

  virtual bool Save(const std::string& path) const = 0;
  virtual bool Load(const std::string& path) = 0;

  virtual size_t EstimateMemoryUsage() const = 0;

  void SetMetricName(const std::string& name) { metric_name_ = name; }
  std::string GetMetricName() const { return metric_name_; }

protected:
  std::string metric_name_ = "vector_index";
};

}
