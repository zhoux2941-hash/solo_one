# SPV Light Node

一个用Rust实现的比特币风格SPV（简化支付验证）轻节点，支持区块头同步、Merkle树验证、钱包管理、P2P网络和跨链原子交换。

## 功能特性

### 核心功能
- **SPV客户端**: 同步区块头，不下载完整区块
- **Merkle树验证**: 使用Merkle证明验证交易存在性
- **钱包管理**: 创建钱包、生成地址、签名交易
- **P2P网络**: 使用gossip协议进行节点间数据同步
- **链上查询**: 地址余额、交易历史查询
- **跨链原子交换**: 使用哈希时间锁(HTLC)实现代币交换
- **CLI和RPC接口**: 完整的命令行和REST API接口

## 项目结构

```
src/
├── crypto.rs          # 密码学工具（哈希、签名、密钥）
├── types.rs           # 核心数据结构（区块头、交易、Hash等）
├── merkle.rs          # Merkle树实现
├── wallet.rs          # 钱包管理模块
├── spv.rs             # SPV客户端实现
├── p2p.rs             # P2P网络和gossip协议
├── chain.rs           # 链状态和数据查询
├── atomic_swap.rs     # 跨链原子交换（HTLC）
├── rpc.rs             # RPC API服务器
├── cli.rs             # CLI命令处理
├── main.rs            # 主程序入口
└── wallet_cli.rs      # 独立钱包CLI
```

## 编译和运行

### 编译项目

```bash
cargo build --release
```

### 运行节点

启动节点并开启RPC服务器：

```bash
cargo run -- start --rpc --rpc-port 8080
```

### 使用CLI

#### 钱包管理

```bash
# 创建钱包
cargo run -- wallet create mywallet

# 列出所有钱包
cargo run -- wallet list

# 查看钱包余额
cargo run -- wallet balance mywallet

# 发送交易
cargo run -- wallet send mywallet 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa 100000 1000
```

#### 链查询

```bash
# 查看链状态
cargo run -- chain info

# 查询地址余额
cargo run -- chain balance 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa

# 查询地址详情
cargo run -- chain address 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa

# 查询交易详情
cargo run -- chain tx <tx_hash>
```

#### 跨链原子交换

```bash
# 发起原子交换
cargo run -- swap initiate \
  --initiator <address1> \
  --participant <address2> \
  --initiator-chain BTC \
  --participant-chain ETH \
  --initiator-amount 100000 \
  --participant-amount 1000000 \
  --timelock 100

# 列出所有交换
cargo run -- swap list

# 查看交换详情
cargo run -- swap info <swap_id>
```

### 使用独立钱包CLI

```bash
# 创建新钱包
cargo run --bin wallet-cli -- create --wallet-file mywallet.json

# 查看钱包信息
cargo run --bin wallet-cli -- info --wallet-file mywallet.json

# 查看钱包地址
cargo run --bin wallet-cli -- address --wallet-file mywallet.json
```

## RPC API

启动RPC服务器后，可以通过以下API端点访问：

### 健康检查
```
GET /health
```

### 钱包API
```
POST /wallets          # 创建钱包
GET  /wallets          # 列出钱包
GET  /wallets/:name    # 获取钱包信息
```

### 交易API
```
POST /transactions     # 创建交易
```

### 链查询API
```
GET /addresses/:address/balance  # 获取地址余额
GET /addresses/:address/info     # 获取地址详情
GET /transactions/:tx_hash       # 获取交易详情
GET /blocks/height               # 获取区块高度
```

### 原子交换API
```
POST /swaps            # 发起交换
GET  /swaps            # 列出交换
GET  /swaps/:swap_id   # 获取交换详情
```

## 技术实现细节

### SPV客户端
- 同步区块头链而不是完整区块
- 使用Merkle证明验证交易包含在区块中
- 维护区块头索引用于快速查找

### Merkle树
- 支持从交易列表构建Merkle树
- 生成Merkle包含证明
- 验证交易存在性

### 钱包
- 使用secp256k1椭圆曲线算法
- 支持P2PKH地址格式
- 交易创建和签名
- UTXO管理

### P2P网络
- 基于libp2p框架
- 使用Gossipsub协议进行消息广播
- 支持区块头和交易的传播

### 原子交换
- 哈希时间锁合约(HTLC)
- 支持多链代币交换
- 秘密揭示和赎回机制
- 超时退款机制

## 依赖

- `secp256k1`: 椭圆曲线密码学
- `sha2`: SHA-256哈希函数
- `tokio`: 异步运行时
- `axum`: Web框架
- `libp2p`: P2P网络库
- `clap`: CLI参数解析
- `serde`: 序列化/反序列化

## 注意事项

这是一个教育性质的实现，用于演示SPV节点和跨链原子交换的工作原理。在生产环境中使用前请进行充分的安全审计。

## 许可证

MIT
