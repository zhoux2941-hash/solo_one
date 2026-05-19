# DistKV - 分布式KV存储引擎

DistKV 是一个基于 Raft 共识算法和 LSM-Tree 存储引擎的分布式键值存储系统。

## 核心特性

### 一致性与复制
- **Raft 共识算法**: 实现强一致性的数据复制
- **自动 Leader 选举**: 故障自动转移
- **日志复制**: 增量同步保证数据一致性
- **线性一致性读**: 通过 ReadIndex 机制实现
- **快照与日志压缩**: 支持状态快照和日志压缩

### 存储引擎
- **LSM-Tree**: 基于日志结构合并树的存储引擎
- **MemTable**: 内存表，写操作首先写入
- **SSTable**: 有序字符串表，持久化存储
- **布隆过滤器**: 加速查询存在性判断
- **层级压缩**: 多层级数据合并优化

### 事务支持
- **单Key事务 (CAS)**: Compare-and-Swap 原子操作
- **跨Key事务 (2PC)**: 简化版两阶段提交
- **事务隔离**: 读写集验证

### 集群管理
- **3/5节点部署**: 支持标准集群配置
- **CLI 管理工具**: 集群状态查看、性能分析
- **数据迁移**: 支持节点间数据迁移

## 项目结构

```
distkv/
├── api/
│   └── proto/          # gRPC 协议定义
├── cmd/
│   ├── server/         # 服务器入口
│   └── cli/            # CLI 工具
├── internal/
│   ├── raft/           # Raft 协议实现
│   ├── lsm/            # LSM-Tree 存储引擎
│   ├── kv/             # KV 存储接口与事务
│   ├── node/           # 节点服务层
│   └── transport/      # 网络传输层
├── pkg/
│   └── client/         # 客户端 SDK
└── go.mod
```

## 快速开始

### 编译
```bash
go build -o distkv-server ./cmd/server
go build -o distkv-cli ./cmd/cli
```

### 启动3节点集群

节点1:
```bash
distkv-server --id node1 --peers node1,node2,node3 --data ./data
```

节点2:
```bash
distkv-server --id node2 --peers node1,node2,node3 --data ./data
```

节点3:
```bash
distkv-server --id node3 --peers node1,node2,node3 --data ./data
```

### 使用 CLI
```bash
distkv-cli
```

CLI 命令:
- `put [key] [value]` - 写入键值对
- `get [key]` - 读取值
- `delete [key]` - 删除键
- `cas [key] [old] [new]` - 比较并交换
- `status` - 查看集群状态
- `benchmark` - 性能基准测试

## 客户端 SDK 使用

```go
import "distkv/pkg/client"

cfg := client.Config{
    Addrs:   []string{"localhost:8080"},
    Timeout: 5 * time.Second,
}

c := client.NewClient(cfg)
defer c.Close()

// 基础操作
c.Put("key", []byte("value"))
val, _ := c.Get("key")
c.Delete("key")

// CAS 操作
success, _ := c.CAS("key", []byte("old"), []byte("new"))

// 事务
txn, _ := c.BeginTxn()
c.TxnPut(txn, "key1", []byte("value1"))
c.TxnGet(txn, "key2")
c.TxnCommit(txn)
```

## Raft 协议实现

### 核心组件
- **Leader**: 处理所有客户端请求
- **Follower**: 被动响应 RPC 请求
- **Candidate**: 选举期间的状态

### 关键机制
- **选举超时**: 随机化超时避免活锁
- **心跳机制**: Leader 定期发送心跳
- **日志匹配**: 保证日志一致性
- **提交机制**: 多数确认后提交
- **Pre-Vote机制**: 防止网络分区时不必要的term增长

### 网络分区修复

本实现针对网络分区场景下的日志一致性问题进行了专门修复：

#### 1. 已提交日志保护
**问题**: 少数派节点在网络恢复后可能会覆盖已提交的日志
**修复**:
```go
// 只有未提交的日志才能被覆盖
if index > r.commitIndex && r.log[index].Term != entry.Term {
    r.log = r.log[:index]
    r.log = append(r.log, entry)
}
```

#### 2. 日志冲突时的安全截断
**问题**: 日志冲突时可能截断到已提交位置之前
**修复**:
```go
conflictIndex := r.findFirstIndexOfTerm(conflictTerm)
if conflictIndex <= r.commitIndex {
    conflictIndex = r.commitIndex + 1  // 不允许截断已提交的日志
}
```

#### 3. Pre-Vote 机制
**问题**: 网络分区的节点重新加入时会发起选举，导致term不必要增长
**修复**:
```go
// 正式选举前先进行Pre-Vote，只有获得多数支持后才增加term
func (r *Raft) startPreVote() {
    preVoteTerm := r.currentTerm + 1
    // ... 获取多数Pre-Vote支持后才发起正式选举
}
```

#### 4. 快照后日志恢复
**问题**: 安装快照后，后续日志索引可能不匹配
**修复**:
```go
// 处理PrevLogIndex小于快照起始索引的情况
if args.PrevLogIndex < r.log[0].Index {
    // 调整Entries数组，跳过已快照的部分
}
```

## LSM-Tree 实现

### 写入流程
1. 写入 MemTable
2. MemTable 满后转为 Immutable
3. 异步刷盘到 SSTable
4. 后台触发 Compaction

### 读取流程
1. 查询 MemTable
2. 查询 Immutable
3. 从 Level 0 到 Level N 查询 SSTable
4. 布隆过滤器快速判断

## 性能特性

- **高吞吐写入**: LSM-Tree 顺序写优化
- **线性扩展性**: 集群可横向扩展
- **高可用**: 自动故障转移
- **数据持久化**:  WAL + SSTable 持久化

## 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| MemTableSize | 64MB | 内存表大小 |
| MaxLevel | 7 | LSM 最大层级 |
| ElectionTimeout | 1000ms | 选举超时 |
| HeartbeatInterval | 100ms | 心跳间隔 |

## 许可证

MIT License
