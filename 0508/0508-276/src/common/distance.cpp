#include "distance.h"
#include "vector.h"
#include <cmath>
#include <stdexcept>

namespace vectordb {

float Distance::Euclidean(const std::vector<float>& a, const std::vector<float>& b) {
  if (a.size() != b.size()) {
    throw std::invalid_argument("Vector dimensions do not match");
  }
  float sum = 0.0f;
  for (size_t i = 0; i < a.size(); ++i) {
    float diff = a[i] - b[i];
    sum += diff * diff;
  }
  return std::sqrt(sum);
}

float Distance::Cosine(const std::vector<float>& a, const std::vector<float>& b) {
  float dot = VectorUtils::Dot(a, b);
  float norm_a = VectorUtils::Norm(a);
  float norm_b = VectorUtils::Norm(b);
  if (norm_a < 1e-9f || norm_b < 1e-9f) {
    return 1.0f;
  }
  float similarity = dot / (norm_a * norm_b);
  return 1.0f - similarity;
}

float Distance::Compute(DistanceMetric metric, const std::vector<float>& a, const std::vector<float>& b) {
  switch (metric) {
    case DistanceMetric::EUCLIDEAN:
      return Euclidean(a, b);
    case DistanceMetric::COSINE:
      return Cosine(a, b);
    default:
      throw std::invalid_argument("Unknown distance metric");
  }
}

}
