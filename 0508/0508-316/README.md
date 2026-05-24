# Draw & Guess - 你画我猜

基于 WebTransport 的多人实时绘图猜词游戏。

## 功能特性

- 🎨 **实时绘图**：支持画笔、橡皮、颜色选择、粗细调节、清空画布
- 👥 **多人游戏**：每个房间最多 8 名玩家
- 🔄 **轮流绘画**：系统自动轮换绘画者
- 💬 **实时聊天**：聊天区显示猜测消息
- ⭐ **积分系统**：猜中者 +100 分，绘画者根据猜中人数加分
- 📝 **丰富题库**：内置 200 个常用词汇

## 技术栈

- **后端**：Go + webtransport-go
- **前端**：原生 HTML5 + CSS3 + JavaScript
- **通信协议**：WebTransport (基于 QUIC)
- **延迟保证**：< 200ms

## 运行要求

- Go 1.21+
- OpenSSL (用于生成自签名证书)
- 支持 WebTransport 的浏览器 (Chrome 97+, Edge 97+, Safari 16.4+)

## 快速开始

### 1. 安装依赖

```bash
go mod download
```

### 2. 生成证书

Windows:
```bash
generate_cert.bat
```

或手动生成:
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
```

### 3. 启动服务器

Windows:
```bash
start.bat
```

或手动:
```bash
go run main.go
```

### 4. 访问游戏

在浏览器中打开: `https://localhost:4433`

**注意**：由于使用自签名证书，浏览器会提示不安全，选择"高级" -> "继续访问"即可。

## 游戏玩法

1. 输入玩家昵称
2. 输入房间ID加入房间，或留空创建新房间
3. 至少2名玩家加入后，点击"开始游戏"
4. 轮到你绘画时：
   - 在画布上绘制题目词
   - 使用工具栏调整画笔颜色、粗细，或使用橡皮
5. 猜词阶段：
   - 在聊天区输入你的猜测
   - 猜对即可获得分数

## 项目结构

```
.
├── main.go              # 后端服务器代码
├── go.mod               # Go 模块文件
├── static/              # 前端静态文件
│   ├── index.html       # 主页面
│   ├── style.css        # 样式文件
│   └── game.js          # 游戏逻辑
├── generate_cert.bat    # 证书生成脚本 (Windows)
└── start.bat            # 启动脚本 (Windows)
```

## 消息协议

所有消息均为 JSON 格式：

| 消息类型 | 说明 |
|---------|------|
| join | 加入房间 |
| chat | 聊天消息/猜词 |
| draw | 绘图数据 |
| clearCanvas | 清空画布 |
| startGame | 开始游戏 |
| yourTurn | 轮到你绘画 |
| guessTurn | 轮到你猜词 |
| correctGuess | 猜对了 |
| roundEnd | 回合结束 |
| playerJoined | 玩家加入 |
| playerLeft | 玩家离开 |
| playerList | 玩家列表更新 |

## 浏览器兼容性

WebTransport 支持情况：
- Chrome/Edge 97+ ✅
- Safari 16.4+ ✅
- Firefox 114+ ✅ (需开启 `network.webtransport.enabled`)

## 许可证

MIT
