# 四川血战麻将 Socket.IO 通信协议

## 连接说明

- 服务器地址: `http://localhost:3000`
- 使用 Socket.IO 客户端连接

---

## 客户端发送事件 (Client -> Server)

### 1. 玩家登录
```javascript
// 事件: 'player:join'
// 数据:
{
  "name": "玩家昵称"
}

// 回调响应:
{
  "success": true,
  "player": {
    "id": "socket_id",
    "name": "玩家昵称"
  }
}
```

### 2. 玩家离开
```javascript
// 事件: 'player:leave'
// 数据: 无

// 回调响应:
{
  "success": true
}
```

### 3. 创建房间
```javascript
// 事件: 'room:create'
// 数据:
{
  "name": "房间名称"  // 可选
}

// 回调响应:
{
  "success": true,
  "room": {
    "room": { ... },     // 房间信息
    "myHand": [ ... ],   // 我的手牌
    "myMelds": [ ... ],  // 我的碰杠
    "isMyTurn": false,
    "availableActions": []
  }
}
```

### 4. 加入房间
```javascript
// 事件: 'room:join'
// 数据:
{
  "roomId": "房间ID"
}

// 回调响应:
{
  "success": true,
  "room": { ... }  // 同上
}
```

### 5. 获取房间列表
```javascript
// 事件: 'room:list'
// 数据: 无

// 回调响应:
{
  "success": true,
  "rooms": [
    {
      "id": "房间ID",
      "name": "房间名称",
      "players": [ ... ],
      "gameState": "waiting"
    }
  ]
}
```

### 6. 离开房间
```javascript
// 事件: 'room:leave'
// 数据: 无

// 回调响应:
{
  "success": true
}
```

### 7. 准备/取消准备
```javascript
// 事件: 'game:ready'
// 数据:
{
  "ready": true  // true=准备, false=取消准备
}

// 回调响应:
{
  "success": true
}
```

### 8. 开始游戏
```javascript
// 事件: 'game:start'
// 数据: 无 (只有房主可以开始)

// 回调响应:
{
  "success": true
}
```

### 9. 出牌
```javascript
// 事件: 'game:discard'
// 数据:
{
  "tileId": "牌的唯一ID"
}

// 回调响应:
{
  "success": true
}
```

### 10. 响应动作 (碰/杠/胡/过)
```javascript
// 事件: 'game:action'
// 数据:
{
  "action": "peng",        // 可选: "peng", "gang", "an_gang", "hu", "pass"
  "tileType": "tiao",      // 可选: 杠的时候需要指定牌
  "tileRank": 5             // 可选: 杠的时候需要指定牌
}

// 回调响应:
{
  "success": true
}
```

### 11. 下一局
```javascript
// 事件: 'game:next_round'
// 数据: 无 (只有房主可以开始)

// 回调响应:
{
  "success": true
}
```

---

## 服务器推送事件 (Server -> Client)

### 1. 房间更新
```javascript
// 事件: 'room:update'
// 数据:
{
  "room": {
    "room": {
      "id": "房间ID",
      "name": "房间名称",
      "gameState": "waiting",  // waiting, starting, playing, waiting_action, finished
      "currentPlayerIndex": 0,
      "deck": 108,              // 剩余牌数
      "discardPile": [ ... ],
      "lastDiscardedTile": null,
      "round": 1,
      "players": [
        {
          "id": "玩家ID",
          "name": "玩家昵称",
          "seatIndex": 0,
          "handTiles": 13,      // 手牌数量
          "melds": [ ... ],      // 碰杠
          "discardedTiles": [ ... ],
          "isReady": true,
          "isHost": true,
          "isAI": false,
          "score": 0
        }
      ]
    },
    "myHand": [
      {
        "type": "tiao",         // tiao, wan, tong
        "rank": 1,               // 1-9
        "id": "唯一ID"
      }
    ],
    "myMelds": [
      {
        "type": "peng",          // peng, gang, an_gang, bu_gang
        "tiles": [ ... ],
        "fromPlayer": 1
      }
    ],
    "availableActions": [],       // 可选动作: ["peng", "gang", "hu"]
    "isMyTurn": false
  }
}
```

### 2. 游戏开始
```javascript
// 事件: 'game:started'
// 数据:
{
  "gameState": "playing"
}
```

### 3. 初始状态
```javascript
// 事件: 'game:initial_state'
// 数据: 同 room:update 的 room 结构
```

### 4. 有玩家出牌
```javascript
// 事件: 'game:discarded'
// 数据:
{
  "playerId": "玩家ID",
  "playerSeat": 0,
  "tile": {
    "type": "tiao",
    "rank": 5
  }
}
```

### 5. 有玩家执行动作
```javascript
// 事件: 'game:action_taken'
// 数据:
{
  "playerId": "玩家ID",
  "playerSeat": 1,
  "action": "peng",           // peng, gang, hu, pass
  "tile": {
    "type": "tiao",
    "rank": 5
  }
}
```

### 6. 游戏状态更新
```javascript
// 事件: 'game:state_update'
// 数据: 同 room:update 的 room 结构
```

---

## 牌的类型

| 类型 | 说明 |
|------|------|
| `tiao` | 条 (索子) |
| `wan` | 万 (万子) |
| `tong` | 筒 (饼子) |

---

## 游戏状态

| 状态 | 说明 |
|------|------|
| `waiting` | 等待玩家加入/准备 |
| `starting` | 游戏准备中 |
| `playing` | 游戏进行中 |
| `waiting_action` | 等待玩家响应动作 (碰/杠/胡) |
| `finished` | 本局结束 |

---

## 动作类型

| 动作 | 说明 |
|------|------|
| `peng` | 碰 |
| `gang` | 明杠 (碰别人打出的牌) |
| `an_gang` | 暗杠 (自己手里的四张) |
| `bu_gang` | 补杠 (碰后又摸到一张) |
| `hu` | 胡牌 |
| `pass` | 过 (不执行任何动作) |

---

## 超时设置

| 操作 | 超时时间 |
|------|----------|
| 出牌 | 10秒 |
| 响应动作 (碰/杠/胡) | 15秒 |

超时后服务器自动托管:
- 出牌超时: 自动出刚摸到的牌
- 动作超时: 自动选择"过" (如果有胡牌则自动胡牌)
