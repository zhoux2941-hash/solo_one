## 1. 架构设计

```mermaid
flowchart TD
    "UI层[React组件]" --> "逻辑层[Huffman算法引擎]"
    "逻辑层" --> "可视化层[Canvas树渲染]"
    "UI层" --> "状态管理[React State]"
    "状态管理" --> "UI层"
    "逻辑层" --> "状态管理"
    "可视化层" --> "UI层"
```

纯前端单页应用，无后端依赖。所有Huffman算法逻辑在浏览器端执行。

## 2. 技术说明
- 前端框架：React@18 + TypeScript
- 样式方案：Tailwind CSS@3
- 构建工具：Vite
- 树可视化：Canvas API（自绘二叉树，支持逐步动画）
- 状态管理：React useState + useReducer
- 无后端、无数据库

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 主页面，包含全部功能模块 |

单页应用，无需多路由。

## 4. 核心数据结构

### 4.1 HuffmanNode
```typescript
interface HuffmanNode {
  id: string;
  char: string | null;
  freq: number;
  left: HuffmanNode | null;
  right: HuffmanNode | null;
}
```

### 4.2 BuildStep（逐步演示步骤）
```typescript
interface BuildStep {
  stepIndex: number;
  description: string;
  forest: HuffmanNode[];
  mergedNode: HuffmanNode | null;
}
```

### 4.3 CodeEntry（编码表条目）
```typescript
interface CodeEntry {
  char: string;
  freq: number;
  code: string;
  codeLength: number;
}
```

### 4.4 CompressionResult（压缩对比）
```typescript
interface CompressionResult {
  originalBits: number;
  huffmanBits: number;
  compressionRatio: number;
}
```

## 5. 核心算法流程

1. **频率统计**：遍历输入文本，统计每个字符出现次数
2. **构建Huffman树**：
   - 初始化：每个字符创建叶子节点，放入优先队列（最小堆）
   - 循环：取出两个最小频率节点，合并为新节点（频率=两者之和），新节点放回队列
   - 终止：队列只剩一个节点，即为根节点
   - 记录每一步的森林状态用于逐步演示
3. **生成编码**：从根节点DFS遍历，左路径标0，右路径标1，到达叶子节点即得到该字符的编码
4. **压缩对比**：原始比特数 = 字符数 × 8，Huffman比特数 = Σ(字符频率 × 码长)

## 6. 组件结构

```
App
├── TextInput          # 文本输入区
├── FrequencyChart     # 频率统计柱状图
├── HuffmanTreeCanvas  # Huffman树Canvas可视化
├── EncodingTable      # 编码表
├── CompressionCompare # 压缩对比
├── StepByStepDemo     # 逐步演示控制
└── ExportButton       # 导出JSON按钮
```
