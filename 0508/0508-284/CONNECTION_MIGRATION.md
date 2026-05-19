# 连接迁移功能说明

## 概述

连接迁移（Connection Migration）是类似 QUIC 协议的关键特性，允许在客户端 IP 地址或端口发生变化时（如从 WiFi 切换到移动网络，或 NAT 会话超时）保持连接不中断。

## 核心特性

### 1. 多连接ID支持
- 每个连接最多支持 8 个活跃的连接 ID
- 每个连接 ID 有独立的序列号
- 支持动态添加和淘汰连接 ID

### 2. 多路径管理
- 每个连接最多支持 4 条并行路径
- 每条路径有独立的状态跟踪
- 自动选择最优路径发送数据

### 3. 路径验证机制
- 使用 PATH_CHALLENGE/PATH_RESPONSE 握手验证新路径
- 128 位随机挑战数据，防止欺骗攻击
- 最多 3 次验证尝试，超时时间 3 秒

### 4. 地址更新通知
- 主动通知对端地址变化
- 支持 IPv4 和 IPv6 地址
- 迁移完成后自动切换到新路径

## 协议消息类型

### PATH_CHALLENGE (0x0B)
用于发起路径验证，包含 16 字节随机挑战数据

```c
struct PathChallenge {
    uint64_t challenge_data[2];  // 128位随机数
};
```

### PATH_RESPONSE (0x0C)
响应路径验证请求，回显收到的挑战数据

```c
struct PathResponse {
    uint64_t response_data[2];  // 回显的挑战数据
};
```

### NEW_CONNECTION_ID (0x0D)
通知对端新的连接 ID

```c
struct NewConnectionId {
    uint32_t new_connection_id;  // 新的连接ID
    uint8_t retire_prior_to;     // 淘汰小于此序列号的所有ID
    uint8_t sequence_number;      // 本ID的序列号
};
```

### RETIRE_CONNECTION_ID (0x0E)
请求淘汰指定的连接 ID

```c
struct RetireConnectionId {
    uint32_t connection_id;  // 要淘汰的连接ID
};
```

### ADDRESS_UPDATE (0x0F)
通知对端自己的地址已更新

```c
struct AddressUpdate {
    uint8_t ip_type;         // IPV4(4) 或 IPV6(6)
    uint8_t ip_bytes[16];    // IP地址字节
    uint16_t port;           // 端口号
};
```

## 路径状态

```
UNKNOWN     → 初始状态，未验证
PROBING     → 正在验证中
VALIDATED   → 已验证，可用于数据传输
FAILED      → 验证失败，不可用
```

## 迁移流程

### 客户端 WiFi → 移动网络 切换场景

```
客户端                          服务器
  |                              |
  |  [检测到网络变化]            |
  |                              |
  |  PATH_CHALLENGE →            |  新地址验证
  |                              |
  |  ← PATH_RESPONSE             |
  |                              |
  |  [路径验证成功]              |
  |                              |
  |  切换到新地址发送数据        |
  |  ADDRESS_UPDATE →            |
  |                              |
  |  ← 数据继续在新地址传输      |
```

## API 接口

### Connection 类新增方法

```cpp
// 设置迁移回调
void set_migration_callback(AddressCallback callback);

// 获取当前对端地址
NetworkAddress get_peer_address() const;

// 获取所有已知的对端地址
std::vector<NetworkAddress> get_all_peer_addresses() const;

// 主动迁移到新地址
bool migrate_to_new_address(const NetworkAddress& new_addr);

// 检查是否正在迁移中
bool is_migration_in_progress() const;

// 获取已验证的路径数量
size_t get_active_path_count() const;

// 添加新的连接ID
bool add_connection_id(uint32_t new_cid, uint8_t sequence);

// 淘汰指定的连接ID
void retire_connection_id(uint32_t cid);

// 获取所有活跃的连接ID
std::vector<uint32_t> get_active_connection_ids() const;
```

### 使用示例

```cpp
Connection conn;

// 设置迁移回调
conn.set_migration_callback([](const NetworkAddress& old_addr,
                                const NetworkAddress& new_addr) {
    std::cout << "连接已迁移: " << old_addr.to_string() 
              << " → " << new_addr.to_string() << std::endl;
});

// 连接建立后，检测到网络变化时
if (network_changed) {
    NetworkAddress new_addr("192.168.1.100", 54321);
    conn.migrate_to_new_address(new_addr);
}

// 检查迁移状态
if (conn.is_migration_in_progress()) {
    std::cout << "正在迁移连接..." << std::endl;
}
```

## 安全特性

1. **路径验证**: 所有新地址必须经过 PATH_CHALLENGE/PATH_RESPONSE 握手验证
2. **随机挑战**: 使用 128 位随机数，防止重放攻击
3. **连接ID绑定**: 数据包必须使用有效的连接 ID，否则丢弃
4. **超时保护**: 路径验证有超时机制，防止资源耗尽

## 性能优化

1. **零中断**: 迁移过程中数据传输不中断
2. **快速切换**: 路径验证在 1-2 RTT 内完成
3. **多路径支持**: 同时保持多条路径可用，自动选择最优路径
4. **平滑过渡**: 新路径验证成功后才切换，避免数据包丢失

## 限制

- 最大同时路径数: 4 条
- 最大活跃连接ID数: 8 个
- 路径验证超时: 3 秒
- 最大验证尝试: 3 次

## 与 QUIC 的对比

| 特性 | 本实现 | QUIC |
|------|--------|------|
| 连接迁移 | ✓ | ✓ |
| 多连接ID | ✓ | ✓ |
| 路径验证 | ✓ | ✓ |
| 0-RTT握手 | ✗ | ✓ |
| 加密 | ✗ | ✓ |
| 流量控制 | ✓ | ✓ |
| 拥塞控制 | ✓ | ✓ |
| 多流复用 | ✓ | ✓ |
| 前向纠错 | ✓ | ✗ |
