#include <gtest/gtest.h>
#include "../src/index/hnsw_index.h"
#include <vector>
#include <random>
#include <thread>
#include <atomic>

using namespace vectordb;

TEST(HNSWIndexTest, InsertAndSearch) {
  HNSWIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;

  HNSWIndex index(config);

  std::mt19937 rng(42);
  std::uniform_real_distribution<float> dist(-1.0f, 1.0f);

  std::vector<std::pair<uint64_t, std::vector<float>>> vectors;
  for (uint64_t i = 1; i <= 100; ++i) {
    std::vector<float> vec(128);
    for (size_t j = 0; j < 128; ++j) {
      vec[j] = dist(rng);
    }
    vectors.emplace_back(i, vec);
    EXPECT_TRUE(index.Insert(i, vec));
  }

  EXPECT_EQ(index.Size(), 100);

  auto results = index.Search(vectors[0].second, 10);
  EXPECT_FALSE(results.empty());
  EXPECT_LE(results.size(), 10);
  EXPECT_EQ(results[0].id, vectors[0].first);
}

TEST(HNSWIndexTest, LargeScaleInsertNoStackOverflow) {
  HNSWIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.m = 16;
  config.m_max = 32;
  config.ef_construction = 200;
  config.ef_search = 50;
  config.use_heuristic = true;

  HNSWIndex index(config);

  std::mt19937 rng(42);
  std::uniform_real_distribution<float> dist(-1.0f, 1.0f);

  const size_t num_vectors = 10000;
  std::vector<std::pair<uint64_t, std::vector<float>>> vectors;
  vectors.reserve(num_vectors);

  for (uint64_t i = 0; i < num_vectors; ++i) {
    std::vector<float> vec(128);
    for (size_t j = 0; j < 128; ++j) {
      vec[j] = dist(rng);
    }
    vectors.emplace_back(i, vec);
  }

  for (size_t i = 0; i < num_vectors; ++i) {
    EXPECT_TRUE(index.Insert(vectors[i].first, vectors[i].second));
  }

  EXPECT_EQ(index.Size(), num_vectors);

  for (size_t i = 0; i < 100; ++i) {
    auto results = index.Search(vectors[i].second, 10);
    EXPECT_FALSE(results.empty());
    EXPECT_LE(results.size(), 10);
  }
}

TEST(HNSWIndexTest, Delete) {
  HNSWIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;

  HNSWIndex index(config);

  std::vector<float> vec(128, 1.0f);
  EXPECT_TRUE(index.Insert(1, vec));
  EXPECT_EQ(index.Size(), 1);

  EXPECT_TRUE(index.Delete(1));
  EXPECT_EQ(index.Size(), 0);

  EXPECT_FALSE(index.Delete(999));
}

TEST(HNSWIndexTest, Update) {
  HNSWIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;

  HNSWIndex index(config);

  std::vector<float> vec1(128, 1.0f);
  std::vector<float> vec2(128, 2.0f);

  EXPECT_TRUE(index.Insert(1, vec1));
  EXPECT_TRUE(index.Update(1, vec2));
  EXPECT_EQ(index.Size(), 1);
}

TEST(HNSWIndexTest, SaveAndLoad) {
  HNSWIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;

  {
    HNSWIndex index(config);
    std::vector<float> vec(128, 1.0f);
    EXPECT_TRUE(index.Insert(1, vec));
    EXPECT_TRUE(index.Save("test_hnsw.index"));
  }

  {
    HNSWIndex index(config);
    EXPECT_TRUE(index.Load("test_hnsw.index"));
    EXPECT_EQ(index.Size(), 1);
  }

  std::remove("test_hnsw.index");
}

TEST(HNSWIndexTest, DimensionCheck) {
  HNSWIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;

  HNSWIndex index(config);

  std::vector<float> vec(64, 1.0f);
  EXPECT_FALSE(index.Insert(1, vec));
}

TEST(HNSWIndexTest, HeuristicNeighborSelection) {
  HNSWIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.use_heuristic = true;

  HNSWIndex index(config);

  std::mt19937 rng(42);
  std::uniform_real_distribution<float> dist(-1.0f, 1.0f);

  for (uint64_t i = 1; i <= 500; ++i) {
    std::vector<float> vec(128);
    for (size_t j = 0; j < 128; ++j) {
      vec[j] = dist(rng);
    }
    EXPECT_TRUE(index.Insert(i, vec));
  }

  EXPECT_EQ(index.Size(), 500);

  std::vector<float> query(128, 0.0f);
  auto results = index.Search(query, 10);
  EXPECT_FALSE(results.empty());
}

TEST(HNSWIndexTest, CosineDistance) {
  HNSWIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::COSINE;

  HNSWIndex index(config);

  std::mt19937 rng(42);
  std::uniform_real_distribution<float> dist(-1.0f, 1.0f);

  for (uint64_t i = 1; i <= 100; ++i) {
    std::vector<float> vec(128);
    for (size_t j = 0; j < 128; ++j) {
      vec[j] = dist(rng);
    }
    EXPECT_TRUE(index.Insert(i, vec));
  }

  EXPECT_EQ(index.Size(), 100);

  std::vector<float> query(128, 0.5f);
  auto results = index.Search(query, 10);
  EXPECT_FALSE(results.empty());
}

TEST(HNSWIndexTest, SearchWithEmptyIndex) {
  HNSWIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;

  HNSWIndex index(config);

  std::vector<float> query(128, 0.0f);
  auto results = index.Search(query, 10);
  EXPECT_TRUE(results.empty());
}

TEST(HNSWIndexTest, NeighborShrinkOnConnect) {
  HNSWIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.m = 8;
  config.m_max = 10;

  HNSWIndex index(config);

  std::mt19937 rng(42);
  std::uniform_real_distribution<float> dist(-1.0f, 1.0f);

  for (uint64_t i = 1; i <= 100; ++i) {
    std::vector<float> vec(128);
    for (size_t j = 0; j < 128; ++j) {
      vec[j] = dist(rng);
    }
    EXPECT_TRUE(index.Insert(i, vec));
  }

  std::vector<float> query(128, 0.0f);
  auto results = index.Search(query, 10);
  EXPECT_FALSE(results.empty());
}

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
