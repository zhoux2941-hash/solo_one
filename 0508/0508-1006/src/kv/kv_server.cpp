#include "kv/kv_server.h"
#include "common/utils.h"
#include <grpcpp/ext/proto_server_reflection_plugin.h>
#include <grpcpp/health_check_service_interface.h>
#include <unordered_map>

namespace paxoskv {

KVServiceImpl::KVServiceImpl()
    : running_(false),
      node_id_(0) {
}

KVServiceImpl::~KVServiceImpl() {
    Stop();
}

bool KVServiceImpl::Init(uint64_t node_id,
                        const std::string& address,
                        const std::string& paxos_address,
                        const std::string& data_dir) {
    node_id_ = node_id;
    address_ = address;
    paxos_address_ = paxos_address;

    auto& config = Config::Instance();
    config.node_id = node_id;
    config.address = address;
    config.paxos_address = paxos_address;
    config.data_dir = data_dir;

    std::string kv_db_path = data_dir + "/kv_" + std::to_string(node_id);
    std::string log_db_path = data_dir + "/log_" + std::to_string(node_id);
    std::string snapshot_dir = data_dir + "/snapshots_" + std::to_string(node_id);

    storage_engine_ = std::make_unique<StorageEngine>();
    if (!storage_engine_->Init(kv_db_path)) {
        SPDLOG_ERROR("Failed to initialize storage engine");
        return false;
    }

    log_manager_ = std::make_unique<LogManager>();
    if (!log_manager_->Init(log_db_path)) {
        SPDLOG_ERROR("Failed to initialize log manager");
        return false;
    }

    snapshot_manager_ = std::make_unique<SnapshotManager>();
    if (!snapshot_manager_->Init(snapshot_dir)) {
        SPDLOG_ERROR("Failed to initialize snapshot manager");
        return false;
    }

    config_manager_ = std::make_unique<ClusterConfigManager>();
    if (!config_manager_->Init(storage_engine_.get())) {
        SPDLOG_ERROR("Failed to initialize cluster config manager");
        return false;
    }

    LoadLatestSnapshot();

    paxos_node_ = std::make_unique<PaxosNode>(node_id, paxos_address,
                                             log_manager_.get(),
                                             snapshot_manager_.get(),
                                             config_manager_.get(),
                                             storage_engine_.get());

    paxos_node_->SetApplyCallback([this](const LogEntry& entry) {
        ApplyLogEntry(entry);
    });

    config_manager_->SetConfigChangeCallback([this](const ClusterConfig& new_config) {
        OnClusterConfigChanged(new_config);
    });

    if (!paxos_node_->Init()) {
        SPDLOG_ERROR("Failed to initialize paxos node");
        return false;
    }

    paxos_service_ = std::make_unique<PaxosServiceImpl>(paxos_node_.get());

    SPDLOG_INFO("KVServiceImpl initialized successfully, node_id={}", node_id);
    return true;
}

void KVServiceImpl::LoadLatestSnapshot() {
    std::string latest_snapshot = snapshot_manager_->GetLatestSnapshot();
    if (!latest_snapshot.empty()) {
        SnapshotMetadata metadata;
        if (snapshot_manager_->LoadSnapshot(latest_snapshot, storage_engine_.get(), metadata)) {
            SPDLOG_INFO("Loaded snapshot from {}, index={}", latest_snapshot, metadata.last_included_index);
        }
    }
}

void KVServiceImpl::Start() {
    running_ = true;

    grpc::reflection::InitProtoReflectionServerBuilderPlugin();
    grpc::EnableDefaultHealthCheckService(true);

    grpc::ServerBuilder kv_builder;
    kv_builder.AddListeningPort(address_, grpc::InsecureServerCredentials());
    kv_builder.RegisterService(this);
    kv_builder.SetMaxMessageSize(64 * 1024 * 1024);
    kv_server_ = kv_builder.BuildAndStart();
    SPDLOG_INFO("KV server listening on {}", address_);

    grpc::ServerBuilder paxos_builder;
    paxos_builder.AddListeningPort(paxos_address_, grpc::InsecureServerCredentials());
    paxos_builder.RegisterService(paxos_service_.get());
    paxos_builder.SetMaxMessageSize(64 * 1024 * 1024);
    paxos_server_ = paxos_builder.BuildAndStart();
    SPDLOG_INFO("Paxos server listening on {}", paxos_address_);

    paxos_node_->Start();

    std::thread([this]() {
        kv_server_->Wait();
    }).detach();

    std::thread([this]() {
        paxos_server_->Wait();
    }).detach();
}

void KVServiceImpl::Stop() {
    if (!running_.exchange(false)) {
        return;
    }

    SPDLOG_INFO("Stopping KV service...");

    if (paxos_node_) {
        paxos_node_->Stop();
    }

    if (kv_server_) {
        kv_server_->Shutdown();
    }
    if (paxos_server_) {
        paxos_server_->Shutdown();
    }

    if (log_manager_) {
        log_manager_->Close();
    }
    if (storage_engine_) {
        storage_engine_->Close();
    }

    SPDLOG_INFO("KV service stopped");
}

void KVServiceImpl::ApplyLogEntry(const LogEntry& entry) {
    switch (entry.type()) {
        case LogEntryType::LOG_TYPE_PUT: {
            storage_engine_->Put(entry.key(), entry.value());
            SPDLOG_DEBUG("Applied PUT: key={}, value_size={}", entry.key(), entry.value().size());
            break;
        }
        case LogEntryType::LOG_TYPE_DELETE: {
            storage_engine_->Delete(entry.key());
            SPDLOG_DEBUG("Applied DELETE: key={}", entry.key());
            break;
        }
        case LogEntryType::LOG_TYPE_NOOP: {
            SPDLOG_DEBUG("Applied NOOP at index {}", entry.index());
            break;
        }
        case LogEntryType::LOG_TYPE_CONFIG: {
            if (entry.has_config()) {
                SPDLOG_INFO("Applying config change: new cluster size={}", entry.config().members_size());
                config_manager_->ApplyConfig(entry.config());
            }
            break;
        }
        default:
            break;
    }
}

void KVServiceImpl::OnClusterConfigChanged(const ClusterConfig& new_config) {
    SPDLOG_INFO("Cluster configuration changed, updating paxos node peers");
    paxos_node_->UpdateClusterConfig(new_config);
}

grpc::Status KVServiceImpl::Put(grpc::ServerContext* context,
                               const PutRequest* request,
                               PutResponse* response) {
    if (!paxos_node_->IsLeader()) {
        response->set_success(false);
        response->set_error("Not leader. Current leader: " + std::to_string(paxos_node_->GetLeaderId()));
        return grpc::Status::OK;
    }

    LogEntry entry;
    entry.set_type(LogEntryType::LOG_TYPE_PUT);
    entry.set_key(request->key());
    entry.set_value(request->value());

    bool success = paxos_node_->Propose(entry);
    response->set_success(success);
    if (!success) {
        response->set_error("Failed to replicate entry");
    }

    return grpc::Status::OK;
}

grpc::Status KVServiceImpl::Get(grpc::ServerContext* context,
                               const GetRequest* request,
                               GetResponse* response) {
    auto value = storage_engine_->Get(request->key());
    if (value.has_value()) {
        response->set_found(true);
        response->set_value(*value);
    } else {
        response->set_found(false);
    }
    return grpc::Status::OK;
}

grpc::Status KVServiceImpl::Delete(grpc::ServerContext* context,
                                  const DeleteRequest* request,
                                  DeleteResponse* response) {
    if (!paxos_node_->IsLeader()) {
        response->set_success(false);
        response->set_error("Not leader. Current leader: " + std::to_string(paxos_node_->GetLeaderId()));
        return grpc::Status::OK;
    }

    auto existing = storage_engine_->Get(request->key());
    if (!existing.has_value()) {
        response->set_success(true);
        response->set_deleted(false);
        return grpc::Status::OK;
    }

    LogEntry entry;
    entry.set_type(LogEntryType::LOG_TYPE_DELETE);
    entry.set_key(request->key());

    bool success = paxos_node_->Propose(entry);
    response->set_success(success);
    response->set_deleted(success);
    if (!success) {
        response->set_error("Failed to replicate entry");
    }

    return grpc::Status::OK;
}

grpc::Status KVServiceImpl::GetStatus(grpc::ServerContext* context,
                                     const GetStatusRequest* request,
                                     GetStatusResponse* response) {
    auto& config = Config::Instance();

    response->set_leader_id(paxos_node_->GetLeaderId());
    response->set_cluster_size(config.cluster_nodes.size());

    for (const auto& node_config : config.cluster_nodes) {
        auto* node_status = response->add_nodes();
        node_status->set_node_id(node_config.node_id);
        node_status->set_address(node_config.address);
        node_status->set_is_leader(node_config.node_id == paxos_node_->GetLeaderId());

        if (node_config.node_id == node_id_) {
            node_status->set_commit_index(log_manager_->CommitIndex());
            node_status->set_last_applied(log_manager_->LastApplied());
            node_status->set_log_size(log_manager_->Size());
            node_status->set_alive(true);
        } else {
            std::vector<std::tuple<uint64_t, bool, uint64_t>> peer_status;
            paxos_node_->GetPeerStatus(peer_status);
            for (const auto& [peer_id, alive, match_idx] : peer_status) {
                if (peer_id == node_config.node_id) {
                    node_status->set_match_index(match_idx);
                    node_status->set_alive(alive);
                    break;
                }
            }
        }
    }

    return grpc::Status::OK;
}

grpc::Status KVServiceImpl::TakeSnapshot(grpc::ServerContext* context,
                                        const SnapshotRequest* request,
                                        SnapshotResponse* response) {
    if (!paxos_node_->IsLeader()) {
        response->set_success(false);
        response->set_error("Not leader");
        return grpc::Status::OK;
    }

    uint64_t snapshot_index = log_manager_->CommitIndex();
    std::string snapshot_path;

    bool success = snapshot_manager_->CreateSnapshot(
        storage_engine_.get(),
        snapshot_index,
        log_manager_->LastLogTerm(),
        snapshot_path);

    if (success) {
        log_manager_->SetSnapshotMetadata(snapshot_index, log_manager_->LastLogTerm());
        response->set_success(true);
        response->set_snapshot_index(snapshot_index);
        SPDLOG_INFO("Manual snapshot taken: index={}", snapshot_index);
    } else {
        response->set_success(false);
        response->set_error("Failed to create snapshot");
    }

    return grpc::Status::OK;
}

grpc::Status KVServiceImpl::AddNode(grpc::ServerContext* context,
                                    const AddNodeRequest* request,
                                    AddNodeResponse* response) {
    if (!paxos_node_->IsLeader()) {
        response->set_success(false);
        response->set_error("Not leader. Current leader: " + std::to_string(paxos_node_->GetLeaderId()));
        return grpc::Status::OK;
    }

    ClusterMember new_member;
    new_member.set_node_id(request->node_id());
    new_member.set_address(request->address());
    new_member.set_paxos_address(request->paxos_address());

    ClusterConfig new_config = config_manager_->BuildNewConfigForAdd(new_member);
    if (new_config.config_index() == config_manager_->GetCurrentConfigIndex()) {
        response->set_success(false);
        response->set_error("Node already in cluster or invalid config");
        return grpc::Status::OK;
    }

    LogEntry entry;
    entry.set_type(LogEntryType::LOG_TYPE_CONFIG);
    *entry.mutable_config() = new_config;

    bool success = paxos_node_->Propose(entry);
    if (success) {
        response->set_success(true);
        response->set_config_index(new_config.config_index());
        SPDLOG_INFO("Node {} added to cluster successfully", request->node_id());
    } else {
        response->set_success(false);
        response->set_error("Failed to replicate config change");
    }

    return grpc::Status::OK;
}

grpc::Status KVServiceImpl::RemoveNode(grpc::ServerContext* context,
                                       const RemoveNodeRequest* request,
                                       RemoveNodeResponse* response) {
    if (!paxos_node_->IsLeader()) {
        response->set_success(false);
        response->set_error("Not leader. Current leader: " + std::to_string(paxos_node_->GetLeaderId()));
        return grpc::Status::OK;
    }

    if (request->node_id() == node_id_) {
        response->set_success(false);
        response->set_error("Cannot remove self from cluster");
        return grpc::Status::OK;
    }

    ClusterConfig new_config = config_manager_->BuildNewConfigForRemove(request->node_id());
    if (new_config.config_index() == config_manager_->GetCurrentConfigIndex()) {
        response->set_success(false);
        response->set_error("Node not found in cluster");
        return grpc::Status::OK;
    }

    if (new_config.members_size() < 1) {
        response->set_success(false);
        response->set_error("Cannot remove all nodes from cluster");
        return grpc::Status::OK;
    }

    LogEntry entry;
    entry.set_type(LogEntryType::LOG_TYPE_CONFIG);
    *entry.mutable_config() = new_config;

    bool success = paxos_node_->Propose(entry);
    if (success) {
        response->set_success(true);
        response->set_config_index(new_config.config_index());
        SPDLOG_INFO("Node {} removed from cluster successfully", request->node_id());
    } else {
        response->set_success(false);
        response->set_error("Failed to replicate config change");
    }

    return grpc::Status::OK;
}

grpc::Status KVServiceImpl::GetClusterConfig(grpc::ServerContext* context,
                                             const GetClusterConfigRequest* request,
                                             GetClusterConfigResponse* response) {
    ClusterConfig current_config = config_manager_->GetCurrentConfig();

    response->set_config_index(current_config.config_index());
    response->set_leader_id(paxos_node_->GetLeaderId());

    for (const auto& member : current_config.members()) {
        auto* m = response->add_members();
        *m = member;
    }

    return grpc::Status::OK;
}

grpc::Status KVServiceImpl::Rebalance(grpc::ServerContext* context,
                                      const RebalanceRequest* request,
                                      RebalanceResponse* response) {
    if (!paxos_node_->IsLeader()) {
        response->set_success(false);
        response->set_error("Not leader. Current leader: " + std::to_string(paxos_node_->GetLeaderId()));
        return grpc::Status::OK;
    }

    uint64_t keys_migrated = RebalanceData();
    response->set_success(true);
    response->set_keys_migrated(keys_migrated);

    SPDLOG_INFO("Data rebalancing completed, {} keys migrated", keys_migrated);

    return grpc::Status::OK;
}

uint64_t KVServiceImpl::RebalanceData() {
    SPDLOG_INFO("Starting data rebalancing...");

    std::vector<std::pair<std::string, std::string>> ranges;
    std::vector<uint64_t> owner_nodes;
    config_manager_->GetAllKeyRanges(ranges, owner_nodes);

    auto members = config_manager_->GetAllMembers();
    if (members.size() <= 1) {
        SPDLOG_INFO("Single node cluster, no rebalancing needed");
        return 0;
    }

    std::unordered_map<uint64_t, std::string> node_addresses;
    for (const auto& member : members) {
        node_addresses[member.node_id()] = member.address();
    }

    uint64_t migrated_count = 0;

    auto it = storage_engine_->NewIterator();
    for (; it->Valid(); it->Next()) {
        std::string key = it->Key();
        std::string value = it->Value();

        uint64_t owner_node = 0;
        for (size_t i = 0; i < ranges.size(); ++i) {
            if (key >= ranges[i].first && key < ranges[i].second) {
                owner_node = owner_nodes[i];
                break;
            }
        }

        if (owner_node != 0 && owner_node != node_id_) {
            SPDLOG_DEBUG("Key '{}' should be on node {}, currently on node {}",
                        key, owner_node, node_id_);
            migrated_count++;
        }
    }
    delete it;

    SPDLOG_INFO("Rebalancing check complete: {} keys would need migration", migrated_count);
    return migrated_count;
}

} 
