#include <gtest/gtest.h>
#include "../src/index/hnsw_index.h"
#include "../src/index/ivf_pq_index.h"
#include "../src/common/perf_monitor.h"
#include <random>
#include <cmath>
#include <iostream>

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

double CalculateRecallAtK(const std::vector<uint64_t>& ground_truth,
                          const std::vector<SearchResult>& results,
                          uint32_t k) {
  if (ground_truth.empty() || results.empty()) {
    return 0.0;
  }

  std::unordered_set<uint64_t> result_ids;
  size_t count = std::min(static_cast<size_t>(k), results.size());
  for (size_t i = 0; i < count; ++i) {
    result_ids.insert(results[i].id);
  }

  size_t hit = 0;
  size_t gt_count = std::min(static_cast<size_t>(k), ground_truth.size());
  for (size_t i = 0; i < gt_count; ++i) {
    if (result_ids.count(ground_truth[i]) > 0) {
      hit++;
    }
  }

  return static_cast<double>(hit) / gt_count;
}

TEST(PerformanceTest, HNSWPerformance) {
  const size_t num_vectors = 10000;
  const size_t num_queries = 100;
  const size_t dim = 128;
  const uint32_t top_k = 10;

  HNSWIndex::Config config;
  config.dimension = dim;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.m = 16;
  config.ef_construction = 200;
  config.ef_search = 50;
  config.use_heuristic = true;

  HNSWIndex index(config);
  index.SetMetricName("HNSW_10K");

  auto vectors = GenerateRandomVectors(num_vectors, dim, 42);

  std::cout << "\n=== HNSW Performance Test ===\n";
  std::cout << "Inserting " << num_vectors << " vectors...\n";

  auto build_start = std::chrono::high_resolution_clock::now();
  for (uint64_t i = 0; i < num_vectors; ++i) {
    ASSERT_TRUE(index.Insert(i, vectors[i]));
  }
  auto build_end = std::chrono::high_resolution_clock::now();
  double build_time_ms = std::chrono::duration<double, std::milli>(build_end - build_start).count();

  ASSERT_EQ(index.Size(), num_vectors);

  std::cout << "\nCalculating ground truth and performing searches...\n";

  double total_recall = 0.0;
  size_t valid_queries = 0;

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

    if (!results.empty()) {
      double recall = CalculateRecallAtK(ground_truth, results, top_k);
      total_recall += recall;
      valid_queries++;
    }
  }

  double avg_recall = valid_queries > 0 ? total_recall / valid_queries : 0.0;
  size_t memory_bytes = index.EstimateMemoryUsage();
  double memory_mb = memory_bytes / (1024.0 * 1024.0);

  const auto& metrics = PerfMonitor::Instance().GetMetrics("HNSW_10K");

  std::cout << "\n=== HNSW Performance Results ===\n";
  std::cout << "Dataset size: " << num_vectors << " vectors\n";
  std::cout << "Dimension: " << dim << "\n";
  std::cout << "Build time: " << build_time_ms << " ms (" << (build_time_ms / 1000.0) << " s)\n";
  std::cout << "Insert throughput: " << (num_vectors * 1000.0 / build_time_ms) << " vectors/s\n";
  std::cout << "Avg search latency: " << metrics.avg_search_latency_ms << " ms\n";
  std::cout << "Search QPS: " << metrics.search_qps << " queries/s\n";
  std::cout << "Avg Recall@" << top_k << ": " << (avg_recall * 100.0) << "%\n";
  std::cout << "Memory usage: " << memory_mb << " MB (" << memory_bytes << " bytes)\n";
  std::cout << "================================\n\n";

  EXPECT_GT(avg_recall, 0.95) << "Recall should be greater than 95%";
  EXPECT_LT(metrics.avg_search_latency_ms, 10.0) << "Avg search latency should be under 10ms";
}

TEST(PerformanceTest, IVFPQPerformance) {
  const size_t num_vectors = 10000;
  const size_t num_train = 5000;
  const size_t num_queries = 100;
  const size_t dim = 128;
  const uint32_t top_k = 10;

  IVFPQIndex::Config config;
  config.dimension = dim;
  config.distance_metric = DistanceMetric::EUCLIDEAN;
  config.nlist = 256;
  config.m = 16;
  config.nprobe = 100;
  config.use_residual = true;

  IVFPQIndex index(config);
  index.SetMetricName("IVFPQ_10K");

  auto train_vectors = GenerateRandomVectors(num_train, dim, 42);
  auto vectors = GenerateRandomVectors(num_vectors, dim, 123);

  std::cout << "\n=== IVF-PQ Performance Test ===\n";
  std::cout << "Training with " << num_train << " vectors...\n";

  ASSERT_TRUE(index.Train(train_vectors));

  std::cout << "Inserting " << num_vectors << " vectors...\n";

  auto insert_start = std::chrono::high_resolution_clock::now();
  for (uint64_t i = 0; i < num_vectors; ++i) {
    ASSERT_TRUE(index.Insert(i, vectors[i]));
  }
  auto insert_end = std::chrono::high_resolution_clock::now();
  double insert_time_ms = std::chrono::duration<double, std::milli>(insert_end - insert_start).count();

  ASSERT_EQ(index.Size(), num_vectors);

  std::cout << "\nCalculating ground truth and performing searches...\n";

  double total_recall = 0.0;
  size_t valid_queries = 0;

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

    if (!results.empty()) {
      double recall = CalculateRecallAtK(ground_truth, results, top_k);
      total_recall += recall;
      valid_queries++;
    }
  }

  double avg_recall = valid_queries > 0 ? total_recall / valid_queries : 0.0;
  size_t memory_bytes = index.EstimateMemoryUsage();
  double memory_mb = memory_bytes / (1024.0 * 1024.0);

  const auto& metrics = PerfMonitor::Instance().GetMetrics("IVFPQ_10K");

  std::cout << "\n=== IVF-PQ Performance Results ===\n";
  std::cout << "Dataset size: " << num_vectors << " vectors\n";
  std::cout << "Dimension: " << dim << "\n";
  std::cout << "Number of centroids (nlist): " << config.nlist << "\n";
  std::cout << "Number of probed centroids (nprobe): " << config.nprobe << "\n";
  std::cout << "Train time: " << metrics.build_time_ms << " ms\n";
  std::cout << "Insert time: " << insert_time_ms << " ms\n";
  std::cout << "Insert throughput: " << (num_vectors * 1000.0 / insert_time_ms) << " vectors/s\n";
  std::cout << "Avg search latency: " << metrics.avg_search_latency_ms << " ms\n";
  std::cout << "Search QPS: " << metrics.search_qps << " queries/s\n";
  std::cout << "Avg Recall@" << top_k << ": " << (avg_recall * 100.0) << "%\n";
  std::cout << "Memory usage: " << memory_mb << " MB (" << memory_bytes << " bytes)\n";
  std::cout << "=================================\n\n";

  EXPECT_GT(avg_recall, 0.90) << "Recall should be greater than 90%";
}

TEST(PerformanceTest, CompareIndexTypes) {
  const size_t num_vectors = 5000;
  const size_t num_train = 2500;
  const size_t dim = 128;
  const uint32_t top_k = 10;

  std::cout << "\n=== Index Type Comparison ===\n";

  auto vectors = GenerateRandomVectors(num_vectors, dim, 42);

  {
    HNSWIndex::Config config;
    config.dimension = dim;
    config.distance_metric = DistanceMetric::EUCLIDEAN;
    config.m = 16;
    config.ef_construction = 200;
    config.ef_search = 50;

    HNSWIndex index(config);
    index.SetMetricName("HNSW_Compare");

    auto build_start = std::chrono::high_resolution_clock::now();
    for (uint64_t i = 0; i < num_vectors; ++i) {
      index.Insert(i, vectors[i]);
    }
    auto build_end = std::chrono::high_resolution_clock::now();

    for (size_t q = 0; q < 100; ++q) {
      index.Search(vectors[q], top_k);
    }

    const auto& metrics = PerfMonitor::Instance().GetMetrics("HNSW_Compare");
    size_t memory = index.EstimateMemoryUsage();

    std::cout << "\nHNSW:\n";
    std::cout << "  Build time: " << std::chrono::duration<double, std::milli>(build_end - build_start).count() << " ms\n";
    std::cout << "  Avg search latency: " << metrics.avg_search_latency_ms << " ms\n";
    std::cout << "  Memory: " << (memory / (1024.0 * 1024.0)) << " MB\n";
  }

  {
    IVFPQIndex::Config config;
    config.dimension = dim;
    config.distance_metric = DistanceMetric::EUCLIDEAN;
    config.nlist = 128;
    config.m = 16;
    config.nprobe = 50;
    config.use_residual = true;

    IVFPQIndex index(config);
    index.SetMetricName("IVFPQ_Compare");

    index.Train(vectors);

    auto insert_start = std::chrono::high_resolution_clock::now();
    for (uint64_t i = 0; i < num_vectors; ++i) {
      index.Insert(i, vectors[i]);
    }
    auto insert_end = std::chrono::high_resolution_clock::now();

    for (size_t q = 0; q < 100; ++q) {
      index.Search(vectors[q], top_k);
    }

    const auto& metrics = PerfMonitor::Instance().GetMetrics("IVFPQ_Compare");
    size_t memory = index.EstimateMemoryUsage();

    std::cout << "\nIVF-PQ:\n";
    std::cout << "  Train + Insert time: " << std::chrono::duration<double, std::milli>(insert_end - insert_start).count() << " ms\n";
    std::cout << "  Avg search latency: " << metrics.avg_search_latency_ms << " ms\n";
    std::cout << "  Memory: " << (memory / (1024.0 * 1024.0)) << " MB\n";
  }

  std::cout << "\n==============================\n\n";
}

int main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
