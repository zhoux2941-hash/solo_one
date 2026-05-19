# 区块链分叉和孤儿块处理修复说明

## 问题描述

原始的SPV客户端在同步区块头时存在以下问题：

1. **线性链假设**：假设所有区块头按顺序追加到主链，没有考虑分叉情况
2. **孤儿块直接丢弃**：遇到父块不在主链上的区块（孤儿块）时直接报错，导致同步失败
3. **无法处理链重组**：没有机制处理更长的工作量证明链出现时的链重组（reorg）

## 解决方案

### 1. 新增数据结构

#### `ChainBranch`（链分支）
```rust
pub struct ChainBranch {
    pub start_height: u32,    // 分叉起始高度
    pub block_hashes: Vec<Hash>, // 分支区块哈希列表
    pub total_work: u128,     // 累计工作量
}
```

#### SPVClient内部数据结构
- `block_headers: HashMap<Hash, BlockHeader>` - 所有已知区块头的索引
- `block_work: HashMap<Hash, u128>` - 每个区块的工作量
- `main_chain: Vec<Hash>` - 当前主链（累计工作量最大）
- `branches: Vec<ChainBranch>` - 活跃的链分支列表
- `orphan_pool: HashMap<Hash, BlockHeader>` - 孤儿块池，存储父块未知的区块
- `prev_to_children: HashMap<Hash, HashSet<Hash>>` - 父块到子块的映射，用于构建链结构

### 2. 核心功能改进

#### 孤儿块处理 (`orphan_pool`)
- 当接收到父块未知的区块时，不再报错，而是放入孤儿块池
- 当新区块添加时，自动处理孤儿池，尝试连接可解析的孤儿块
- 支持乱序接收区块（先接收子块，后接收父块）

```rust
// 当父块不在已知链上时，放入孤儿池
if prev_hash != Hash::zero() && !self.block_headers.contains_key(&prev_hash) {
    self.orphan_pool.insert(block_hash, header);
    return Ok(block_hash);
}
```

#### 链分支管理
- 检测到分叉时自动创建新的链分支
- 每个分支独立维护累计工作量
- 分支从分叉点开始独立计算高度

#### 链重组（Reorg）
- 持续监控各分支的累计工作量
- 当某分支的累计工作量超过主链时自动切换主链
- 将原主链的尾部区块移入分支列表
- 新的最长链成为主链

```rust
fn perform_reorg(&mut self, branch_idx: usize) {
    let branch = self.branches.remove(branch_idx);
    
    // 保存原主链的分叉部分到分支
    let fork_height = branch.start_height - 1;
    let old_tip_blocks = self.main_chain[(fork_height + 1) as usize..].to_vec();
    
    // 切换到新的主链
    let mut new_main_chain = self.main_chain[0..=fork_height as usize].to_vec();
    new_main_chain.extend(branch.block_hashes);
    self.main_chain = new_main_chain;
}
```

#### 工作量计算
- 使用比特币风格的难度表示（bits字段）
- 累计工作量用于选择最佳链
- 难度越高（bits越小），单个区块贡献的工作量越大

### 3. 新增公共API

```rust
impl SPVClient {
    // 获取孤儿块数量
    pub fn orphan_count(&self) -> usize
    
    // 获取活跃分支数量
    pub fn branch_count(&self) -> usize
    
    // 检查某区块是否为孤儿块
    pub fn is_orphan(&self, hash: &Hash) -> bool
    
    // 获取分叉链的区块列表
    pub fn get_fork_headers(&self, hash: &Hash) -> Vec<Hash>
}
```

### 4. CLI命令增强

```bash
# 查看链状态（包含分支和孤儿块信息）
cargo run -- chain info

# 查看分叉详细信息
cargo run -- chain fork-info

# 查看孤儿块数量
cargo run -- chain orphans

# 测试分叉和孤儿块处理功能
cargo run -- chain test-fork
```

### 5. RPC接口增强

```http
GET /blocks/info
# 返回包含分支和孤儿块信息的链状态
{
    "best_block_height": 10,
    "best_block_hash": "abc123...",
    "branch_count": 1,
    "orphan_count": 2
}
```

## 工作流程示例

### 场景1：孤儿块解析
1. 接收到区块3（父块为区块2），但区块2尚未接收
2. 区块3被放入`orphan_pool`
3. 稍后接收到区块2
4. 区块2添加后，自动触发孤儿池处理
5. 区块3从孤儿池移除并连接到主链

### 场景2：链分叉
1. 主链：区块0 -> 区块1A
2. 接收到区块1B（父块也为区块0）
3. 检测到分叉，创建新的分支
4. 分支1：区块1A -> 区块2A（累计工作：100）
5. 分支2：区块1B -> 区块2B -> 区块3B（累计工作：150）
6. 由于分支2工作量更大，触发链重组
7. 新主链：区块0 -> 区块1B -> 区块2B -> 区块3B
8. 原分支1成为备用分支

## 技术优势

1. **鲁棒性**：可以处理网络延迟、乱序发送、恶意分叉等情况
2. **兼容性**：遵循比特币的最长链原则
3. **可扩展性**：分支结构可以轻松处理多个竞争链
4. **效率**：孤儿池自动清理机制，避免内存泄漏

## 测试覆盖

单元测试覆盖以下场景：
- 基本区块头添加
- 孤儿块检测与存储
- 孤儿块自动解析
- 链分叉检测
- 链重组触发与执行
- 工作量计算正确性
