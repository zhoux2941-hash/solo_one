#pragma once

#include "../db/shard_manager.h"
#include "vectordb.grpc.pb.h"
#include "vectordb.pb.h"
#include <grpcpp/grpcpp.h>
#include <memory>
#include <string>

namespace vectordb {

class VectorDBServiceImpl final : public vectordb::VectorDBService::Service {
public:
  explicit VectorDBServiceImpl(const std::string& data_dir);

  grpc::Status CreateCollection(grpc::ServerContext* context,
                                 const vectordb::CreateCollectionRequest* request,
                                 vectordb::CreateCollectionResponse* response) override;

  grpc::Status DropCollection(grpc::ServerContext* context,
                               const vectordb::DropCollectionRequest* request,
                               vectordb::DropCollectionResponse* response) override;

  grpc::Status Insert(grpc::ServerContext* context,
                       const vectordb::InsertRequest* request,
                       vectordb::InsertResponse* response) override;

  grpc::Status Delete(grpc::ServerContext* context,
                       const vectordb::DeleteRequest* request,
                       vectordb::DeleteResponse* response) override;

  grpc::Status Update(grpc::ServerContext* context,
                       const vectordb::UpdateRequest* request,
                       vectordb::UpdateResponse* response) override;

  grpc::Status Search(grpc::ServerContext* context,
                       const vectordb::SearchRequest* request,
                       vectordb::SearchResponse* response) override;

private:
  std::unique_ptr<ShardManager> shard_manager_;
  static const uint32_t MAX_BATCH_SIZE = 1000;
  static const uint32_t MAX_TOP_K = 100;
};

class VectorDBServer {
public:
  VectorDBServer(const std::string& address, const std::string& data_dir);
  ~VectorDBServer();

  void Start();
  void Shutdown();
  void Wait();

private:
  std::string address_;
  std::string data_dir_;
  std::unique_ptr<grpc::Server> server_;
};

}
