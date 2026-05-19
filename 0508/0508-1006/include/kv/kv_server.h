#pragma once

#include <string>
#include <memory>
#include <mutex>
#include <atomic>
#include <grpcpp/grpcpp.h>
#include <spdlog/spdlog.h>
#include "kv.grpc.pb.h"
#include "paxos.grpc.pb.h"
#include "kv/storage_engine.h"
#include "paxos/log_manager.h"
#include "paxos/snapshot_manager.h"
#include "paxos/cluster_config_manager.h"
#include "paxos/paxos_node.h"
#include "common/config.h"

namespace paxoskv {

class KVServiceImpl final : public KVService::Service {
public:
    KVServiceImpl();
    ~KVServiceImpl();

    bool Init(uint64_t node_id,
              const std::string& address,
              const std::string& paxos_address,
              const std::string& data_dir);
    void Start();
    void Stop();

    grpc::Status Put(grpc::ServerContext* context,
                     const PutRequest* request,
                     PutResponse* response) override;

    grpc::Status Get(grpc::ServerContext* context,
                     const GetRequest* request,
                     GetResponse* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const DeleteRequest* request,
                        DeleteResponse* response) override;

    grpc::Status GetStatus(grpc::ServerContext* context,
                           const GetStatusRequest* request,
                           GetStatusResponse* response) override;

    grpc::Status TakeSnapshot(grpc::ServerContext* context,
                              const SnapshotRequest* request,
                              SnapshotResponse* response) override;

    grpc::Status AddNode(grpc::ServerContext* context,
                         const AddNodeRequest* request,
                         AddNodeResponse* response) override;

    grpc::Status RemoveNode(grpc::ServerContext* context,
                            const RemoveNodeRequest* request,
                            RemoveNodeResponse* response) override;

    grpc::Status Rebalance(grpc::ServerContext* context,
                           const RebalanceRequest* request,
                           RebalanceResponse* response) override;

    grpc::Status GetClusterConfig(grpc::ServerContext* context,
                                  const GetClusterConfigRequest* request,
                                  GetClusterConfigResponse* response) override;

private:
    void ApplyLogEntry(const LogEntry& entry);
    void LoadLatestSnapshot();
    void OnClusterConfigChanged(const ClusterConfig& new_config);
    uint64_t RebalanceData();

    std::unique_ptr<StorageEngine> storage_engine_;
    std::unique_ptr<LogManager> log_manager_;
    std::unique_ptr<SnapshotManager> snapshot_manager_;
    std::unique_ptr<ClusterConfigManager> config_manager_;
    std::unique_ptr<PaxosNode> paxos_node_;
    std::unique_ptr<PaxosService::Service> paxos_service_;

    std::unique_ptr<grpc::Server> kv_server_;
    std::unique_ptr<grpc::Server> paxos_server_;

    std::atomic<bool> running_;
    std::string address_;
    std::string paxos_address_;
    uint64_t node_id_;
};

class PaxosServiceImpl final : public PaxosService::Service {
public:
    explicit PaxosServiceImpl(PaxosNode* node) : node_(node) {}

    grpc::Status Prepare(grpc::ServerContext* context,
                         const PrepareRequest* request,
                         PrepareResponse* response) override {
        return node_->HandlePrepare(request, response);
    }

    grpc::Status Accept(grpc::ServerContext* context,
                        const AcceptRequest* request,
                        AcceptResponse* response) override {
        return node_->HandleAccept(request, response);
    }

    grpc::Status Learn(grpc::ServerContext* context,
                       const LearnRequest* request,
                       LearnResponse* response) override {
        return node_->HandleLearn(request, response);
    }

    grpc::Status AppendEntries(grpc::ServerContext* context,
                               const AppendEntriesRequest* request,
                               AppendEntriesResponse* response) override {
        return node_->HandleAppendEntries(request, response);
    }

    grpc::Status Heartbeat(grpc::ServerContext* context,
                           const HeartbeatRequest* request,
                           HeartbeatResponse* response) override {
        return node_->HandleHeartbeat(request, response);
    }

    grpc::Status InstallSnapshot(grpc::ServerContext* context,
                                 const InstallSnapshotRequest* request,
                                 InstallSnapshotResponse* response) override {
        return node_->HandleInstallSnapshot(request, response);
    }

private:
    PaxosNode* node_;
};

} 
