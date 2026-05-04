# 四川血战麻将 - 联机游戏

一个完整的四川血战麻将领机游戏实现，包含 Node.js 后端和 Unity WebGL 前端。

## 项目结构

```
128/
├── backend/                    # Node.js 后端
│   ├── src/
│   │   ├── config/            # 游戏配置和常量
│   │   ├── core/              # 核心逻辑
│   │   │   ├── MahjongLogic.ts   # 麻将核心算法
│   │   │   └── RoomManager.ts    # 房间管理
│   │   ├── models/            # 数据模型
│   │   │   ├── MahjongTile.ts    # 麻将牌模型
│   │   │   ├── Player.ts          # 玩家模型
│   │   │   └── Room.ts            # 房间模型
│   │   ├── network/           # 网络层
│   │   │   └── SocketHandler.ts   # Socket.IO 事件处理
│   │   ├── utils/             # 工具类
│   │   │   ├── redis.ts           # Redis 连接管理
│   │   │   └── logger.ts          # 日志系统
│   │   └── index.ts           # 入口文件
│   ├── package.json
│   ├── tsconfig.json
│   └── PROTOCOL.md            # 通信协议文档
│
└── frontend/                   # Unity WebGL 前端
    └── UnityProject/
        └── Assets/
            └── Scripts/
                ├── Core/      # 核心管理类
                │   ├── GameManager.cs
                │   └── GameUIController.cs
                ├── Networking/ # 网络通信
                │   ├── SocketManager.cs
                │   └── UnityThread.cs
                ├── Models/     # 数据模型
                │   ├── TileData.cs
                │   ├── MeldData.cs
                │   ├── PlayerData.cs
                │   └── GameState.cs
                └── UI/          # UI组件
                    ├── TileDisplay.cs
                    ├── HandDisplay.cs
                    ├── MeldDisplay.cs
                    ├── MeldsContainer.cs
                    ├── TileWallDisplay.cs
                    ├── PlayerInfoDisplay.cs
                    ├── ActionPanel.cs
                    └── TileSpriteManager.cs
```

## 功能特性

### 后端特性

**麻将核心逻辑**
- 108张牌（条、万、筒各4张，1-9）
- 完整的洗牌、发牌、摸牌机制
- 胡牌算法：标准胡（3n+2）、七对
- 番数计算：清一色、对对胡、七对、杠数

**碰杠胡系统**
- 碰 (Peng)：碰其他玩家打出的牌
- 明杠 (Gang)：杠其他玩家打出的牌
- 暗杠 (AnGang)：自己手里的四张牌杠
- 补杠 (BuGang)：碰后又摸到相同的牌
- 胡 (Hu)：胡其他玩家打出的牌

**游戏流程**
- 4人游戏，轮流坐庄
- 轮流出牌机制
- 超时自动托管：出牌10秒、动作15秒
- 服务端状态校验，防止客户端作弊

### 前端特性

**UI组件**
- 手牌展示：支持选择、高亮、悬停动画
- 碰杠展示：明杠/暗杠/补杠的不同显示
- 牌墙显示：剩余牌数可视化
- 玩家信息：名字、分数、准备状态、是否轮到出牌
- 动作面板：碰/杠/胡/过 按钮，倒计时显示

**交互**
- 点击选择要出的牌
- 悬停时牌会上浮放大
- 选中时有高亮指示
- 可拖动/点击出牌（按设计实现）

## 技术栈

### 后端
- **Node.js** - 运行时
- **TypeScript** - 类型安全
- **Express** - HTTP服务器
- **Socket.IO** - 实时通信
- **Redis** - 数据持久化（可选，本地开发可跳过）

### 前端
- **Unity 2021+** - 游戏引擎
- **WebGL** - 构建目标
- **Socket.IO Unity Client** - Socket.IO 客户端
- **Newtonsoft.Json** - JSON 序列化

## 快速开始

### 后端启动

1. **安装依赖**
```bash
cd backend
npm install
```

2. **配置 Redis (可选)**
确保 Redis 服务运行在 `localhost:6379`，或者设置环境变量：
```bash
set REDIS_URL=redis://your-redis-host:6379
```

*如果没有 Redis，服务仍可运行，只是数据不会持久化。*

3. **开发模式运行**
```bash
npm run dev
```
服务器将在 `http://localhost:3000` 启动

4. **生产模式**
```bash
npm run build
npm start
```

### 前端设置

1. **安装 Unity 包**
打开 Unity 项目，通过 Package Manager 安装：
- Socket.IO Unity 客户端
- Newtonsoft.Json for Unity

2. **配置服务器地址**
在 `SocketManager.cs` 中修改：
```csharp
public string serverUrl = "http://localhost:3000";  // 修改为你的服务器地址
```

3. **准备麻将牌资源**
- 创建牌的 Sprite 资源
- 按以下规则命名：
  - `wan_1` ~ `wan_9` (万子)
  - `tiao_1` ~ `tiao_9` (条子)
  - `tong_1` ~ `tong_9` (筒子)

- 在 `TileSpriteManager.cs` 中配置 Sprite 数组

4. **设置场景**
- 创建登录、大厅、游戏三个场景/面板
- 配置 `GameUIController` 中的引用

5. **构建 WebGL**
- File -> Build Settings -> WebGL
- Build 到指定目录

## 通信协议

详见 [PROTOCOL.md](backend/PROTOCOL.md)

**核心事件：**
- `player:join` - 玩家登录
- `room:create` - 创建房间
- `room:join` - 加入房间
- `game:ready` - 准备/取消准备
- `game:start` - 开始游戏
- `game:discard` - 出牌
- `game:action` - 响应动作 (peng/gang/hu/pass)

**服务器推送：**
- `room:update` - 房间状态更新
- `game:discarded` - 有玩家出牌
- `game:action_taken` - 有玩家执行动作
- `game:state_update` - 游戏状态更新

## 游戏规则

### 四川血战麻将规则

1. **牌数**：108张，只有条、万、筒，无字牌、风牌
2. **人数**：4人游戏
3. **胡牌条件**：
   - 标准胡：3n + 2 张（4组刻子/顺子 + 1对将）
   - 七对：7个对子
4. **番数类型**：
   - 清一色：3番
   - 对对胡：2番
   - 七对：2番
   - 每杠：1番（暗杠算2番）

### 流程

1. 4人进入房间，各自准备
2. 房主点击开始
3. 发牌：每人13张，庄家多1张（14张）
4. 庄家先出牌
5. 其他玩家可选择碰、杠、胡或过
6. 有人胡牌或牌墙摸完则本局结束

### 超时处理

- **出牌超时**：10秒，自动出刚摸到的牌
- **动作超时**：15秒，如果有胡牌选项则自动胡，否则自动过

## 开发说明

### 后端扩展

- `MahjongLogic.ts` - 添加新的胡牌类型、番数计算
- `Room.ts` - 修改游戏流程、添加新规则
- `SocketHandler.ts` - 添加新的 Socket 事件

### 前端扩展

- `TileDisplay.cs` - 修改牌的视觉效果、动画
- `HandDisplay.cs` - 自定义手牌布局
- `GameUIController.cs` - 添加新的 UI 面板

### 安全考虑

1. 所有操作都在服务端校验
2. 手牌数据仅发送给对应的玩家
3. 牌墙信息只发送剩余数量，不发送具体牌
4. 出牌前服务端验证玩家确实持有该牌

## License

MIT License
