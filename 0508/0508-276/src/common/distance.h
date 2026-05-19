#pragma once

#include "types.h"
#include <vector>
#include <cstdint>

namespace vectordb {

class Distance {
public:
  static float Euclidean(const std::vector<float>& a, const std::vector<float>& b);
  static float Cosine(const std::vector<float>& a, const std::vector<float>& b);
  static float Compute(DistanceMetric metric, const std::vector<float>& a, const std::vector<float>& b);
};

}
