#include "paxos/paxos_node.h"
#include "common/utils.h"

namespace paxoskv {

PaxosNode::PaxosNode(uint64_t node_id,
                     const std::string& address,
                     LogManager* log_manager,
                     SnapshotManager* snapshot_manager,
                     ClusterConfigManager* config_manager,
                     StorageEngine* storage_engine)
    : node_id_(node_id),
      address_(address),
      state_(NodeState::FOLLOWER),
      current_term_(0),
      voted_for_(0),
      leader_id_(0),
      log_manager_(log_manager),
      snapshot_manager_(snapshot_manager),
      config_manager_(config_manager),
      storage_engine_(storage_engine),
      running_(false),
      last_election_time_(0),
      last_heartbeat_time_(0),
      propose_result_(false),
      pending_proposals_(0) {
}

PaxosNode::~PaxosNode() {
    Stop();
}

bool PaxosNode::Init() {
    auto& static_config = Config::Instance();

    uint64_t persisted_term = log_manager_->GetCurrentTerm();
    uint64_t persisted_voted_for = log_manager_->GetVotedFor();
    if (persisted_term > 0) {
        current_term_.store(persisted_term);
        voted_for_.store(persisted_voted_for);
        SPDLOG_INFO("Recovered persisted state: term={}, voted_for={}", persisted_term, persisted_voted_for);
    }

    std::vector<NodeConfig> active_nodes;

    if (config_manager_ && config_manager_->GetClusterSize() > 0) {
        auto members = config_manager_->GetAllMembers();
        for (const auto& member : members) {
            NodeConfig nc;
            nc.node_id = member.node_id();
            nc.address = member.address();
            nc.paxos_address = member.paxos_address();
            active_nodes.push_back(nc);
        }
        SPDLOG_INFO("Using cluster config from config manager: {} nodes", active_nodes.size());
    } else {
        active_nodes = static_config.cluster_nodes;
        SPDLOG_INFO("Using static cluster config: {} nodes", active_nodes.size());

        if (config_manager_ && !static_config.cluster_nodes.empty()) {
            ClusterConfig initial_config;
            initial_config.set_config_index(1);
            initial_config.set_timestamp(Utils::NowMillis());
            for (const auto& node : static_config.cluster_nodes) {
                auto* member = initial_config.add_members();
                member->set_node_id(node.node_id);
                member->set_address(node.address);
                member->set_paxos_address(node.paxos_address);
            }
            config_manager_->ApplyConfig(initial_config);
        }
    }

    for (const auto& node_config : active_nodes) {
        if (node_config.node_id == node_id_) {
            continue;
        }

        auto peer = std::make_unique<PeerNode>();
        peer->node_id = node_config.node_id;
        peer->address = node_config.paxos_address;
        peer->next_index = log_manager_->LastLogIndex() + 1;
        peer->match_index = 0;
        peer->alive = true;
        peer->last_heartbeat = 0;

        grpc::ChannelArguments args;
        args.SetInt(GRPC_ARG_KEEPALIVE_TIME_MS, 5000);
        args.SetInt(GRPC_ARG_KEEPALIVE_TIMEOUT_MS, 3000);
        auto channel = grpc::CreateCustomChannel(
            peer->address,
            grpc::InsecureChannelCredentials(),
            args);
        peer->stub = PaxosService::NewStub(channel);

        peer_map_[peer->node_id] = peer.get();
        peers_.push_back(std::move(peer));
    }

    SPDLOG_INFO("PaxosNode initialized with {} peers", peers_.size());
    return true;
}

void PaxosNode::Start() {
    running_ = true;
    ResetElectionTimeout();
    main_thread_ = std::thread(&PaxosNode::Run, this);
    apply_thread_ = std::thread(&PaxosNode::ApplyLogEntries, this);
    SPDLOG_INFO("PaxosNode started");
}

void PaxosNode::Stop() {
    running_ = false;
    cv_.notify_all();
    propose_cv_.notify_all();

    if (main_thread_.joinable()) {
        main_thread_.join();
    }
    if (apply_thread_.joinable()) {
        apply_thread_.join();
    }
    SPDLOG_INFO("PaxosNode stopped");
}

void PaxosNode::ResetElectionTimeout() {
    auto& config = Config::Instance();
    uint64_t base_timeout = config.election_timeout_ms;
    uint64_t random_jitter = Utils::RandomUint64(0, base_timeout / 2);
    last_election_time_ = Utils::NowMillis() + base_timeout + random_jitter;
}

void PaxosNode::SetCurrentTerm(uint64_t term) {
    current_term_.store(term);
    voted_for_.store(0);
    log_manager_->SetCurrentTerm(term);
}

std::vector<PeerNode*> PaxosNode::GetAlivePeers() {
    std::vector<PeerNode*> alive;
    uint64_t now = Utils::NowMillis();
    auto& config = Config::Instance();

    for (auto& peer : peers_) {
        if (peer->alive || (now - peer->last_heartbeat) < config.election_timeout_ms * 3) {
            alive.push_back(peer.get());
        }
    }
    return alive;
}

void PaxosNode::Run() {
    while (running_) {
        switch (state_.load()) {
            case NodeState::FOLLOWER:
                RunFollowerLoop();
                break;
            case NodeState::CANDIDATE:
                RunElection();
                break;
            case NodeState::LEADER:
                RunLeaderLoop();
                break;
        }
    }
}

void PaxosNode::RunFollowerLoop() {
    auto& config = Config::Instance();
    while (running_ && state_.load() == NodeState::FOLLOWER) {
        uint64_t now = Utils::NowMillis();

        if (now >= last_election_time_) {
            SPDLOG_INFO("Election timeout, becoming candidate");
            state_.store(NodeState::CANDIDATE);
            break;
        }

        {
            std::unique_lock<std::mutex> lock(mutex_);
            cv_.wait_for(lock, std::chrono::milliseconds(100),
                        [this] { return !running_ || state_.load() != NodeState::FOLLOWER; });
        }
    }
}

void PaxosNode::RunElection() {
    SPDLOG_INFO("Starting election for term {}", current_term_.load() + 1);

    SetCurrentTerm(current_term_.load() + 1);
    voted_for_.store(node_id_);
    ResetElectionTimeout();

    if (RequestVotes()) {
        BecomeLeader();
    } else {
        state_.store(NodeState::FOLLOWER);
        ResetElectionTimeout();
    }
}

bool PaxosNode::RequestVotes() {
    if (peers_.empty()) {
        return true;
    }

    size_t votes = 1;
    std::atomic<size_t> votes_received(1);
    std::atomic<bool> election_won(false);

    PrepareRequest request;
    request.set_proposer_id(node_id_);
    request.set_proposal_number(current_term_.load());
    request.set_last_log_index(log_manager_->LastLogIndex());
    request.set_last_log_term(log_manager_->LastLogTerm());

    std::vector<std::thread> threads;
    for (auto& peer : peers_) {
        threads.emplace_back([this, &peer, &request, &votes_received, &election_won]() {
            if (election_won.load()) return;

            PrepareResponse response;
            grpc::ClientContext context;
            auto deadline = std::chrono::system_clock::now() +
                           std::chrono::milliseconds(Config::Instance().rpc_timeout_ms);
            context.set_deadline(deadline);

            grpc::Status status = peer->stub->Prepare(&context, request, &response);

            if (status.ok() && response.promise()) {
                votes_received.fetch_add(1);
                peer->alive = true;
                peer->last_heartbeat = Utils::NowMillis();
            } else if (!status.ok()) {
                peer->alive = false;
            }
        });
    }

    for (auto& t : threads) {
        t.join();
    }

    return votes_received.load() >= MajoritySize();
}

bool PaxosNode::BecomeLeader() {
    state_.store(NodeState::LEADER);
    leader_id_.store(node_id_);
    last_heartbeat_time_ = Utils::NowMillis();

    for (auto& peer : peers_) {
        peer->next_index = log_manager_->LastLogIndex() + 1;
        peer->match_index = 0;
    }

    SPDLOG_INFO("Node {} became leader for term {}", node_id_, current_term_.load());

    LogEntry noop_entry;
    noop_entry.set_type(LogEntryType::LOG_TYPE_NOOP);
    noop_entry.set_term(current_term_.load());
    uint64_t index = log_manager_->Append(noop_entry);

    if (index > 0) {
        SendAppendEntries();
    }

    return true;
}

void PaxosNode::StepDown(uint64_t term) {
    if (term > current_term_.load()) {
        SetCurrentTerm(term);
    }
    state_.store(NodeState::FOLLOWER);
    leader_id_.store(0);
    ResetElectionTimeout();
    SPDLOG_INFO("Node {} stepped down to follower, term {}", node_id_, current_term_.load());
}

void PaxosNode::RunLeaderLoop() {
    auto& config = Config::Instance();

    while (running_ && state_.load() == NodeState::LEADER) {
        uint64_t now = Utils::NowMillis();

        if (now - last_heartbeat_time_ >= config.heartbeat_interval_ms) {
            BroadcastHeartbeat();
            last_heartbeat_time_ = now;
        }

        if (pending_proposals_.load() > 0) {
            SendAppendEntries();
        }

        CheckLogCompaction();

        {
            std::unique_lock<std::mutex> lock(mutex_);
            cv_.wait_for(lock, std::chrono::milliseconds(50),
                        [this] {
                            return !running_ ||
                                   state_.load() != NodeState::LEADER ||
                                   pending_proposals_.load() > 0;
                        });
        }
    }
}

void PaxosNode::BroadcastHeartbeat() {
    HeartbeatRequest request;
    request.set_leader_id(node_id_);
    request.set_term(current_term_.load());
    request.set_commit_index(log_manager_->CommitIndex());

    for (auto& peer : peers_) {
        std::thread([this, &peer, request]() {
            HeartbeatResponse response;
            grpc::ClientContext context;
            auto deadline = std::chrono::system_clock::now() +
                           std::chrono::milliseconds(Config::Instance().rpc_timeout_ms);
            context.set_deadline(deadline);

            grpc::Status status = peer->stub->Heartbeat(&context, request, &response);

            if (status.ok()) {
                peer->alive = true;
                peer->last_heartbeat = Utils::NowMillis();
                if (response.term() > current_term_.load()) {
                    StepDown(response.term());
                }
            } else {
                peer->alive = false;
            }
        }).detach();
    }
}

bool PaxosNode::SendAppendEntries() {
    if (peers_.empty()) {
        log_manager_->SetCommitIndex(log_manager_->LastLogIndex());
        return true;
    }

    std::atomic<size_t> success_count(1);
    std::atomic<bool> has_newer_term(false);

    std::vector<std::thread> threads;
    for (auto& peer : peers_) {
        if (!peer->alive) {
            continue;
        }

        threads.emplace_back([this, &peer, &success_count, &has_newer_term]() {
            uint64_t peer_last_index = peer->next_index > 0 ? peer->next_index - 1 : 0;
            uint64_t peer_last_term = 0;

            if (peer_last_index >= log_manager_->GetLastIncludedIndex() &&
                peer_last_index <= log_manager_->LastLogIndex()) {
                auto entry = log_manager_->GetEntry(peer_last_index);
                if (entry.has_value()) {
                    peer_last_term = entry->term();
                }
            } else if (peer_last_index == log_manager_->GetLastIncludedIndex()) {
                peer_last_term = log_manager_->GetLastIncludedTerm();
            }

            if (peer_last_index < log_manager_->GetLastIncludedIndex()) {
                InstallSnapshotToPeer(peer.get());
                return;
            }

            AppendEntriesRequest request;
            request.set_leader_id(node_id_);
            request.set_term(current_term_.load());
            request.set_prev_log_index(peer_last_index);
            request.set_prev_log_term(peer_last_term);
            request.set_leader_commit(log_manager_->CommitIndex());

            std::vector<LogEntry> entries;
            uint64_t max_entries = std::min(Config::Instance().max_append_entries,
                                           log_manager_->LastLogIndex() - peer_last_index);

            if (max_entries > 0) {
                log_manager_->GetEntries(peer_last_index + 1,
                                        peer_last_index + max_entries,
                                        entries);
            }

            for (const auto& entry : entries) {
                *request.add_entries() = entry;
            }

            AppendEntriesResponse response;
            grpc::ClientContext context;
            auto deadline = std::chrono::system_clock::now() +
                           std::chrono::milliseconds(Config::Instance().rpc_timeout_ms);
            context.set_deadline(deadline);

            grpc::Status status = peer->stub->AppendEntries(&context, request, &response);

            if (status.ok()) {
                peer->alive = true;
                peer->last_heartbeat = Utils::NowMillis();

                if (response.term() > current_term_.load()) {
                    has_newer_term.store(true);
                    return;
                }

                if (response.success()) {
                    peer->match_index = response.match_index();
                    peer->next_index = response.match_index() + 1;
                    success_count.fetch_add(1);
                    SPDLOG_DEBUG("AppendEntries to peer {} succeeded, match_index={}, next_index={}",
                               peer->node_id, peer->match_index, peer->next_index);
                } else {
                    uint64_t conflict_term = response.conflict_term();
                    uint64_t conflict_first_index = response.conflict_first_index();

                    SPDLOG_WARN("AppendEntries to peer {} failed, conflict_term={}, conflict_first_index={}",
                               peer->node_id, conflict_term, conflict_first_index);

                    if (conflict_first_index > 0) {
                        if (conflict_term == 0) {
                            peer->next_index = std::min(conflict_first_index, peer->next_index > 0 ? peer->next_index - 1 : 1);
                        } else {
                            uint64_t leader_first_of_term = FindFirstIndexOfTerm(conflict_term);
                            if (leader_first_of_term > 0) {
                                peer->next_index = leader_first_of_term;
                            } else {
                                peer->next_index = conflict_first_index;
                            }
                        }
                    } else if (peer->next_index > 1) {
                        peer->next_index--;
                    }

                    if (peer->next_index < 1) {
                        peer->next_index = 1;
                    }

                    SPDLOG_INFO("Peer {} next_index adjusted to {}", peer->node_id, peer->next_index);

                    if (peer->next_index <= log_manager_->GetLastIncludedIndex()) {
                        SPDLOG_INFO("Peer {} needs snapshot, next_index={} <= snapshot_index={}",
                                   peer->node_id, peer->next_index, log_manager_->GetLastIncludedIndex());
                        InstallSnapshotToPeer(peer.get());
                    }
                }
            } else {
                peer->alive = false;
            }
        });
    }

    for (auto& t : threads) {
        t.join();
    }

    if (has_newer_term.load()) {
        StepDown(current_term_.load() + 1);
        return false;
    }

    uint64_t new_commit_index = log_manager_->CommitIndex();
    for (uint64_t n = log_manager_->LastLogIndex(); n > log_manager_->CommitIndex(); --n) {
        auto entry = log_manager_->GetEntry(n);
        if (!entry.has_value()) {
            continue;
        }

        if (entry->term() != current_term_.load()) {
            continue;
        }

        size_t match_count = 1;
        for (const auto& peer : peers_) {
            if (peer->match_index >= n) {
                match_count++;
            }
        }

        if (match_count >= MajoritySize()) {
            new_commit_index = n;
            break;
        }
    }

    if (new_commit_index > log_manager_->CommitIndex()) {
        log_manager_->SetCommitIndex(new_commit_index);
        SPDLOG_INFO("Commit index advanced to {}", new_commit_index);
    }

    if (success_count.load() >= MajoritySize()) {
        return true;
    }

    return false;
}

bool PaxosNode::InstallSnapshotToPeer(PeerNode* peer) {
    SnapshotMetadata metadata = snapshot_manager_->GetLatestMetadata();
    if (metadata.last_included_index == 0) {
        return false;
    }

    SPDLOG_INFO("Installing snapshot to peer {}: index={}", peer->node_id, metadata.last_included_index);

    std::string snapshot_path = snapshot_manager_->GetLatestSnapshot();
    if (snapshot_path.empty()) {
        return false;
    }

    std::ifstream snap_file(snapshot_path, std::ios::binary | std::ios::ate);
    if (!snap_file.is_open()) {
        return false;
    }

    uint64_t file_size = snap_file.tellg();
    snap_file.seekg(0, std::ios::beg);

    const uint64_t chunk_size = 64 * 1024;
    uint64_t offset = 0;
    std::vector<char> buffer(chunk_size);

    while (offset < file_size) {
        uint64_t read_size = std::min(chunk_size, file_size - offset);
        snap_file.read(buffer.data(), read_size);

        InstallSnapshotRequest request;
        request.set_leader_id(node_id_);
        request.set_term(current_term_.load());
        request.set_last_included_index(metadata.last_included_index);
        request.set_last_included_term(metadata.last_included_term);
        request.set_offset(offset);
        request.set_data(buffer.data(), read_size);
        request.set_done(offset + read_size >= file_size);

        InstallSnapshotResponse response;
        grpc::ClientContext context;
        auto deadline = std::chrono::system_clock::now() +
                       std::chrono::milliseconds(Config::Instance().rpc_timeout_ms * 5);
        context.set_deadline(deadline);

        grpc::Status status = peer->stub->InstallSnapshot(&context, request, &response);

        if (!status.ok()) {
            SPDLOG_ERROR("Failed to send snapshot chunk to peer {}: {}", peer->node_id, status.error_message());
            return false;
        }

        if (response.term() > current_term_.load()) {
            StepDown(response.term());
            return false;
        }

        offset += read_size;
    }

    peer->next_index = metadata.last_included_index + 1;
    peer->match_index = metadata.last_included_index;

    SPDLOG_INFO("Snapshot installed to peer {} successfully", peer->node_id);
    return true;
}

bool PaxosNode::Propose(const LogEntry& entry) {
    if (!IsLeader()) {
        SPDLOG_WARN("Cannot propose: not leader");
        return false;
    }

    LogEntry new_entry = entry;
    new_entry.set_term(current_term_.load());

    uint64_t index = log_manager_->Append(new_entry);
    if (index == 0) {
        SPDLOG_ERROR("Failed to append log entry");
        return false;
    }

    pending_proposals_.fetch_add(1);
    cv_.notify_one();

    auto start = Utils::NowMillis();
    auto timeout = Config::Instance().election_timeout_ms * 2;

    while (running_) {
        if (log_manager_->CommitIndex() >= index) {
            pending_proposals_.fetch_sub(1);
            return true;
        }

        if (Utils::NowMillis() - start > timeout) {
            pending_proposals_.fetch_sub(1);
            SPDLOG_WARN("Proposal timed out after {}ms", timeout);
            return false;
        }

        if (!IsLeader()) {
            pending_proposals_.fetch_sub(1);
            return false;
        }

        std::this_thread::sleep_for(std::chrono::milliseconds(1));
    }

    pending_proposals_.fetch_sub(1);
    return false;
}

void PaxosNode::ApplyLogEntries() {
    while (running_) {
        uint64_t commit_index = log_manager_->CommitIndex();
        uint64_t last_applied = log_manager_->LastApplied();

        if (commit_index > last_applied) {
            for (uint64_t i = last_applied + 1; i <= commit_index; ++i) {
                auto entry = log_manager_->GetEntry(i);
                if (!entry.has_value()) {
                    continue;
                }

                if (apply_callback_) {
                    apply_callback_(*entry);
                }

                log_manager_->SetLastApplied(i);
            }
        } else {
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
        }
    }
}

void PaxosNode::CheckLogCompaction() {
    auto& config = Config::Instance();
    if (log_manager_->Size() > config.log_compaction_threshold) {
        uint64_t compact_up_to = log_manager_->CommitIndex();
        if (compact_up_to > log_manager_->GetLastIncludedIndex() + config.log_compaction_threshold / 2) {
            std::string snapshot_path;
            if (snapshot_manager_->CreateSnapshot(storage_engine_,
                                                  compact_up_to,
                                                  current_term_.load(),
                                                  snapshot_path)) {
                log_manager_->SetSnapshotMetadata(compact_up_to, current_term_.load());
                log_manager_->Compact(compact_up_to);
                snapshot_manager_->DeleteOldSnapshots(3);
            }
        }
    }
}

grpc::Status PaxosNode::HandlePrepare(const PrepareRequest* request, PrepareResponse* response) {
    std::lock_guard<std::mutex> lock(mutex_);

    response->set_node_id(node_id_);
    response->set_promise(false);
    response->set_promised_proposal(current_term_.load());

    if (request->term() < current_term_.load()) {
        SPDLOG_DEBUG("Rejecting Prepare from node {}: term {} < current term {}",
                    request->proposer_id(), request->term(), current_term_.load());
        return grpc::Status::OK;
    }

    if (request->term() > current_term_.load()) {
        SetCurrentTerm(request->term());
        state_.store(NodeState::FOLLOWER);
    }

    uint64_t our_last_index = log_manager_->LastLogIndex();
    uint64_t our_last_term = 0;
    auto our_last_entry = log_manager_->GetEntry(our_last_index);
    if (our_last_entry.has_value()) {
        our_last_term = our_last_entry->term();
    }

    uint64_t candidate_last_index = request->last_log_index();
    uint64_t candidate_last_term = request->last_log_term();

    bool candidate_log_up_to_date = false;
    if (candidate_last_term > our_last_term) {
        candidate_log_up_to_date = true;
    } else if (candidate_last_term == our_last_term && candidate_last_index >= our_last_index) {
        candidate_log_up_to_date = true;
    }

    SPDLOG_DEBUG("Vote check: candidate(id={}, term={}, last_index={}, last_term={}), "
                "our(last_index={}, last_term={}), up_to_date={}",
                request->proposer_id(), request->term(), candidate_last_index, candidate_last_term,
                our_last_index, our_last_term, candidate_log_up_to_date);

    if (candidate_log_up_to_date &&
        (voted_for_.load() == 0 || voted_for_.load() == request->proposer_id())) {
        voted_for_.store(request->proposer_id());
        log_manager_->SetVotedFor(request->proposer_id());
        response->set_promise(true);
        response->set_promised_proposal(request->term());

        if (our_last_entry.has_value()) {
            response->set_accepted_proposal(our_last_term);
            *response->mutable_accepted_entry() = *our_last_entry;
        }
        response->set_last_log_index(our_last_index);

        ResetElectionTimeout();
        SPDLOG_INFO("Voted for node {} in term {}", request->proposer_id(), request->term());
    } else {
        SPDLOG_INFO("Rejected vote for node {} in term {}: already voted for {} or log not up-to-date",
                   request->proposer_id(), request->term(), voted_for_.load());
    }

    return grpc::Status::OK;
}

grpc::Status PaxosNode::HandleAccept(const AcceptRequest* request, AcceptResponse* response) {
    std::lock_guard<std::mutex> lock(mutex_);

    response->set_node_id(node_id_);
    response->set_accepted(false);
    response->set_promised_proposal(current_term_.load());

    if (request->term() < current_term_.load()) {
        return grpc::Status::OK;
    }

    if (request->term() >= current_term_.load()) {
        SetCurrentTerm(request->term());
        state_.store(NodeState::FOLLOWER);
        voted_for_.store(request->proposer_id());

        log_manager_->Append(request->entry());
        response->set_accepted(true);
        ResetElectionTimeout();
    }

    return grpc::Status::OK;
}

grpc::Status PaxosNode::HandleLearn(const LearnRequest* request, LearnResponse* response) {
    std::lock_guard<std::mutex> lock(mutex_);

    response->set_node_id(node_id_);
    response->set_success(false);

    const auto& entry = request->entry();
    uint64_t index = entry.index();

    if (index > log_manager_->LastLogIndex()) {
        log_manager_->Append(entry);
        response->set_success(true);
    } else if (index == log_manager_->LastLogIndex() + 1) {
        auto existing = log_manager_->GetEntry(index);
        if (!existing.has_value() || existing->term() != entry.term()) {
            log_manager_->Truncate(index);
            log_manager_->Append(entry);
        }
        response->set_success(true);
    }

    return grpc::Status::OK;
}

grpc::Status PaxosNode::HandleAppendEntries(const AppendEntriesRequest* request, AppendEntriesResponse* response) {
    std::lock_guard<std::mutex> lock(mutex_);

    response->set_node_id(node_id_);
    response->set_term(current_term_.load());
    response->set_success(false);
    response->set_match_index(0);
    response->set_last_log_index(log_manager_->LastLogIndex());
    response->set_conflict_term(0);
    response->set_conflict_first_index(0);

    if (request->term() < current_term_.load()) {
        return grpc::Status::OK;
    }

    SetCurrentTerm(request->term());
    state_.store(NodeState::FOLLOWER);
    leader_id_.store(request->leader_id());
    ResetElectionTimeout();

    if (request->prev_log_index() > 0) {
        if (request->prev_log_index() < log_manager_->GetLastIncludedIndex()) {
            SPDLOG_WARN("Prev log index {} is in snapshot, need snapshot install", request->prev_log_index());
            response->set_conflict_term(0);
            response->set_conflict_first_index(log_manager_->GetLastIncludedIndex() + 1);
            return grpc::Status::OK;
        }

        auto prev_entry = log_manager_->GetEntry(request->prev_log_index());
        if (!prev_entry.has_value()) {
            SPDLOG_WARN("Log missing at index {}, last_log_index={}", request->prev_log_index(), log_manager_->LastLogIndex());
            response->set_conflict_term(0);
            response->set_conflict_first_index(log_manager_->LastLogIndex() + 1);
            return grpc::Status::OK;
        }

        if (prev_entry->term() != request->prev_log_term()) {
            uint64_t conflict_term = prev_entry->term();
            uint64_t conflict_first_index = FindFirstIndexOfTerm(conflict_term);
            SPDLOG_WARN("Log conflict at index {}: our term={}, leader term={}",
                       request->prev_log_index(), conflict_term, request->prev_log_term());
            response->set_conflict_term(conflict_term);
            response->set_conflict_first_index(conflict_first_index);
            log_manager_->Truncate(conflict_first_index);
            return grpc::Status::OK;
        }
    }

    uint64_t last_new_index = request->prev_log_index();
    for (const auto& entry : request->entries()) {
        uint64_t index = entry.index();
        auto existing = log_manager_->GetEntry(index);

        if (existing.has_value() && existing->term() != entry.term()) {
            SPDLOG_WARN("Log entry conflict at index {}: our term={}, leader term={}",
                       index, existing->term(), entry.term());
            log_manager_->Truncate(index);
            existing = std::nullopt;
        }

        if (!existing.has_value()) {
            log_manager_->Append(entry);
            SPDLOG_DEBUG("Appended log entry at index {}, term {}", index, entry.term());
        }
        last_new_index = index;
    }

    response->set_success(true);
    response->set_match_index(last_new_index);

    if (request->leader_commit() > log_manager_->CommitIndex()) {
        uint64_t new_commit = std::min(request->leader_commit(), log_manager_->LastLogIndex());
        if (new_commit > log_manager_->CommitIndex()) {
            log_manager_->SetCommitIndex(new_commit);
            SPDLOG_DEBUG("Commit index updated to {}", new_commit);
        }
    }

    return grpc::Status::OK;
}

grpc::Status PaxosNode::HandleHeartbeat(const HeartbeatRequest* request, HeartbeatResponse* response) {
    std::lock_guard<std::mutex> lock(mutex_);

    response->set_node_id(node_id_);
    response->set_term(current_term_.load());
    response->set_success(false);

    if (request->term() < current_term_.load()) {
        return grpc::Status::OK;
    }

    SetCurrentTerm(request->term());
    state_.store(NodeState::FOLLOWER);
    leader_id_.store(request->leader_id());
    ResetElectionTimeout();
    response->set_success(true);

    if (request->commit_index() > log_manager_->CommitIndex()) {
        uint64_t new_commit = std::min(request->commit_index(), log_manager_->LastLogIndex());
        log_manager_->SetCommitIndex(new_commit);
    }

    return grpc::Status::OK;
}

grpc::Status PaxosNode::HandleInstallSnapshot(const InstallSnapshotRequest* request, InstallSnapshotResponse* response) {
    std::lock_guard<std::mutex> lock(mutex_);

    response->set_node_id(node_id_);
    response->set_term(current_term_.load());
    response->set_success(false);

    if (request->term() < current_term_.load()) {
        SPDLOG_DEBUG("Rejecting InstallSnapshot from leader {}: term {} < current term {}",
                    request->leader_id(), request->term(), current_term_.load());
        return grpc::Status::OK;
    }

    SetCurrentTerm(request->term());
    state_.store(NodeState::FOLLOWER);
    leader_id_.store(request->leader_id());
    ResetElectionTimeout();

    std::string snapshot_id = "snapshot_" + std::to_string(request->last_included_index()) + ".dat";

    if (request->offset() == 0) {
        SPDLOG_INFO("Starting snapshot installation: index={}, term={}",
                   request->last_included_index(), request->last_included_term());
        snapshot_manager_->AbortSnapshot(snapshot_id);
    }

    if (!snapshot_manager_->ApplySnapshotChunk(snapshot_id, request->offset(),
                                               request->data(), request->done())) {
        SPDLOG_ERROR("Failed to apply snapshot chunk at offset {}", request->offset());
        snapshot_manager_->AbortSnapshot(snapshot_id);
        return grpc::Status::OK;
    }

    if (request->done()) {
        SPDLOG_INFO("All snapshot chunks received, finalizing...");

        SnapshotMetadata metadata;
        metadata.last_included_index = request->last_included_index();
        metadata.last_included_term = request->last_included_term();

        if (!snapshot_manager_->FinalizeSnapshot(snapshot_id, storage_engine_, metadata)) {
            SPDLOG_ERROR("Failed to finalize snapshot");
            snapshot_manager_->AbortSnapshot(snapshot_id);
            return grpc::Status::OK;
        }

        std::string final_path = Config::Instance().data_dir + "/snapshots_" +
                                std::to_string(node_id_) + "/" + snapshot_id;

        if (!snapshot_manager_->LoadSnapshot(final_path, storage_engine_, metadata)) {
            SPDLOG_ERROR("Failed to load snapshot");
            snapshot_manager_->AbortSnapshot(snapshot_id);
            return grpc::Status::OK;
        }

        log_manager_->SetSnapshotMetadata(metadata.last_included_index, metadata.last_included_term);
        log_manager_->Compact(metadata.last_included_index);
        log_manager_->SetCommitIndex(metadata.last_included_index);
        log_manager_->SetLastApplied(metadata.last_included_index);

        response->set_success(true);
        SPDLOG_INFO("Snapshot installed successfully: index={}, entries applied", metadata.last_included_index);
    } else {
        response->set_success(true);
    }

    return grpc::Status::OK;
}

uint64_t PaxosNode::FindFirstIndexOfTerm(uint64_t term) {
    if (term == 0) {
        return 0;
    }

    uint64_t first_log = log_manager_->FirstLogIndex();
    uint64_t last_log = log_manager_->LastLogIndex();

    if (first_log == 0 || last_log == 0) {
        return 0;
    }

    uint64_t low = first_log;
    uint64_t high = last_log;
    uint64_t result = 0;

    while (low <= high) {
        uint64_t mid = low + (high - low) / 2;
        auto entry = log_manager_->GetEntry(mid);
        if (!entry.has_value()) {
            break;
        }

        if (entry->term() == term) {
            result = mid;
            high = mid - 1;
        } else if (entry->term() < term) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return result;
}

void PaxosNode::GetPeerStatus(std::vector<std::tuple<uint64_t, bool, uint64_t>>& status) {
    status.clear();
    for (const auto& peer : peers_) {
        status.push_back({peer->node_id, peer->alive, peer->match_index});
    }
}

void PaxosNode::UpdateClusterConfig(const ClusterConfig& config) {
    std::lock_guard<std::mutex> lock(mutex_);

    SPDLOG_INFO("Updating cluster config: new size={}", config.members_size());

    std::unordered_set<uint64_t> new_node_ids;
    for (const auto& member : config.members()) {
        new_node_ids.insert(member.node_id());
    }

    auto it = peers_.begin();
    while (it != peers_.end()) {
        if (new_node_ids.count((*it)->node_id) == 0 && (*it)->node_id != node_id_) {
            SPDLOG_INFO("Removing peer node {} from cluster", (*it)->node_id);
            peer_map_.erase((*it)->node_id);
            it = peers_.erase(it);
        } else {
            ++it;
        }
    }

    for (const auto& member : config.members()) {
        if (member.node_id() == node_id_) {
            continue;
        }
        if (peer_map_.count(member.node_id()) == 0) {
            SPDLOG_INFO("Adding new peer node {} ({}) to cluster", member.node_id(), member.paxos_address());

            auto peer = std::make_unique<PeerNode>();
            peer->node_id = member.node_id();
            peer->address = member.paxos_address();
            peer->next_index = log_manager_->LastLogIndex() + 1;
            peer->match_index = 0;
            peer->alive = true;
            peer->last_heartbeat = 0;

            grpc::ChannelArguments args;
            args.SetInt(GRPC_ARG_KEEPALIVE_TIME_MS, 5000);
            args.SetInt(GRPC_ARG_KEEPALIVE_TIMEOUT_MS, 3000);
            auto channel = grpc::CreateCustomChannel(
                peer->address,
                grpc::InsecureChannelCredentials(),
                args);
            peer->stub = PaxosService::NewStub(channel);

            peer_map_[peer->node_id] = peer.get();
            peers_.push_back(std::move(peer));
        }
    }

    SPDLOG_INFO("Cluster config updated: {} peers", peers_.size());
}

} 
