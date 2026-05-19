# PaxosKV - 基于Paxos共识算法的分布式键值存储系统

## 项目概述

PaxosKV是一个使用C++实现的分布式键值存储系统，基于Paxos共识算法保证数据一致性。系统支持3节点集群，自动选举主节点，提供gRPC接口进行键值读写操作。

## 核心特性

- **Paxos共识算法**: 实现了完整的Paxos协议（Proposer/Acceptor/Learner角色）
- **自动主节点选举**: 基于Raft风格的领导者选举机制
- **持久化存储**: 使用RocksDB进行数据持久化
- **日志持久化**: 所有操作日志持久化到磁盘
- **快照机制**: 支持定期快照和日志压缩
- **故障恢复**: 处理网络分区和节点宕机恢复
- **gRPC接口**: 提供高性能的Put/Get/Delete接口
- **CLI客户端**: 交互式命令行工具进行测试和集群管理

## 性能指标

- 3节点集群写入延迟: <5ms
- 读取延迟: <2ms
- 支持高并发读写

## 系统架构

```
┌───────────────────────────────────────────────────────────┐
│                     Client CLI / gRPC                     │
└──────────────────────┬────────────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │         Leader Node         │
        │  (处理客户端请求, 复制日志)  │
        └──────┬───────────┬──────────┘
               │           │
    ┌──────────▼──┐   ┌────▼──────────┐
    │ Follower 1  │   │ Follower 2    │
    │ (日志复制)   │   │ (日志复制)     │
    └─────────────┘   └───────────────┘
```

## 目录结构

```
├── CMakeLists.txt              # CMake构建配置
├── proto/                      # Protobuf定义
│   ├── kv.proto               # KV服务接口定义
│   ├── paxos.proto            # Paxos协议消息定义
│   └── CMakeLists.txt
├── include/                    # 头文件
│   ├── common/                # 通用工具
│   │   ├── config.h           # 配置类
│   │   └── utils.h            # 工具函数
│   ├── kv/                    # KV存储相关
│   │   ├── storage_engine.h   # RocksDB存储引擎
│   │   └── kv_server.h        # KV服务实现
│   └── paxos/                 # Paxos协议相关
│       ├── log_manager.h      # 日志管理
│       ├── snapshot_manager.h # 快照管理
│       └── paxos_node.h       # Paxos节点
├── src/                        # 源代码
│   ├── common/
│   ├── kv/
│   ├── paxos/
│   ├── server_main.cpp        # 服务端入口
│   └── client_main.cpp        # 客户端入口
├── data/                      # 数据目录
└── logs/                      # 日志目录
```

## 编译指南

### 依赖库

- C++17 编译器
- CMake >= 3.15
- gRPC
- Protobuf
- RocksDB
- spdlog
- OpenSSL

### 编译步骤

```bash
# 创建构建目录
mkdir -p build && cd build

# 配置CMake
cmake .. -DCMAKE_BUILD_TYPE=Release

# 编译
make -j$(nproc)
```

### Windows编译

```bash
mkdir build
cd build
cmake .. -DCMAKE_BUILD_TYPE=Release -G "Visual Studio 17 2022"
cmake --build . --config Release
```

## 使用指南

### 启动3节点集群

在三个不同的终端中分别运行：

```bash
# 节点1
./paxos_kv_server 1

# 节点2
./paxos_kv_server 2

# 节点3
./paxos_kv_server 3
```

### 使用自定义集群配置

```bash
./paxos_kv_server 1 --cluster "1:192.168.1.1:8001:9001,2:192.168.1.2:8002:9002,3:192.168.1.3:8003:9003"
```

### 启动CLI客户端

```bash
# 连接到默认端口8001
./paxos_kv_client

# 连接到指定地址
./paxos_kv_client localhost:8001
```

### CLI命令

```
put <key> <value>    # 存储键值对
get <key>            # 获取值
delete <key>         # 删除键值对
status               # 查看集群状态
snapshot             # 手动创建快照
bench <num> <size>   # 性能测试
help                 # 显示帮助
exit                 # 退出
```

## API接口

### gRPC服务定义

```protobuf
service KVService {
    rpc Put(PutRequest) returns (PutResponse);
    rpc Get(GetRequest) returns (GetResponse);
    rpc Delete(DeleteRequest) returns (DeleteResponse);
    rpc GetStatus(GetStatusRequest) returns (GetStatusResponse);
    rpc TakeSnapshot(SnapshotRequest) returns (SnapshotResponse);
}
```

## 核心实现细节

### Paxos协议实现

1. **Prepare阶段**: Proposer发送Prepare请求，收集Acceptor的Promise
2. **Accept阶段**: 获得多数Promise后，发送Accept请求
3. **Learn阶段**: 一旦被多数Acceptor接受，通知所有Learner

### 日志复制

- 每条日志包含: index, term, type, key, value, timestamp
- 日志持久化到RocksDB
- 支持日志截断和压缩

### 快照机制

- 定期创建状态机快照
- 快照包含所有已提交的键值对
- 支持增量安装快照到落后节点

### 故障处理

- 节点宕机后自动恢复，从磁盘加载日志和快照
- 网络分区时自动重新选举
- 节点重新加入时自动同步日志和快照

## 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| election_timeout_ms | 5000 | 选举超时时间 |
| heartbeat_interval_ms | 1000 | 心跳间隔 |
| snapshot_interval_s | 300 | 自动快照间隔 |
| log_compaction_threshold | 10000 | 日志压缩阈值 |
| max_append_entries | 100 | 单次最大复制条目数 |
| rpc_timeout_ms | 2000 | RPC超时时间 |

## 监控与运维

### 集群状态查看

```bash
# 在CLI中执行
status
```

输出示例：
```
=== Cluster Status ===
Leader ID: 1
Cluster Size: 3

Nodes:
  Node 1 (0.0.0.0:8001)
    Leader: YES
    Alive: YES
    Commit Index: 100
    Last Applied: 100
    Log Size: 100

  Node 2 (0.0.0.0:8002)
    Leader: NO
    Alive: YES
    Match Index: 100
```

### 性能测试

```bash
# 运行1000次操作，值大小100字节
bench 1000 100
```

## License

MIT License
