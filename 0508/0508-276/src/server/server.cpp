#include "server.h"
#include <iostream>
#include <algorithm>

namespace vectordb {

VectorDBServiceImpl::VectorDBServiceImpl(const std::string& data_dir) {
  shard_manager_ = std::make_unique<ShardManager>(data_dir);
}

grpc::Status VectorDBServiceImpl::CreateCollection(grpc::ServerContext* context,
                                                     const vectordb::CreateCollectionRequest* request,
                                                     vectordb::CreateCollectionResponse* response) {
  CollectionConfig config;
  config.name = request->name();

  if (request->dimension() != 128 && request->dimension() != 256 && request->dimension() != 512) {
    response->set_success(false);
    response->set_message("Dimension must be 128, 256, or 512");
    return grpc::Status::OK;
  }
  config.dimension = request->dimension();

  switch (request->index_type()) {
    case vectordb::INDEX_TYPE_HNSW:
      config.index_type = IndexType::HNSW;
      break;
    case vectordb::INDEX_TYPE_IVF_PQ:
      config.index_type = IndexType::IVF_PQ;
      break;
    default:
      response->set_success(false);
      response->set_message("Invalid index type");
      return grpc::Status::OK;
  }

  switch (request->distance_metric()) {
    case vectordb::DISTANCE_EUCLIDEAN:
      config.distance_metric = DistanceMetric::EUCLIDEAN;
      break;
    case vectordb::DISTANCE_COSINE:
      config.distance_metric = DistanceMetric::COSINE;
      break;
    default:
      response->set_success(false);
      response->set_message("Invalid distance metric");
      return grpc::Status::OK;
  }

  config.shard_count = request->shard_count() > 0 ? request->shard_count() : 4;

  bool success = shard_manager_->CreateCollection(config);
  response->set_success(success);
  if (success) {
    response->set_message("Collection created successfully");
  } else {
    response->set_message("Failed to create collection (may already exist)");
  }

  return grpc::Status::OK;
}

grpc::Status VectorDBServiceImpl::DropCollection(grpc::ServerContext* context,
                                                   const vectordb::DropCollectionRequest* request,
                                                   vectordb::DropCollectionResponse* response) {
  bool success = shard_manager_->DropCollection(request->name());
  response->set_success(success);
  if (success) {
    response->set_message("Collection dropped successfully");
  } else {
    response->set_message("Failed to drop collection (may not exist)");
  }
  return grpc::Status::OK;
}

grpc::Status VectorDBServiceImpl::Insert(grpc::ServerContext* context,
                                          const vectordb::InsertRequest* request,
                                          vectordb::InsertResponse* response) {
  if (request->vectors_size() > MAX_BATCH_SIZE) {
    response->set_success(false);
    response->set_message("Batch size exceeds maximum of " + std::to_string(MAX_BATCH_SIZE));
    return grpc::Status::OK;
  }

  std::vector<Vector> vectors;
  for (int i = 0; i < request->vectors_size(); ++i) {
    const auto& proto_vec = request->vectors(i);
    Vector vec;
    vec.id = proto_vec.id();
    for (int j = 0; j < proto_vec.values_size(); ++j) {
      vec.values.push_back(proto_vec.values(j));
    }
    vectors.push_back(std::move(vec));
  }

  bool success = shard_manager_->InsertBatch(request->collection(), vectors);
  response->set_success(success);
  response->set_inserted_count(static_cast<uint32_t>(vectors.size()));
  if (success) {
    response->set_message("Inserted " + std::to_string(vectors.size()) + " vectors");
  } else {
    response->set_message("Failed to insert vectors");
  }

  return grpc::Status::OK;
}

grpc::Status VectorDBServiceImpl::Delete(grpc::ServerContext* context,
                                          const vectordb::DeleteRequest* request,
                                          vectordb::DeleteResponse* response) {
  uint32_t deleted_count = 0;
  for (int i = 0; i < request->ids_size(); ++i) {
    if (shard_manager_->Delete(request->collection(), request->ids(i))) {
      deleted_count++;
    }
  }

  response->set_success(deleted_count > 0 || request->ids_size() == 0);
  response->set_deleted_count(deleted_count);
  response->set_message("Deleted " + std::to_string(deleted_count) + " vectors");

  return grpc::Status::OK;
}

grpc::Status VectorDBServiceImpl::Update(grpc::ServerContext* context,
                                          const vectordb::UpdateRequest* request,
                                          vectordb::UpdateResponse* response) {
  if (request->vectors_size() > MAX_BATCH_SIZE) {
    response->set_success(false);
    response->set_message("Batch size exceeds maximum of " + std::to_string(MAX_BATCH_SIZE));
    return grpc::Status::OK;
  }

  uint32_t updated_count = 0;
  for (int i = 0; i < request->vectors_size(); ++i) {
    const auto& proto_vec = request->vectors(i);
    std::vector<float> values;
    for (int j = 0; j < proto_vec.values_size(); ++j) {
      values.push_back(proto_vec.values(j));
    }
    if (shard_manager_->Update(request->collection(), proto_vec.id(), values)) {
      updated_count++;
    }
  }

  response->set_success(updated_count > 0 || request->vectors_size() == 0);
  response->set_updated_count(updated_count);
  response->set_message("Updated " + std::to_string(updated_count) + " vectors");

  return grpc::Status::OK;
}

grpc::Status VectorDBServiceImpl::Search(grpc::ServerContext* context,
                                          const vectordb::SearchRequest* request,
                                          vectordb::SearchResponse* response) {
  uint32_t top_k = std::min(request->top_k(), MAX_TOP_K);

  std::vector<float> query_vec;
  for (int i = 0; i < request->query_vector().values_size(); ++i) {
    query_vec.push_back(request->query_vector().values(i));
  }

  auto results = shard_manager_->Search(request->collection(), query_vec, top_k);

  response->set_success(true);
  for (const auto& result : results) {
    auto* proto_result = response->add_results();
    proto_result->set_id(result.id);
    proto_result->set_distance(result.distance);
  }
  response->set_message("Found " + std::to_string(results.size()) + " results");

  return grpc::Status::OK;
}

VectorDBServer::VectorDBServer(const std::string& address, const std::string& data_dir)
  : address_(address), data_dir_(data_dir) {
}

VectorDBServer::~VectorDBServer() {
  Shutdown();
}

void VectorDBServer::Start() {
  VectorDBServiceImpl service(data_dir_);

  grpc::ServerBuilder builder;
  builder.AddListeningPort(address_, grpc::InsecureServerCredentials());
  builder.RegisterService(&service);
  builder.SetMaxReceiveMessageSize(100 * 1024 * 1024);

  server_ = builder.BuildAndStart();
  std::cout << "VectorDB server listening on " << address_ << std::endl;
}

void VectorDBServer::Shutdown() {
  if (server_) {
    server_->Shutdown();
    server_.reset();
  }
}

void VectorDBServer::Wait() {
  if (server_) {
    server_->Wait();
  }
}

}
