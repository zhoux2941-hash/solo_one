#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <mutex>
#include <memory>
#include <functional>
#include <spdlog/spdlog.h>
#include "paxos.pb.h"
#include "kv/storage_engine.h"

namespace paxoskv {

class ClusterConfigManager {
public:
    using ConfigChangeCallback = std::function<void(const ClusterConfig& new_config)>;

    ClusterConfigManager();
    ~ClusterConfigManager();

    bool Init(StorageEngine* storage_engine);

    ClusterConfig GetCurrentConfig() const;
    uint64_t GetCurrentConfigIndex() const;

    bool AddNode(const ClusterMember& node);
    bool RemoveNode(uint64_t node_id);
    bool ApplyConfig(const ClusterConfig& config);

    void SetConfigChangeCallback(ConfigChangeCallback callback);

    bool IsNodeInCluster(uint64_t node_id) const;
    std::vector<ClusterMember> GetAllMembers() const;
    size_t GetClusterSize() const;

    uint64_t GetNodeIdByAddress(const std::string& address) const;

    ClusterConfig BuildNewConfigForAdd(const ClusterMember& new_node);
    ClusterConfig BuildNewConfigForRemove(uint64_t remove_node_id);

    bool ValidateConfig(const ClusterConfig& config);

    void GetAllKeyRanges(std::vector<std::pair<std::string, std::string>>& ranges,
                        std::vector<uint64_t>& owner_nodes);

private:
    bool PersistConfig(const ClusterConfig& config);
    bool LoadLatestConfig();
    std::string GetConfigKey(uint64_t index);

    mutable std::mutex mutex_;
    StorageEngine* storage_engine_ = nullptr;
    ClusterConfig current_config_;
    ConfigChangeCallback config_change_callback_;
};

} 
