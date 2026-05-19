#include "vector.h"
#include <cmath>
#include <stdexcept>

namespace vectordb {

float VectorUtils::Norm(const std::vector<float>& vec) {
  float sum = 0.0f;
  for (float v : vec) {
    sum += v * v;
  }
  return std::sqrt(sum);
}

void VectorUtils::Normalize(std::vector<float>& vec) {
  float norm = Norm(vec);
  if (norm > 1e-9f) {
    float inv_norm = 1.0f / norm;
    for (float& v : vec) {
      v *= inv_norm;
    }
  }
}

std::vector<float> VectorUtils::Normalized(const std::vector<float>& vec) {
  std::vector<float> result = vec;
  Normalize(result);
  return result;
}

float VectorUtils::Dot(const std::vector<float>& a, const std::vector<float>& b) {
  if (a.size() != b.size()) {
    throw std::invalid_argument("Vector dimensions do not match");
  }
  float sum = 0.0f;
  for (size_t i = 0; i < a.size(); ++i) {
    sum += a[i] * b[i];
  }
  return sum;
}

}
