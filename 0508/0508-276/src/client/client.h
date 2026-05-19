#pragma once

#include "vectordb.grpc.pb.h"
#include "vectordb.pb.h"
#include <grpcpp/grpcpp.h>
#include <memory>
#include <string>
#include <vector>
#include <cstdint>

namespace vectordb {

struct SearchResult {
  uint64_t id;
  float distance;
};

class VectorDBClient {
public:
  explicit VectorDBClient(const std::string& server_address);

  bool CreateCollection(const std::string& name, uint32_t dimension,
                        vectordb::IndexType index_type,
                        vectordb::DistanceMetric distance_metric,
                        uint32_t shard_count = 4);

  bool DropCollection(const std::string& name);

  bool Insert(const std::string& collection, uint64_t id, const std::vector<float>& vec);
  bool InsertBatch(const std::string& collection, const std::vector<std::pair<uint64_t, std::vector<float>>>& vectors);

  bool Delete(const std::string& collection, uint64_t id);
  bool DeleteBatch(const std::string& collection, const std::vector<uint64_t>& ids);

  bool Update(const std::string& collection, uint64_t id, const std::vector<float>& vec);

  std::vector<SearchResult> Search(const std::string& collection, const std::vector<float>& query, uint32_t top_k);

private:
  std::unique_ptr<vectordb::VectorDBService::Stub> stub_;
};

}
