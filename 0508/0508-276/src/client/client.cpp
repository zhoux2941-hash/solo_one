#include "client.h"
#include <algorithm>

namespace vectordb {

VectorDBClient::VectorDBClient(const std::string& server_address) {
  auto channel = grpc::CreateChannel(server_address, grpc::InsecureChannelCredentials());
  stub_ = vectordb::VectorDBService::NewStub(channel);
}

bool VectorDBClient::CreateCollection(const std::string& name, uint32_t dimension,
                                       vectordb::IndexType index_type,
                                       vectordb::DistanceMetric distance_metric,
                                       uint32_t shard_count) {
  vectordb::CreateCollectionRequest request;
  request.set_name(name);
  request.set_dimension(dimension);
  request.set_index_type(index_type);
  request.set_distance_metric(distance_metric);
  request.set_shard_count(shard_count);

  vectordb::CreateCollectionResponse response;
  grpc::ClientContext context;

  grpc::Status status = stub_->CreateCollection(&context, request, &response);

  return status.ok() && response.success();
}

bool VectorDBClient::DropCollection(const std::string& name) {
  vectordb::DropCollectionRequest request;
  request.set_name(name);

  vectordb::DropCollectionResponse response;
  grpc::ClientContext context;

  grpc::Status status = stub_->DropCollection(&context, request, &response);

  return status.ok() && response.success();
}

bool VectorDBClient::Insert(const std::string& collection, uint64_t id, const std::vector<float>& vec) {
  std::vector<std::pair<uint64_t, std::vector<float>>> vectors;
  vectors.emplace_back(id, vec);
  return InsertBatch(collection, vectors);
}

bool VectorDBClient::InsertBatch(const std::string& collection,
                                  const std::vector<std::pair<uint64_t, std::vector<float>>>& vectors) {
  vectordb::InsertRequest request;
  request.set_collection(collection);

  for (const auto& [id, vec] : vectors) {
    auto* proto_vec = request.add_vectors();
    proto_vec->set_id(id);
    for (float v : vec) {
      proto_vec->add_values(v);
    }
  }

  vectordb::InsertResponse response;
  grpc::ClientContext context;

  grpc::Status status = stub_->Insert(&context, request, &response);

  return status.ok() && response.success();
}

bool VectorDBClient::Delete(const std::string& collection, uint64_t id) {
  std::vector<uint64_t> ids = {id};
  return DeleteBatch(collection, ids);
}

bool VectorDBClient::DeleteBatch(const std::string& collection, const std::vector<uint64_t>& ids) {
  vectordb::DeleteRequest request;
  request.set_collection(collection);

  for (uint64_t id : ids) {
    request.add_ids(id);
  }

  vectordb::DeleteResponse response;
  grpc::ClientContext context;

  grpc::Status status = stub_->Delete(&context, request, &response);

  return status.ok() && response.success();
}

bool VectorDBClient::Update(const std::string& collection, uint64_t id, const std::vector<float>& vec) {
  vectordb::UpdateRequest request;
  request.set_collection(collection);

  auto* proto_vec = request.add_vectors();
  proto_vec->set_id(id);
  for (float v : vec) {
    proto_vec->add_values(v);
  }

  vectordb::UpdateResponse response;
  grpc::ClientContext context;

  grpc::Status status = stub_->Update(&context, request, &response);

  return status.ok() && response.success();
}

std::vector<SearchResult> VectorDBClient::Search(const std::string& collection,
                                                   const std::vector<float>& query, uint32_t top_k) {
  vectordb::SearchRequest request;
  request.set_collection(collection);
  request.set_top_k(top_k);

  auto* proto_vec = request.mutable_query_vector();
  for (float v : query) {
    proto_vec->add_values(v);
  }

  vectordb::SearchResponse response;
  grpc::ClientContext context;

  grpc::Status status = stub_->Search(&context, request, &response);

  std::vector<SearchResult> results;
  if (status.ok() && response.success()) {
    for (int i = 0; i < response.results_size(); ++i) {
      const auto& proto_result = response.results(i);
      results.push_back({proto_result.id(), proto_result.distance()});
    }
  }

  return results;
}

}
