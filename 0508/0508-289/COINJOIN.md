# CoinJoin 隐私保护功能说明

## 什么是 CoinJoin？

CoinJoin 是一种比特币隐私保护技术，允许多个用户将他们的交易输入合并到一个单一的交易中，使得外部观察者难以追踪资金流向。

### 工作原理
1. **参与者注册**：多个用户注册参与混币
2. **输入合并**：收集所有参与者的输入
3. **随机排序**：对输入和输出进行随机打乱
4. **输出分配**：创建等量的输出地址
5. **签名广播**：所有参与者签名后广播交易

## 核心功能

### 1. 混币会话管理

#### 创建混币会话
```bash
cargo run -- coinjoin create-session --denomination 100000 --participants 3
```

参数：
- `denomination`：每个参与者混币的金额（默认 100000 satoshi）
- `participants`：需要的参与者数量（默认 3）

响应示例：
```
CoinJoin session created!
  Session ID: 550e8400-e29b-41d4-a716-446655440000
  Denomination: 100000
  Required Participants: 3
```

#### 列出活跃会话
```bash
cargo run -- coinjoin list-sessions
```

响应示例：
```
Active CoinJoin Sessions:
  550e8400-e29b-41d4-a716-446655440000: 2/3 participants, 100000 satoshi - Registering
```

#### 查看会话详情
```bash
cargo run -- coinjoin session-info --session-id <session-id>
```

### 2. 快速混币 (QuickMix)

QuickMix 是一个简化的混币功能，允许你使用多个钱包快速创建一笔混币交易。

```bash
cargo run -- coinjoin quick-mix \
  --wallets wallet1 wallet2 wallet3 \
  --destinations addr1 addr2 addr3 \
  --amount 10000
```

参数：
- `wallets`：参与混币的钱包列表（必须已创建）
- `destinations`：接收混币的目标地址列表
- `amount`：每个钱包混币的金额

工作流程：
1. 从每个钱包收集指定金额的 UTXO
2. 合并所有输入到一笔交易
3. 随机打乱输入和输出顺序
4. 创建等量金额的输出
5. 添加找零输出和手续费输出

### 3. 隐私评分系统

系统会根据地址参与混币的次数计算隐私评分：

```bash
cargo run -- coinjoin privacy-score --address <address>
```

评分等级：
- 🔴 **Poor (0-30)**：隐私保护较弱，建议多混币
- 🟡 **Moderate (31-60)**：基础隐私保护
- 🟢 **Good (61-80)**：良好的隐私保护
- 🌟 **Excellent (81-100)**：强隐私保护

### 4. 统计信息

查看 CoinJoin 系统的整体统计：

```bash
cargo run -- coinjoin stats
```

响应示例：
```
📊 CoinJoin Privacy Statistics
============================
Total Mixes Completed: 5
Active Sessions: 2
Users Waiting to Mix: 4
```

## API 接口

启动 RPC 服务器：
```bash
cargo run -- start --rpc --rpc-port 8080
```

### 可用端点

#### 创建混币会话
```http
POST /coinjoin/sessions
Content-Type: application/json

{
  "denomination": 100000,
  "participants": 3
}
```

响应：
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 列出所有会话
```http
GET /coinjoin/sessions
```

响应：
```json
[
  {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "Registering",
    "current_participants": 2,
    "required_participants": 3,
    "denomination": 100000,
    "fee_per_participant": 1000
  }
]
```

#### 获取会话详情
```http
GET /coinjoin/sessions/{session_id}
```

#### 获取隐私评分
```http
GET /coinjoin/privacy/{address}
```

响应：
```json
{
  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "score": 65,
  "level": "Good"
}
```

## 核心数据结构

### CoinJoinSession
```rust
pub struct CoinJoinSession {
    pub session_id: Uuid,
    pub status: CoinJoinStatus,
    pub required_participants: usize,
    pub current_participants: Vec<Participant>,
    pub denomination: u64,
    pub fee_per_participant: u64,
    pub coordinator_address: Address,
    pub created_at: DateTime<Utc>,
    pub final_transaction: Option<Transaction>,
}
```

### Participant
```rust
pub struct Participant {
    pub id: Uuid,
    pub inputs: Vec<TransactionInput>,
    pub outputs: Vec<TransactionOutput>,
    pub change_output: Option<TransactionOutput>,
    pub signed: bool,
    pub signature: Option<Vec<u8>>,
}
```

### CoinJoinStatus
- `Created` - 会话已创建
- `Registering` - 正在接受参与者注册
- `Signing` - 参与者正在签名
- `Completed` - 混币完成
- `Failed` - 混币失败

## 隐私增强技术

### 1. 随机排序
- 输入随机排序：使用 Fisher-Yates 洗牌算法打乱输入顺序
- 输出随机排序：同样打乱所有输出的顺序
- 打破输入输出的关联关系

### 2. 金额标准化
- 所有参与者使用相同金额进行混币
- 使得外部观察者无法通过金额追踪
- 减少金额分析的可能性

### 3. 多次混币
- 隐私评分鼓励用户多次混币
- 每轮混币增加隐私保护的强度
- 建议至少进行 3-5 轮混币

## 最佳实践

### 提高隐私保护的建议

1. **使用标准金额**
   - 避免非标准金额，使用常用的混币面额
   - 这使得你的交易与其他用户无法区分

2. **多次混币**
   - 不要只进行一次混币
   - 建议使用不同的参与者池进行多轮混币
   - 目标：隐私评分达到 80 以上

3. **分批混合**
   - 将大额资金分成多批分别混币
   - 避免一次性混币过大金额

4. **延迟提款**
   - 混币后不要立即提取资金
   - 等待几个区块确认，最好等待几小时

5. **使用新地址**
   - 每次混币都使用新的接收地址
   - 不要重复使用地址

### 错误处理

1. **会话已满**
   - 当参与者已达到上限时，会收到错误
   - 解决方案：等待下一个会话或创建新会话

2. **金额不足**
   - 钱包余额不足以支付混币金额和手续费
   - 解决方案：存入更多资金或降低混币金额

3. **签名失败**
   - 某个参与者未能正确签名交易
   - 解决方案：会终止会话，参与者可重新参与

## 测试示例

### 完整的 QuickMix 测试流程

```bash
# 1. 查看已创建的钱包（系统已预创建 4 个测试钱包）
cargo run -- wallet list

# 2. 创建一个混币会话
cargo run -- coinjoin create-session --denomination 10000 --participants 2

# 3. 查看活跃会话
cargo run -- coinjoin list-sessions

# 4. 执行快速混币（使用 3 个钱包）
cargo run -- coinjoin quick-mix \
  --wallets wallet1 wallet2 wallet3 \
  --destinations dest1 dest2 dest3 \
  --amount 5000

# 5. 查看统计信息
cargo run -- coinjoin stats

# 6. 检查某个地址的隐私评分
cargo run -- coinjoin privacy-score --address dest1
```

## 安全注意事项

⚠️ **重要提示**：
- 这是一个演示实现，请勿用于生产环境
- 真实的 CoinJoin 需要更复杂的加密和匿名网络
- 生产环境建议使用成熟的实现（如 Wasabi, Samourai, JoinMarket）

### 当前实现的限制
1. 没有使用盲签名技术
2. 缺少匿名网络层（如 Tor）
3. 没有实现 CoinSwap 等高级技术
4. 缺乏零知识证明支持

### 未来改进方向
- [ ] 集成 Chaumian 盲签名
- [ ] 支持 Tor 网络连接
- [ ] 实现 PayJoin 功能
- [ ] 添加 CoinSwap 支持
- [ ] 集成零知识证明

## 相关资源

- **CoinJoin 白皮书**：https://bitcointalk.org/index.php?topic=279249.0
- **Wasabi Wallet**：https://wasabiwallet.io/
- **JoinMarket**：https://github.com/JoinMarket-Org/joinmarket-clientserver
- **ZeroLink 框架**：https://github.com/nopara73/ZeroLink

## 总结

CoinJoin 是比特币生态系统中最重要的隐私保护技术之一。通过将多个用户的交易合并到一笔交易中，CoinJoin 打破了区块链分析中常用的输入输出关联，大大提高了交易的隐私性。

本实现提供了：
✅ 完整的混币会话管理
✅ 参与者注册和签名流程
✅ 随机排序算法
✅ 隐私评分系统
✅ CLI 和 RPC 接口
✅ 单元测试覆盖

通过合理使用 CoinJoin，可以有效保护你的链上隐私，防止区块链分析和追踪。
