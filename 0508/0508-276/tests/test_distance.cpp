#include <gtest/gtest.h>
#include "../src/common/distance.h"
#include "../src/common/vector.h"
#include <vector>
#include <cmath>

using namespace vectordb;

TEST(DistanceTest, EuclideanDistance) {
  std::vector<float> a = {1.0f, 2.0f, 3.0f};
  std::vector<float> b = {4.0f, 5.0f, 6.0f};

  float dist = Distance::Euclidean(a, b);
  float expected = std::sqrt(27.0f);

  EXPECT_NEAR(dist, expected, 1e-6);
}

TEST(DistanceTest, EuclideanDistanceSameVector) {
  std::vector<float> a = {1.0f, 2.0f, 3.0f};

  float dist = Distance::Euclidean(a, a);
  EXPECT_NEAR(dist, 0.0f, 1e-6);
}

TEST(DistanceTest, CosineSimilarity) {
  std::vector<float> a = {1.0f, 0.0f};
  std::vector<float> b = {0.0f, 1.0f};

  float dist = Distance::Cosine(a, b);
  EXPECT_NEAR(dist, 1.0f, 1e-6);
}

TEST(DistanceTest, CosineSimilaritySameVector) {
  std::vector<float> a = {1.0f, 2.0f, 3.0f};

  float dist = Distance::Cosine(a, a);
  EXPECT_NEAR(dist, 0.0f, 1e-6);
}

TEST(VectorUtilsTest, Norm) {
  std::vector<float> a = {3.0f, 4.0f};

  float norm = VectorUtils::Norm(a);
  EXPECT_NEAR(norm, 5.0f, 1e-6);
}

TEST(VectorUtilsTest, Normalize) {
  std::vector<float> a = {3.0f, 4.0f};
  VectorUtils::Normalize(a);

  float norm = VectorUtils::Norm(a);
  EXPECT_NEAR(norm, 1.0f, 1e-6);
}

TEST(VectorUtilsTest, DotProduct) {
  std::vector<float> a = {1.0f, 2.0f, 3.0f};
  std::vector<float> b = {4.0f, 5.0f, 6.0f};

  float dot = VectorUtils::Dot(a, b);
  EXPECT_NEAR(dot, 32.0f, 1e-6);
}

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
