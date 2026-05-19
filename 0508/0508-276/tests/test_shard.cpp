#include <gtest/gtest.h>
#include "../src/db/shard.h"
#include <vector>
#include <random>
#include <filesystem>

using namespace vectordb;

TEST(ShardTest, BelongsToShard) {
  CollectionConfig config;
  config.name = "test";
  config.dimension = 128;
  config.index_type = IndexType::HNSW;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.shard_count = 4;

  Shard shard0(0, config, "./test_data");
  Shard shard1(1, config, "./test_data");

  uint64_t id0 = 0;
  uint64_t id1 = 1;

  EXPECT_NE(shard0.BelongsToShard(id0), shard1.BelongsToShard(id0));
}

TEST(ShardTest, InsertAndSearch) {
  CollectionConfig config;
  config.name = "test";
  config.dimension = 128;
  config.index_type = IndexType::HNSW;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.shard_count = 1;

  Shard shard(0, config, "./test_data");

  std::mt19937 rng(42);
  std::uniform_real_distribution<float> dist(-1.0f, 1.0f);

  std::vector<std::pair<uint64_t, std::vector<float>>> vectors;
  for (uint64_t i = 1; i <= 50; ++i) {
    std::vector<float> vec(128);
    for (size_t j = 0; j < 128; ++j) {
      vec[j] = dist(rng);
    }
    vectors.emplace_back(i, vec);
    EXPECT_TRUE(shard.Insert(i, vec));
  }

  auto results = shard.Search(vectors[0].second, 10);
  EXPECT_FALSE(results.empty());
  EXPECT_LE(results.size(), 10);
}

TEST(ShardTest, Delete) {
  CollectionConfig config;
  config.name = "test";
  config.dimension = 128;
  config.index_type = IndexType::HNSW;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.shard_count = 1;

  Shard shard(0, config, "./test_data");

  std::vector<float> vec(128, 1.0f);
  EXPECT_TRUE(shard.Insert(1, vec));
  EXPECT_EQ(shard.Size(), 1);

  EXPECT_TRUE(shard.Delete(1));
  EXPECT_EQ(shard.Size(), 0);
}

TEST(ShardTest, SaveAndLoad) {
  CollectionConfig config;
  config.name = "test";
  config.dimension = 128;
  config.index_type = IndexType::HNSW;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.shard_count = 1;

  std::filesystem::create_directories("./test_data");

  {
    Shard shard(0, config, "./test_data");
    std::vector<float> vec(128, 1.0f);
    EXPECT_TRUE(shard.Insert(1, vec));
    EXPECT_TRUE(shard.Save());
  }

  {
    Shard shard(0, config, "./test_data");
    EXPECT_TRUE(shard.Load());
    EXPECT_EQ(shard.Size(), 1);
  }

  std::filesystem::remove_all("./test_data");
}

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
