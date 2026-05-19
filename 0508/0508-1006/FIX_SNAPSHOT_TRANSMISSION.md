# 快照传输中断问题修复说明

## 问题描述

在快照传输过程中，如果发生网络中断或节点崩溃，可能导致从节点状态不一致：
1. 部分传输的快照文件残留在磁盘上
2. 快照安装中途失败导致数据部分写入
3. 缺少校验和验证导致损坏的快照被应用
4. 没有清理机制导致垃圾文件累积

## 根本原因

1. **缺少原子性保证**：快照安装过程中如果失败，已写入的数据不会回滚
2. **缺少中断恢复机制**：传输中断后没有清理部分文件
3. **缺少完整性验证**：快照应用前没有验证文件完整性
4. **缺少错误处理**：安装失败后没有适当的清理操作

## 修复内容

### 1. 原子快照安装 (LoadSnapshot)

**修改前的问题**：
- 直接写入快照数据到数据库，没有清除旧数据
- 如果中途失败，会导致新旧数据混合

**修复方案**：
```cpp
// 1. 先验证快照文件完整性
if (!VerifySnapshotFile(snapshot_path, metadata)) {
    return false;
}

// 2. 解析所有KV对到内存
std::vector<std::pair<std::string, std::string>> kv_pairs;
// ... 解析快照文件 ...

// 3. 在单个WriteBatch中原子执行：先删除所有旧数据，再写入新数据
rocksdb::WriteBatch batch;

// 清除所有现有数据
auto it = engine->NewIterator();
for (; it->Valid(); it->Next()) {
    batch.Delete(it->Key());
}
delete it;

// 写入所有快照数据
for (const auto& kv : kv_pairs) {
    batch.Put(kv.first, kv.second);
}

// 原子提交
engine->WriteBatch(batch);
```

### 2. 启动时清理不完整快照 (CleanupIncompleteSnapshots)

**新增功能**：
- 清理所有 `.tmp` 后缀的临时文件
- 清理缺少 `.meta` 文件的孤立快照数据文件
- 在 `Init()` 时自动调用

```cpp
void SnapshotManager::CleanupIncompleteSnapshots() {
    // 清理.tmp文件
    for (const auto& entry : fs::directory_iterator(snapshot_dir_)) {
        if (entry.path().extension() == ".tmp") {
            fs::remove(entry.path());
        }
    }

    // 清理孤立的.dat文件（没有对应.meta）
    for (const auto& entry : fs::directory_iterator(snapshot_dir_)) {
        if (entry.path().extension() == ".dat") {
            std::string meta_path = entry.path().string() + ".meta";
            if (!fs::exists(meta_path)) {
                fs::remove(entry.path());
            }
        }
    }
}
```

### 3. 快照中止和清理 (AbortSnapshot)

**新增功能**：
- 关闭正在进行的快照文件流
- 删除临时文件
- 从内存映射中移除记录

```cpp
bool SnapshotManager::AbortSnapshot(const std::string& snapshot_id) {
    // 关闭文件流
    auto it = in_progress_snapshots_.find(snapshot_id);
    if (it != in_progress_snapshots_.end()) {
        if (it->second.is_open()) {
            it->second.close();
        }
        in_progress_snapshots_.erase(it);
    }

    // 删除临时文件
    std::string tmp_path = snapshot_dir_ + "/" + snapshot_id + ".tmp";
    if (fs::exists(tmp_path)) {
        fs::remove(tmp_path);
    }

    return true;
}
```

### 4. 快照文件验证 (VerifySnapshotFile)

**新增功能**：
- 检查文件是否存在
- 验证文件大小是否匹配元数据
- 验证元数据文件是否存在
- 验证元数据内容是否一致

```cpp
bool SnapshotManager::VerifySnapshotFile(const std::string& snapshot_path,
                                        const SnapshotMetadata& metadata) {
    // 检查文件存在
    if (!fs::exists(snapshot_path)) return false;

    // 验证文件大小
    uint64_t file_size = fs::file_size(snapshot_path);
    if (file_size != metadata.data_size) return false;

    // 验证元数据文件
    std::string meta_path = snapshot_path + ".meta";
    if (!fs::exists(meta_path)) return false;

    // 验证元数据内容
    SnapshotMetadata stored_meta;
    if (!ReadMetadata(snapshot_path, stored_meta)) return false;

    return (stored_meta.last_included_index == metadata.last_included_index &&
            stored_meta.last_included_term == metadata.last_included_term &&
            stored_meta.checksum == metadata.checksum &&
            stored_meta.data_size == metadata.data_size);
}
```

### 5. 安全的快照安装处理 (HandleInstallSnapshot)

**修改内容**：
- 新快照开始前中止之前的同ID快照
- 每个chunk写入失败时清理
- 所有chunk接收完成后才进行最终处理
- Finalize和LoadSnapshot分开，失败时清理
- 安装成功后才更新日志管理器状态

```cpp
grpc::Status PaxosNode::HandleInstallSnapshot(...) {
    std::string snapshot_id = "snapshot_" + ...;

    // 新快照开始，清理之前的
    if (request->offset() == 0) {
        snapshot_manager_->AbortSnapshot(snapshot_id);
    }

    // 写入chunk，失败则清理
    if (!snapshot_manager_->ApplySnapshotChunk(...)) {
        snapshot_manager_->AbortSnapshot(snapshot_id);
        return grpc::Status::OK;
    }

    // 所有chunk接收完成
    if (request->done()) {
        // 1. 重命名临时文件
        if (!snapshot_manager_->FinalizeSnapshot(...)) {
            snapshot_manager_->AbortSnapshot(snapshot_id);
            return grpc::Status::OK;
        }

        // 2. 验证并原子加载快照
        if (!snapshot_manager_->LoadSnapshot(...)) {
            snapshot_manager_->AbortSnapshot(snapshot_id);
            return grpc::Status::OK;
        }

        // 3. 更新状态
        log_manager_->SetSnapshotMetadata(...);
        log_manager_->Compact(...);
        log_manager_->SetCommitIndex(...);
        log_manager_->SetLastApplied(...);
    }
}
```

### 6. FinalizeSnapshot改进

**修改内容**：
- 错误处理：重命名失败时删除临时文件
- 正确清理内存状态
- 不再在Finalize中加载快照（改为在HandleInstallSnapshot中显式加载）

## 修改的文件

1. `include/paxos/snapshot_manager.h`
   - 添加 `CleanupIncompleteSnapshots()`
   - 添加 `AbortSnapshot()`
   - 添加 `VerifySnapshotFile()`

2. `src/paxos/snapshot_manager.cpp`
   - 修改 `Init()`：启动时清理不完整快照，加载最新快照元数据
   - 修改 `LoadSnapshot()`：实现原子安装，先删除所有旧数据
   - 修改 `FinalizeSnapshot()`：改进错误处理
   - 新增 `CleanupIncompleteSnapshots()`
   - 新增 `AbortSnapshot()`
   - 新增 `VerifySnapshotFile()`

3. `src/paxos/paxos_node.cpp`
   - 修改 `HandleInstallSnapshot()`：完整的错误处理和清理逻辑

## 验证方法

### 测试场景1: 快照传输中途中断

```
1. 启动3节点集群
2. 写入足够数据触发快照
3. 开始向一个follower发送快照
4. 在传输中途断开网络
5. 恢复网络
6. 验证：
   - 临时文件被清理
   - follower状态仍然一致
   - 能够重新开始快照传输
```

### 测试场景2: 快照安装中途崩溃

```
1. 启动3节点集群
2. 写入大量数据
3. 开始向follower发送并安装快照
4. 在安装过程中杀死follower进程
5. 重启follower
6. 验证：
   - 启动时清理不完整的快照文件
   - 数据库状态没有损坏
   - 能够重新同步快照
```

### 测试场景3: 损坏的快照文件

```
1. 手动创建一个损坏的快照文件
2. 触发节点加载该快照
3. 验证：
   - 校验和验证失败
   - 拒绝加载损坏的快照
   - 系统保持可用状态
```

### 测试场景4: 并发快照传输

```
1. 启动3节点集群
2. 同时向多个follower发送快照
3. 随机中断其中一些传输
4. 验证：
   - 各个节点的快照传输互不影响
   - 中断的传输能够正确清理
   - 成功的传输能够正确安装
```

## 安全性保证

1. **原子性**：快照安装要么完全成功，要么完全失败，不会留下中间状态
2. **一致性**：安装前验证完整性，失败时清理所有临时文件
3. **持久性**：成功安装的快照会立即持久化到磁盘
4. **隔离性**：不同快照的传输互不干扰

## 性能影响

- 启动时的清理操作是O(N)，N为快照文件数量，通常很小
- LoadSnapshot需要先遍历整个数据库删除旧数据，时间复杂度O(M)，M为KV数量
- 建议在系统空闲时进行快照操作
