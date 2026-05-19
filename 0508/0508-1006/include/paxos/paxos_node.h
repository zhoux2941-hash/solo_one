#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <mutex>
#include <atomic>
#include <thread>
#include <condition_variable>
#include <memory>
#include <functional>
#include <unordered_map>
#include <queue>
#include <grpcpp/grpcpp.h>
#include <spdlog/spdlog.h>
#include "paxos.grpc.pb.h"
#include "paxos.pb.h"
#include "common/config.h"
#include "paxos/log_manager.h"
#include "paxos/snapshot_manager.h"
#include "paxos/cluster_config_manager.h"
#include "kv/storage_engine.h"

namespace paxoskv {

enum class NodeState {
    FOLLOWER,
    CANDIDATE,
    LEADER
};

struct PeerNode {
    uint64_t node_id;
    std::string address;
    std::unique_ptr<PaxosService::Stub> stub;
    uint64_t next_index;
    uint64_t match_index;
    bool alive;
    uint64_t last_heartbeat;
};

class PaxosNode {
public:
    using ApplyCallback = std::function<void(const LogEntry& entry)>;

    PaxosNode(uint64_t node_id,
              const std::string& address,
              LogManager* log_manager,
              SnapshotManager* snapshot_manager,
              ClusterConfigManager* config_manager,
              StorageEngine* storage_engine);
    ~PaxosNode();

    bool Init();
    void Start();
    void Stop();

    bool Propose(const LogEntry& entry);
    uint64_t GetLeaderId() const { return leader_id_.load(); }
    NodeState GetState() const { return state_.load(); }
    bool IsLeader() const { return state_.load() == NodeState::LEADER; }

    void SetApplyCallback(ApplyCallback callback) { apply_callback_ = std::move(callback); }

    void GetPeerStatus(std::vector<std::tuple<uint64_t, bool, uint64_t>>& status);

    ClusterConfigManager* GetConfigManager() const { return config_manager_; }

    void UpdateClusterConfig(const ClusterConfig& config);

    grpc::Status HandlePrepare(const PrepareRequest* request, PrepareResponse* response);
    grpc::Status HandleAccept(const AcceptRequest* request, AcceptResponse* response);
    grpc::Status HandleLearn(const LearnRequest* request, LearnResponse* response);
    grpc::Status HandleAppendEntries(const AppendEntriesRequest* request, AppendEntriesResponse* response);
    grpc::Status HandleHeartbeat(const HeartbeatRequest* request, HeartbeatResponse* response);
    grpc::Status HandleInstallSnapshot(const InstallSnapshotRequest* request, InstallSnapshotResponse* response);

private:
    void Run();
    void RunElection();
    void RunLeaderLoop();
    void RunFollowerLoop();
    void ApplyLogEntries();
    void CheckLogCompaction();

    bool RequestVotes();
    bool SendAppendEntries();
    bool SendHeartbeat();
    void BroadcastHeartbeat();

    bool BecomeLeader();
    void StepDown(uint64_t term);
    void ResetElectionTimeout();

    uint64_t GetCurrentTerm() const { return current_term_.load(); }
    void SetCurrentTerm(uint64_t term);

    std::vector<PeerNode*> GetAlivePeers();
    size_t MajoritySize() const { return (peers_.size() + 1) / 2 + 1; }

    bool InstallSnapshotToPeer(PeerNode* peer);
    uint64_t FindFirstIndexOfTerm(uint64_t term);

    uint64_t node_id_;
    std::string address_;

    std::atomic<NodeState> state_;
    std::atomic<uint64_t> current_term_;
    std::atomic<uint64_t> voted_for_;
    std::atomic<uint64_t> leader_id_;

    LogManager* log_manager_;
    SnapshotManager* snapshot_manager_;
    ClusterConfigManager* config_manager_;
    StorageEngine* storage_engine_;

    std::vector<std::unique_ptr<PeerNode>> peers_;
    std::unordered_map<uint64_t, PeerNode*> peer_map_;

    ApplyCallback apply_callback_;

    std::atomic<bool> running_;
    std::thread main_thread_;
    std::thread apply_thread_;

    mutable std::mutex mutex_;
    std::condition_variable cv_;

    uint64_t last_election_time_;
    uint64_t last_heartbeat_time_;

    std::mutex propose_mutex_;
    std::condition_variable propose_cv_;
    std::atomic<bool> propose_result_;

    std::atomic<uint64_t> pending_proposals_;
};

} 
