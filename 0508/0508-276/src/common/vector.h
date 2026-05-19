#pragma once

#include "types.h"
#include <vector>
#include <cstdint>

namespace vectordb {

class VectorUtils {
public:
  static float Norm(const std::vector<float>& vec);
  static void Normalize(std::vector<float>& vec);
  static std::vector<float> Normalized(const std::vector<float>& vec);
  static float Dot(const std::vector<float>& a, const std::vector<float>& b);
};

}
