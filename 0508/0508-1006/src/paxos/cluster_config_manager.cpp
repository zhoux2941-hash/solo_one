#include "paxos/cluster_config_manager.h"
#include "common/utils.h"

namespace paxoskv {

ClusterConfigManager::ClusterConfigManager() = default;
ClusterConfigManager::~ClusterConfigManager() = default;

std::string ClusterConfigManager::GetConfigKey(uint64_t index) {
    std::string key;
    key.reserve(16);
    key = "CFG:";
    for (int i = 15; i >= 0; --i) {
        key.push_back(static_cast<char>((index >> (i * 8)) & 0xFF));
    }
    return key;
}

bool ClusterConfigManager::Init(StorageEngine* storage_engine) {
    storage_engine_ = storage_engine;

    if (!LoadLatestConfig()) {
        SPDLOG_WARN("No existing cluster config found, starting with empty config");
    }

    SPDLOG_INFO("ClusterConfigManager initialized, current config index: {}",
               current_config_.config_index());
    return true;
}

bool ClusterConfigManager::LoadLatestConfig() {
    if (!storage_engine_) {
        return false;
    }

    auto it = storage_engine_->NewIterator();
    std::string latest_value;
    uint64_t latest_index = 0;

    for (it->SeekToFirst(); it->Valid(); it->Next()) {
        std::string key = it->Key();
        if (key.substr(0, 4) == "CFG:") {
            latest_value = it->Value();
            latest_index++;
        }
    }
    delete it;

    if (latest_index == 0 || latest_value.empty()) {
        return false;
    }

    ClusterConfig config;
    if (config.ParseFromString(latest_value)) {
        current_config_ = config;
        SPDLOG_INFO("Loaded cluster config: index={}, members={}",
                   config.config_index(), config.members_size());
        return true;
    }

    return false;
}

bool ClusterConfigManager::PersistConfig(const ClusterConfig& config) {
    if (!storage_engine_) {
        return false;
    }

    std::string key = GetConfigKey(config.config_index());
    std::string value;
    if (!config.SerializeToString(&value)) {
        return false;
    }

    return storage_engine_->Put(key, value);
}

ClusterConfig ClusterConfigManager::GetCurrentConfig() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return current_config_;
}

uint64_t ClusterConfigManager::GetCurrentConfigIndex() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return current_config_.config_index();
}

bool ClusterConfigManager::ValidateConfig(const ClusterConfig& config) {
    if (config.members_size() < 1) {
        SPDLOG_ERROR("Cluster must have at least 1 member");
        return false;
    }

    std::unordered_set<uint64_t> seen_ids;
    std::unordered_set<std::string> seen_addresses;
    std::unordered_set<std::string> seen_paxos_addresses;

    for (const auto& member : config.members()) {
        if (member.node_id() == 0) {
            SPDLOG_ERROR("Node ID cannot be 0");
            return false;
        }
        if (member.address().empty()) {
            SPDLOG_ERROR("Node address cannot be empty");
            return false;
        }
        if (member.paxos_address().empty()) {
            SPDLOG_ERROR("Paxos address cannot be empty");
            return false;
        }
        if (seen_ids.count(member.node_id())) {
            SPDLOG_ERROR("Duplicate node ID: {}", member.node_id());
            return false;
        }
        if (seen_addresses.count(member.address())) {
            SPDLOG_ERROR("Duplicate address: {}", member.address());
            return false;
        }
        if (seen_paxos_addresses.count(member.paxos_address())) {
            SPDLOG_ERROR("Duplicate paxos address: {}", member.paxos_address());
            return false;
        }
        seen_ids.insert(member.node_id());
        seen_addresses.insert(member.address());
        seen_paxos_addresses.insert(member.paxos_address());
    }

    return true;
}

ClusterConfig ClusterConfigManager::BuildNewConfigForAdd(const ClusterMember& new_node) {
    std::lock_guard<std::mutex> lock(mutex_);

    ClusterConfig new_config = current_config_;
    new_config.set_config_index(current_config_.config_index() + 1);

    for (const auto& member : current_config_.members()) {
        if (member.node_id() == new_node.node_id()) {
            SPDLOG_WARN("Node {} already in cluster", new_node.node_id());
            return current_config_;
        }
    }

    auto* added_member = new_config.add_members();
    *added_member = new_node;

    return new_config;
}

ClusterConfig ClusterConfigManager::BuildNewConfigForRemove(uint64_t remove_node_id) {
    std::lock_guard<std::mutex> lock(mutex_);

    ClusterConfig new_config;
    new_config.set_config_index(current_config_.config_index() + 1);

    bool found = false;
    for (const auto& member : current_config_.members()) {
        if (member.node_id() == remove_node_id) {
            found = true;
            continue;
        }
        auto* m = new_config.add_members();
        *m = member;
    }

    if (!found) {
        SPDLOG_WARN("Node {} not found in cluster", remove_node_id);
        return current_config_;
    }

    return new_config;
}

bool ClusterConfigManager::AddNode(const ClusterMember& node) {
    ClusterConfig new_config = BuildNewConfigForAdd(node);
    if (new_config.config_index() == current_config_.config_index()) {
        return false;
    }
    return ApplyConfig(new_config);
}

bool ClusterConfigManager::RemoveNode(uint64_t node_id) {
    ClusterConfig new_config = BuildNewConfigForRemove(node_id);
    if (new_config.config_index() == current_config_.config_index()) {
        return false;
    }
    return ApplyConfig(new_config);
}

bool ClusterConfigManager::ApplyConfig(const ClusterConfig& config) {
    if (!ValidateConfig(config)) {
        return false;
    }

    if (!PersistConfig(config)) {
        SPDLOG_ERROR("Failed to persist cluster config");
        return false;
    }

    {
        std::lock_guard<std::mutex> lock(mutex_);
        current_config_ = config;
    }

    SPDLOG_INFO("Cluster config applied: index={}, members={}",
               config.config_index(), config.members_size());

    if (config_change_callback_) {
        config_change_callback_(config);
    }

    return true;
}

void ClusterConfigManager::SetConfigChangeCallback(ConfigChangeCallback callback) {
    config_change_callback_ = std::move(callback);
}

bool ClusterConfigManager::IsNodeInCluster(uint64_t node_id) const {
    std::lock_guard<std::mutex> lock(mutex_);
    for (const auto& member : current_config_.members()) {
        if (member.node_id() == node_id) {
            return true;
        }
    }
    return false;
}

std::vector<ClusterMember> ClusterConfigManager::GetAllMembers() const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::vector<ClusterMember> members;
    for (const auto& member : current_config_.members()) {
        members.push_back(member);
    }
    return members;
}

size_t ClusterConfigManager::GetClusterSize() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return current_config_.members_size();
}

uint64_t ClusterConfigManager::GetNodeIdByAddress(const std::string& address) const {
    std::lock_guard<std::mutex> lock(mutex_);
    for (const auto& member : current_config_.members()) {
        if (member.address() == address || member.paxos_address() == address) {
            return member.node_id();
        }
    }
    return 0;
}

void ClusterConfigManager::GetAllKeyRanges(std::vector<std::pair<std::string, std::string>>& ranges,
                                          std::vector<uint64_t>& owner_nodes) {
    ranges.clear();
    owner_nodes.clear();

    auto members = GetAllMembers();
    if (members.empty()) {
        return;
    }

    std::vector<std::string> split_points;
    size_t num_nodes = members.size();

    if (num_nodes == 1) {
        ranges.emplace_back("", "\xff");
        owner_nodes.push_back(members[0].node_id());
        return;
    }

    uint64_t range_size = 256 / num_nodes;
    for (size_t i = 1; i < num_nodes; ++i) {
        char c = static_cast<char>(i * range_size);
        split_points.push_back(std::string(1, c));
    }

    ranges.emplace_back("", split_points.empty() ? "\xff" : split_points[0]);
    owner_nodes.push_back(members[0].node_id());

    for (size_t i = 1; i < split_points.size(); ++i) {
        ranges.emplace_back(split_points[i - 1], split_points[i]);
        owner_nodes.push_back(members[i].node_id());
    }

    if (!split_points.empty()) {
        ranges.emplace_back(split_points.back(), "\xff");
        owner_nodes.push_back(members.back().node_id());
    }
}

} 
