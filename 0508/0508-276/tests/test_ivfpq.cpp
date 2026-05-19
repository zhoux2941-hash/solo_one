#include <gtest/gtest.h>
#include "../src/index/ivf_pq_index.h"
#include <vector>
#include <random>
#include <algorithm>
#include <set>

using namespace vectordb;

std::vector<std::vector<float>> GenerateRandomVectors(size_t num_vectors, size_t dim, uint32_t seed = 42) {
  std::mt19937 rng(seed);
  std::uniform_real_distribution<float> dist(-1.0f, 1.0f);

  std::vector<std::vector<float>> vectors;
  vectors.reserve(num_vectors);

  for (size_t i = 0; i < num_vectors; ++i) {
    std::vector<float> vec(dim);
    for (size_t j = 0; j < dim; ++j) {
      vec[j] = dist(rng);
    }
    vectors.push_back(std::move(vec));
  }

  return vectors;
}

float ComputeRecall(const std::vector<uint64_t>& ground_truth,
                    const std::vector<SearchResult>& results) {
  if (ground_truth.empty() || results.empty()) {
    return 0.0f;
  }

  std::set<uint64_t> result_ids;
  for (const auto& r : results) {
    result_ids.insert(r.id);
  }

  size_t hit = 0;
  for (uint64_t gt_id : ground_truth) {
    if (result_ids.count(gt_id) > 0) {
      hit++;
    }
  }

  return static_cast<float>(hit) / ground_truth.size();
}

TEST(IVFPQIndexTest, RecallAt10) {
  IVFPQIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.nlist = 256;
  config.m = 16;
  config.nprobe = 100;
  config.use_residual = true;

  IVFPQIndex index(config);

  const size_t num_vectors = 10000;
  const size_t num_train = 5000;
  const uint32_t top_k = 10;

  auto train_vectors = GenerateRandomVectors(num_train, 128, 42);
  ASSERT_TRUE(index.Train(train_vectors));

  auto vectors = GenerateRandomVectors(num_vectors, 128, 123);
  for (uint64_t i = 0; i < num_vectors; ++i) {
    ASSERT_TRUE(index.Insert(i, vectors[i]));
  }

  ASSERT_EQ(index.Size(), num_vectors);

  float total_recall = 0.0f;
  const size_t num_queries = 100;

  for (size_t q = 0; q < num_queries; ++q) {
    const auto& query = vectors[q];

    std::vector<std::pair<float, uint64_t>> all_distances;
    for (uint64_t i = 0; i < num_vectors; ++i) {
      float dist = Distance::Euclidean(query, vectors[i]);
      all_distances.emplace_back(dist, i);
    }
    std::sort(all_distances.begin(), all_distances.end());

    std::vector<uint64_t> ground_truth;
    for (uint32_t i = 0; i < top_k; ++i) {
      ground_truth.push_back(all_distances[i].second);
    }

    auto results = index.Search(query, top_k);

    float recall = ComputeRecall(ground_truth, results);
    total_recall += recall;
  }

  float avg_recall = total_recall / num_queries;
  std::cout << "Average Recall@" << top_k << ": " << avg_recall << std::endl;

  EXPECT_GT(avg_recall, 0.95f) << "Recall should be greater than 95%";
}

TEST(IVFPQIndexTest, CosineDistanceRecall) {
  IVFPQIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::COSINE;
  config.nlist = 256;
  config.m = 16;
  config.nprobe = 100;
  config.use_residual = true;

  IVFPQIndex index(config);

  const size_t num_vectors = 5000;
  const size_t num_train = 2500;
  const uint32_t top_k = 10;

  auto train_vectors = GenerateRandomVectors(num_train, 128, 42);
  ASSERT_TRUE(index.Train(train_vectors));

  auto vectors = GenerateRandomVectors(num_vectors, 128, 123);
  for (uint64_t i = 0; i < num_vectors; ++i) {
    ASSERT_TRUE(index.Insert(i, vectors[i]));
  }

  float total_recall = 0.0f;
  const size_t num_queries = 50;

  for (size_t q = 0; q < num_queries; ++q) {
    const auto& query = vectors[q];

    std::vector<std::pair<float, uint64_t>> all_distances;
    auto norm_query = VectorUtils::Normalized(query);
    for (uint64_t i = 0; i < num_vectors; ++i) {
      auto norm_vec = VectorUtils::Normalized(vectors[i]);
      float dist = Distance::Cosine(norm_query, norm_vec);
      all_distances.emplace_back(dist, i);
    }
    std::sort(all_distances.begin(), all_distances.end());

    std::vector<uint64_t> ground_truth;
    for (uint32_t i = 0; i < top_k; ++i) {
      ground_truth.push_back(all_distances[i].second);
    }

    auto results = index.Search(query, top_k);

    float recall = ComputeRecall(ground_truth, results);
    total_recall += recall;
  }

  float avg_recall = total_recall / num_queries;
  std::cout << "Cosine Average Recall@" << top_k << ": " << avg_recall << std::endl;

  EXPECT_GT(avg_recall, 0.95f) << "Recall should be greater than 95%";
}

TEST(IVFPQIndexTest, WithoutResidualRecall) {
  IVFPQIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.nlist = 256;
  config.m = 16;
  config.nprobe = 100;
  config.use_residual = false;

  IVFPQIndex index(config);

  const size_t num_vectors = 5000;
  const size_t num_train = 2500;
  const uint32_t top_k = 10;

  auto train_vectors = GenerateRandomVectors(num_train, 128, 42);
  ASSERT_TRUE(index.Train(train_vectors));

  auto vectors = GenerateRandomVectors(num_vectors, 128, 123);
  for (uint64_t i = 0; i < num_vectors; ++i) {
    ASSERT_TRUE(index.Insert(i, vectors[i]));
  }

  float total_recall = 0.0f;
  const size_t num_queries = 50;

  for (size_t q = 0; q < num_queries; ++q) {
    const auto& query = vectors[q];

    std::vector<std::pair<float, uint64_t>> all_distances;
    for (uint64_t i = 0; i < num_vectors; ++i) {
      float dist = Distance::Euclidean(query, vectors[i]);
      all_distances.emplace_back(dist, i);
    }
    std::sort(all_distances.begin(), all_distances.end());

    std::vector<uint64_t> ground_truth;
    for (uint32_t i = 0; i < top_k; ++i) {
      ground_truth.push_back(all_distances[i].second);
    }

    auto results = index.Search(query, top_k);

    float recall = ComputeRecall(ground_truth, results);
    total_recall += recall;
  }

  float avg_recall = total_recall / num_queries;
  std::cout << "Without Residual Average Recall@" << top_k << ": " << avg_recall << std::endl;

  EXPECT_GT(avg_recall, 0.90f) << "Recall should be greater than 90% even without residual";
}

TEST(IVFPQIndexTest, TrainAndInsert) {
  IVFPQIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.nlist = 16;

  IVFPQIndex index(config);

  std::mt19937 rng(42);
  std::uniform_real_distribution<float> dist(-1.0f, 1.0f);

  std::vector<std::vector<float>> training_data;
  for (size_t i = 0; i < 1000; ++i) {
    std::vector<float> vec(128);
    for (size_t j = 0; j < 128; ++j) {
      vec[j] = dist(rng);
    }
    training_data.push_back(vec);
  }

  EXPECT_TRUE(index.Train(training_data));

  for (uint64_t i = 1; i <= 100; ++i) {
    std::vector<float> vec(128);
    for (size_t j = 0; j < 128; ++j) {
      vec[j] = dist(rng);
    }
    EXPECT_TRUE(index.Insert(i, vec));
  }

  EXPECT_EQ(index.Size(), 100);
}

TEST(IVFPQIndexTest, Search) {
  IVFPQIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.nlist = 16;
  config.nprobe = 10;

  IVFPQIndex index(config);

  std::mt19937 rng(42);
  std::uniform_real_distribution<float> dist(-1.0f, 1.0f);

  std::vector<std::vector<float>> training_data;
  for (size_t i = 0; i < 1000; ++i) {
    std::vector<float> vec(128);
    for (size_t j = 0; j < 128; ++j) {
      vec[j] = dist(rng);
    }
    training_data.push_back(vec);
  }

  EXPECT_TRUE(index.Train(training_data));

  std::vector<std::pair<uint64_t, std::vector<float>>> vectors;
  for (uint64_t i = 1; i <= 100; ++i) {
    std::vector<float> vec(128);
    for (size_t j = 0; j < 128; ++j) {
      vec[j] = dist(rng);
    }
    vectors.emplace_back(i, vec);
    EXPECT_TRUE(index.Insert(i, vec));
  }

  auto results = index.Search(vectors[0].second, 10);
  EXPECT_FALSE(results.empty());
  EXPECT_LE(results.size(), 10);
}

TEST(IVFPQIndexTest, Delete) {
  IVFPQIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.nlist = 16;

  IVFPQIndex index(config);

  std::mt19937 rng(42);
  std::uniform_real_distribution<float> dist(-1.0f, 1.0f);

  std::vector<std::vector<float>> training_data;
  for (size_t i = 0; i < 100; ++i) {
    std::vector<float> vec(128);
    for (size_t j = 0; j < 128; ++j) {
      vec[j] = dist(rng);
    }
    training_data.push_back(vec);
  }

  EXPECT_TRUE(index.Train(training_data));

  std::vector<float> vec(128, 1.0f);
  EXPECT_TRUE(index.Insert(1, vec));
  EXPECT_EQ(index.Size(), 1);

  EXPECT_TRUE(index.Delete(1));
  EXPECT_EQ(index.Size(), 0);
}

TEST(IVFPQIndexTest, SaveAndLoad) {
  IVFPQIndex::Config config;
  config.dimension = 128;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.nlist = 16;

  {
    IVFPQIndex index(config);

    std::mt19937 rng(42);
    std::uniform_real_distribution<float> dist(-1.0f, 1.0f);

    std::vector<std::vector<float>> training_data;
    for (size_t i = 0; i < 100; ++i) {
      std::vector<float> vec(128);
      for (size_t j = 0; j < 128; ++j) {
        vec[j] = dist(rng);
      }
      training_data.push_back(vec);
    }

    EXPECT_TRUE(index.Train(training_data));
    EXPECT_TRUE(index.Insert(1, training_data[0]));
    EXPECT_TRUE(index.Save("test_ivfpq.index"));
  }

  {
    IVFPQIndex index(config);
    EXPECT_TRUE(index.Load("test_ivfpq.index"));
    EXPECT_EQ(index.Size(), 1);
  }

  std::remove("test_ivfpq.index");
}

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
