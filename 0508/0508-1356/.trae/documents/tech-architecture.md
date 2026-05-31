## 1. 架构设计

```mermaid
flowchart TD
    "前端展示层" --> "业务逻辑层"
    "业务逻辑层" --> "工具函数层"
    "前端展示层" --> "状态管理层"
```

- **前端展示层**：React 组件，负责 UI 渲染与用户交互
- **业务逻辑层**：自定义 Hook，管理输入状态与计算流程
- **工具函数层**：纯函数，实现括号匹配算法，无副作用
- **状态管理层**：Zustand store 管理应用状态

## 2. 技术说明
- 前端：React@18 + TypeScript + Tailwind CSS + Vite
- 初始化工具：vite-init
- 后端：无（纯前端应用）
- 数据库：无

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 主页面，包含括号输入与结果展示 |

## 4. 文件结构

```
src/
├── utils/
│   └── bracketMatcher.ts    # 括号匹配核心算法（纯函数）
├── hooks/
│   └── useBracketMatch.ts   # 括号匹配业务逻辑 Hook
├── components/
│   ├── BracketInput.tsx      # 输入区域组件
│   ├── ResultDisplay.tsx     # 结果展示组件
│   └── ExampleButtons.tsx   # 示例快捷按钮组件
├── pages/
│   └── Home.tsx              # 主页面
├── App.tsx                   # 应用入口
└── main.tsx                  # 渲染入口
```

## 5. 核心算法设计

### bracketMatcher 函数
- **输入**：`string`（括号字符串）
- **输出**：`{ valid: boolean; maxDepth: number; error?: string }`
- **算法**：栈匹配
  - 维护一个栈 `stack` 和当前深度 `depth`、最大深度 `maxDepth`
  - 遍历每个字符：
    - 左括号 `{ [ (` → 入栈，`depth++`，更新 `maxDepth`
    - 右括号 `} ] )` → 检查栈顶是否为对应左括号，匹配则出栈 `depth--`，不匹配则返回非法
  - 遍历结束后栈非空则非法
- **职责**：纯计算，无 DOM 操作，无副作用

### useBracketMatch Hook
- **职责**：管理输入状态、调用算法、返回结果
- **状态**：`input`（输入值）、`result`（计算结果）
