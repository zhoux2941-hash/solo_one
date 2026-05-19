#include "client.h"
#include <iostream>
#include <vector>
#include <random>
#include <iomanip>

using namespace vectordb;

std::vector<float> generate_random_vector(size_t dim) {
  static std::mt19937 rng(std::random_device{}());
  static std::uniform_real_distribution<float> dist(-1.0f, 1.0f);

  std::vector<float> vec(dim);
  for (size_t i = 0; i < dim; ++i) {
    vec[i] = dist(rng);
  }
  return vec;
}

void print_results(const std::vector<SearchResult>& results) {
  std::cout << "Search results:" << std::endl;
  std::cout << std::setw(10) << "ID" << std::setw(15) << "Distance" << std::endl;
  std::cout << "-------------------------" << std::endl;
  for (const auto& result : results) {
    std::cout << std::setw(10) << result.id << std::setw(15) << std::fixed << std::setprecision(6) << result.distance << std::endl;
  }
}

int main(int argc, char** argv) {
  std::string server_address = "localhost:50051";
  if (argc > 1) {
    server_address = argv[1];
  }

  VectorDBClient client(server_address);

  std::cout << "=== VectorDB Client Example ===" << std::endl;
  std::cout << "Connecting to: " << server_address << std::endl;

  const uint32_t dim = 128;
  const std::string collection_name = "test_collection";

  std::cout << "\n1. Creating collection..." << std::endl;
  bool created = client.CreateCollection(
    collection_name,
    dim,
    vectordb::INDEX_TYPE_HNSW,
    vectordb::DISTANCE_COSINE,
    4
  );
  std::cout << "Create collection: " << (created ? "SUCCESS" : "FAILED") << std::endl;

  std::cout << "\n2. Inserting vectors..." << std::endl;
  std::vector<std::pair<uint64_t, std::vector<float>>> vectors;
  for (uint64_t i = 1; i <= 100; ++i) {
    vectors.emplace_back(i, generate_random_vector(dim));
  }

  bool inserted = client.InsertBatch(collection_name, vectors);
  std::cout << "Insert " << vectors.size() << " vectors: " << (inserted ? "SUCCESS" : "FAILED") << std::endl;

  std::cout << "\n3. Searching for similar vectors..." << std::endl;
  auto query = generate_random_vector(dim);
  auto results = client.Search(collection_name, query, 10);
  print_results(results);

  std::cout << "\n4. Updating a vector..." << std::endl;
  auto updated_vec = generate_random_vector(dim);
  bool updated = client.Update(collection_name, 1, updated_vec);
  std::cout << "Update vector 1: " << (updated ? "SUCCESS" : "FAILED") << std::endl;

  std::cout << "\n5. Searching again..." << std::endl;
  results = client.Search(collection_name, query, 10);
  print_results(results);

  std::cout << "\n6. Deleting a vector..." << std::endl;
  bool deleted = client.Delete(collection_name, 100);
  std::cout << "Delete vector 100: " << (deleted ? "SUCCESS" : "FAILED") << std::endl;

  std::cout << "\n7. Searching again..." << std::endl;
  results = client.Search(collection_name, query, 10);
  print_results(results);

  std::cout << "\n8. Dropping collection..." << std::endl;
  bool dropped = client.DropCollection(collection_name);
  std::cout << "Drop collection: " << (dropped ? "SUCCESS" : "FAILED") << std::endl;

  std::cout << "\n=== Done ===" << std::endl;

  return 0;
}
