# 异步塔防对战游戏 (Async Tower Defense)

一个支持2人联机对战的异步塔防游戏，使用 **Cocos Creator 3.x + TypeScript** 开发前端，**Node.js + Socket.IO** 实现后端联机服务。

## 🎮 游戏特性

### 核心玩法
- **异步对战机制**：双方各自布防，锁定阵型后互换数据进行自动对战
- **4种防御塔**：箭塔(单体)、火塔(范围)、冰塔(减速)、炮塔(高伤害)
- **4种敌人**：普通兵、快速兵、重装兵、BOSS
- **经济系统**：初始100金币，防守成功获奖励，塔可升级3次
- **排行榜系统**：记录玩家胜率和积分

### 游戏场景
1. **主菜单**：开始对战、排行榜、设置
2. **匹配界面**：搜索对手、等待匹配、取消匹配
3. **布防阶段**：放置/升级/卖出防御塔，预览路径
4. **对战阶段**：自动播放敌人进攻和防御效果
5. **结算界面**：显示胜负、双方数据、排行榜更新

## 📁 项目结构

```
0508-6/
├── server/                 # 后端服务器
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts        # 服务器入口
│       ├── types.ts        # 类型定义
│       └── GameManager.ts  # 游戏管理器
│
├── client/                 # 前端游戏 (Cocos Creator)
│   ├── package.json
│   ├── tsconfig.json
│   └── assets/
│       └── scripts/
│           ├── types/
│           │   └── GameTypes.ts       # 游戏类型定义
│           ├── network/
│           │   └── NetworkManager.ts  # 网络管理器
│           ├── managers/
│           │   └── GameManager.ts     # 游戏状态管理器
│           ├── game/
│           │   ├── Tower.ts           # 防御塔类
│           │   ├── Enemy.ts           # 敌人类
│           │   └── BattleEngine.ts    # 战斗引擎
│           └── scenes/
│               ├── MainMenuScene.ts   # 主菜单
│               ├── MatchmakingScene.ts # 匹配界面
│               ├── DefenseSetupScene.ts # 布防阶段
│               └── BattleScene.ts     # 对战阶段
│
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm 或 yarn
- Cocos Creator 3.8.x

### 安装依赖

#### 后端服务器
```bash
cd server
npm install
```

#### 前端客户端
```bash
cd client
npm install
```

### 启动后端服务器

开发模式（热重载）：
```bash
cd server
npm run dev
```

生产模式：
```bash
cd server
npm run build
npm start
```

服务器将运行在 `http://localhost:3000`

### 启动前端游戏

1. 打开 **Cocos Creator 3.x**
2. 选择 "打开项目"，指向 `client` 目录
3. 配置场景：
   - 主菜单场景：`MainMenuScene`
   - 匹配场景：`MatchmakingScene`
   - 布防场景：`DefenseSetupScene`
   - 战斗场景：`BattleScene`
4. 配置网络地址（默认 `http://localhost:3000`）
5. 点击 "运行" 按钮

## 🏗️ 游戏机制详解

### 防御塔配置

| 塔类型 | 费用 | 伤害(4级) | 范围 | 特殊效果 |
|--------|------|-----------|------|----------|
| 箭塔 🏹 | 15 | 42 | 150-200 | 快速单体 |
| 火塔 🔥 | 25 | 32 | 120-170 | 范围伤害 |
| 冰塔 ❄️ | 20 | 24 | 130-180 | 减速50% |
| 炮塔 💣 | 35 | 100 | 140-190 | 高伤害 |

升级费用：
- Lv1 → Lv2: 20-45金
- Lv2 → Lv3: 35-60金
- Lv3 → Lv4: 50-80金

卖出返还 70% 基础费用

### 敌人配置

| 敌人类型 | 生命值 | 速度 | 奖励 |
|----------|--------|------|------|
| 普通兵 | 50 | 60 | 5金 |
| 快速兵 | 30 | 100 | 8金 |
| 重装兵 | 150 | 35 | 15金 |
| BOSS | 500 | 25 | 50金 |

敌人强度随波次递增（每波+10% HP）

### 战斗流程

1. **波次1**：5个普通兵
2. **波次2**：6普通 + 3快速
3. **波次3**：8普通 + 2重装
4. **波次4**：8快速 + 5普通
5. **波次5**：6普通 + 3重装 + 1 BOSS

每波防守成功奖励 20 金币

## 🔌 网络协议

### Socket.IO 事件

| 事件名 | 方向 | 说明 |
|--------|------|------|
| `join` | C→S | 加入游戏 |
| `join_success` | S→C | 加入成功 |
| `start_matchmaking` | C→S | 开始匹配 |
| `matchmaking_started` | S→C | 匹配已开始 |
| `match_found` | S→C | 找到对手 |
| `submit_layout` | C→S | 提交防御阵型 |
| `battle_start` | S→C | 战斗开始 |
| `submit_battle_result` | C→S | 提交战斗结果 |
| `battle_finished` | S→C | 战斗结束 |
| `get_leaderboard` | C→S | 获取排行榜 |
| `leaderboard_update` | S→C | 排行榜更新 |

## 🎯 游戏流程图示

```
主菜单 → 输入名字 → 连接服务器
  ↓
匹配界面 → 开始匹配 → 等待对手
  ↓ (找到对手后)
布防阶段 → 放置防御塔 → 确认阵型
  ↓ (双方确认后)
对战阶段 → 自动播放战斗
  ↓
结算界面 → 显示胜负 → 返回主菜单
```

## ⚙️ 技术栈

### 后端
- **Node.js** - 运行时环境
- **Express** - HTTP 服务器
- **Socket.IO** - 实时通信
- **TypeScript** - 类型安全

### 前端
- **Cocos Creator 3.x** - 游戏引擎
- **TypeScript** - 游戏脚本
- **Socket.IO Client** - 网络通信

## 📝 注意事项

1. 前端需要手动配置场景和 Prefab
2. 确保后端服务器在客户端运行前已启动
3. 如果使用非本地服务器，修改 `NetworkManager.ts` 中的服务器地址
4. 需要两个客户端或使用浏览器多标签页进行测试

## 🔧 开发建议

1. **测试方法**：打开两个 Cocos Creator 编辑器实例或使用浏览器多标签
2. **单机模式**：可修改代码支持单机AI对战
3. **扩展功能**：
   - 添加更多防御塔和敌人类型
   - 实现技能系统
   - 添加成就系统
   - 支持好友对战

## 📄 许可证

MIT License
