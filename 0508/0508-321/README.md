# 基于WebTransport的实时协作电子表格

一个高性能的实时协作电子表格应用，支持多人同时编辑，使用CRDT进行数据同步，延迟<150ms。

## 功能特性

- ✅ **100行 × 26列单元格** (A-Z)
- ✅ **文本和数字输入**
- ✅ **基础公式支持**: SUM, AVERAGE, MAX, MIN
- ✅ **CRDT实时同步**: 多人同时编辑无冲突
- ✅ **单元格格式**: 加粗 / 斜体 / 背景色
- ✅ **列宽行高拖拽调整**
- ✅ **撤销/重做** (最多50步)
- ✅ **Go后端WebTransport服务器**
- ✅ **房间管理系统**
- ✅ **性能优化**: 20人同时编辑延迟<150ms

## 技术架构

### 后端 (Go)
- **WebTransport**: 基于quic-go/webtransport-go实现
- **CRDT**: 基于LWW (Last-Writer-Wins) 的冲突解决策略
- **房间管理**: 多房间支持，每个房间独立的文档状态
- **高并发**: 使用goroutine和channel处理大量并发连接

### 前端 (JavaScript)
- **原生JavaScript**: 无框架依赖，高性能
- **公式引擎**: 支持基础公式计算
- **本地CRDT**: 客户端本地状态管理
- **实时同步**: WebTransport双向数据流

## 快速开始

### 前置要求
- Go 1.21+
- 支持WebTransport的浏览器 (Chrome 97+, Edge 97+, Safari 15.4+)

### 生成SSL证书 (必需！)

WebTransport需要HTTPS连接，请先生成自签名证书：

**Windows (PowerShell):**
```powershell
# 使用生成脚本
.\generate_cert.ps1

# 或者手动执行
go run C:\Go\src\crypto\tls\generate_cert.go --host=localhost
```

**Linux/Mac:**
```bash
go run $GOROOT/src/crypto/tls/generate_cert.go --host=localhost
```

### 安装依赖
```bash
go mod tidy
```

### 启动服务器

**使用HTTPS (推荐，WebTransport必需):**
```bash
go run main.go -tls
```

**使用HTTP (仅用于测试静态文件):**
```bash
go run main.go
```

服务器启动后，访问 `https://localhost:8443` (HTTPS) 或 `http://localhost:8080` (HTTP)

## 使用说明

### 基础操作
1. **选择单元格**: 点击任意单元格
2. **编辑单元格**: 双击单元格或使用顶部公式栏
3. **确认输入**: 按 Enter 键
4. **取消编辑**: 按 Escape 键

### 公式使用
支持以下公式格式：
- `=SUM(A1:A5)` - 计算范围内数值的和
- `=AVERAGE(B1:B10)` - 计算平均值
- `=MAX(C1:C20)` - 找出最大值
- `=MIN(D1:D15)` - 找出最小值
- `=A1+B1*C1` - 基础算术运算

### 格式化
- **加粗**: 点击工具栏 B 按钮，或按 Ctrl+B
- **斜体**: 点击工具栏 I 按钮，或按 Ctrl+I
- **背景色**: 使用颜色选择器

### 调整大小
- **列宽**: 拖动列标题右侧边缘
- **行高**: 拖动行标题底部边缘

### 撤销/重做
- **撤销**: 点击 ↶ 按钮，或按 Ctrl+Z
- **重做**: 点击 ↷ 按钮，或按 Ctrl+Y

## 性能特性

- **延迟目标**: <150ms 端到端
- **并发支持**: 20+ 同时在线用户
- **CRDT合并**: 基于时间戳的LWW策略，无冲突
- **消息缓冲**: 服务器端消息队列防止消息丢失
- **自动重连**: 连接断开后自动重试

## 项目结构

```
webtransport-spreadsheet/
├── main.go                 # 应用入口
├── go.mod                  # Go模块定义
├── server/
│   ├── webtransport.go     # WebTransport服务器实现
│   ├── room.go             # 房间和客户端管理
│   └── crdt.go             # CRDT数据结构和操作
└── static/
    ├── index.html          # HTML页面
    ├── style.css           # 样式文件
    └── app.js              # 前端JavaScript
```

## 核心组件说明

### CRDT 实现 (server/crdt.go)
- 使用 Last-Writer-Wins (LWW) 策略解决冲突
- 每个操作带有时间戳和客户端ID
- 自动合并并发修改
- 支持单元格值、格式、列宽、行高的同步

### WebTransport 服务器 (server/webtransport.go)
- 基于quic-go/webtransport-go
- 支持多路复用流
- 高效二进制传输
- 自动连接管理

### 前端状态管理 (static/app.js)
- 本地CRDT状态同步
- 公式计算引擎
- 撤销/重做栈管理
- 响应式UI更新

## 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 97+      |
| Edge   | 97+      |
| Safari | 15.4+    |
| Firefox| 114+     |

注意: 某些浏览器可能需要在 about:flags 中启用 WebTransport 支持

## 生产部署建议

1. **使用反向代理**: Nginx + SSL 终止
2. **证书管理**: 使用 Let's Encrypt 获取有效SSL证书
3. **负载均衡**: 多实例部署支持更多并发用户
4. **持久化**: 添加Redis或数据库进行状态持久化
5. **监控**: 添加Prometheus指标监控

## 许可证

MIT License
