# 分布式配置中心

类似 Apollo/Nacos 的轻量级分布式配置中心，基于 etcd 存储，支持多环境、版本管理、灰度发布和长轮询热更新。

## 核心功能

### 🎯 配置管理
- 支持 YAML/JSON/Properties 三种格式
- 多环境隔离（dev/test/prod）
- 命名空间支持

### 🔄 版本管理
- 自动版本记录
- 一键回滚到历史版本
- 变更历史查询

### 🚀 灰度发布
- **按IP灰度**：指定特定IP获取灰度配置
- **按标签灰度**：根据客户端标签进行灰度
- **按比例灰度**：按百分比渐进式发布

### ⚡ 热更新
- 30秒长轮询机制
- 配置变更立即推送
- 客户端 SDK 自动更新

### 📋 审计与通知
- 完整的操作审计日志
- Webhook 配置变更通知

## 技术栈

| 组件 | 技术 |
|------|------|
| 服务端 | Go + Gin |
| 存储 | etcd |
| Web界面 | React + Ant Design |
| SDK | Go / Java |

## 快速开始

### 方式一：Docker Compose（推荐）

```bash
# 启动所有服务
docker-compose up -d

# 查看状态
docker-compose ps
```

访问 Web 管理界面: http://localhost:3000

### 方式二：本地开发

#### 1. 启动 etcd
```bash
docker run -d --name etcd \
  -p 2379:2379 \
  -e ALLOW_NONE_AUTHENTICATION=yes \
  bitnami/etcd:3.5
```

#### 2. 启动服务端
```bash
cd server
go mod download
go run cmd/main.go
```

#### 3. 启动 Web 界面
```bash
cd web
npm install
npm start
```

## API 接口

### 配置管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/configs | 创建配置 |
| PUT | /api/v1/configs | 更新配置 |
| DELETE | /api/v1/configs | 删除配置 |
| GET | /api/v1/configs | 获取配置列表 |
| POST | /api/v1/configs/rollback | 回滚版本 |
| GET | /api/v1/configs/versions | 获取版本历史 |

### 长轮询

```bash
POST /api/v1/long-poll
{
  "app_id": "demo-app",
  "namespace": "default",
  "environment": "dev",
  "last_version": {"database": 1, "redis": 2},
  "tags": {"env": "beta"}
}
```

### 灰度发布

```bash
POST /api/v1/gray
{
  "config_id": "xxx",
  "gray_value": "灰度配置内容",
  "gray_type": "ip",
  "ip_list": ["192.168.1.100"],
  "is_enabled": true
}
```

## Go SDK 使用示例

```go
package main

import (
    "fmt"
    configclient "config-center/sdk/go"
)

func main() {
    client := configclient.NewConfigClient(
        "http://localhost:8080",
        "demo-app",
        "default",
        "dev",
    )

    // 添加标签（用于灰度）
    client.AddTag("env", "beta")

    // 配置变更回调
    client.OnChange(func(configs map[string]interface{}) {
        fmt.Println("配置更新:", configs)
    })

    // 启动客户端
    client.Start()

    // 获取配置
    dbHost, _ := client.GetString("database.host")
    fmt.Println("数据库地址:", dbHost)

    select {}
}
```

## Java SDK 使用示例

```java
import com.configcenter.sdk.ConfigClient;

public class Demo {
    public static void main(String[] args) throws IOException {
        ConfigClient client = new ConfigClient(
            "http://localhost:8080",
            "demo-app",
            "default",
            "dev"
        );

        client.addTag("env", "beta");

        client.onChange(configs -> {
            System.out.println("配置更新: " + configs);
        });

        client.start();

        String dbHost = client.getString("database.host");
        System.out.println("数据库地址: " + dbHost);
    }
}
```

## 项目结构

```
.
├── server/                 # Go 服务端
│   ├── cmd/               # 入口
│   ├── internal/
│   │   ├── api/          # HTTP 接口
│   │   ├── config/       # 配置服务
│   │   ├── storage/      # etcd 存储
│   │   ├── model/        # 数据模型
│   │   ├── gray/         # 灰度策略
│   │   └── audit/        # 审计日志
│   └── go.mod
├── web/                   # React 管理界面
│   ├── src/
│   │   └── components/
│   └── package.json
├── sdk/
│   ├── go/               # Go SDK
│   └── java/             # Java SDK
├── docker-compose.yml
└── README.md
```

## 核心特性说明

### 多环境隔离
每个环境的配置完全隔离，支持：
- dev（开发环境）
- test（测试环境）
- prod（生产环境）

### 灰度策略
1. **IP灰度**：精准控制特定机器
2. **标签灰度**：按用户群/业务线划分
3. **比例灰度**：平滑发布，风险可控

### 长轮询机制
- 客户端发送当前版本号
- 服务端等待最多30秒
- 有变更立即返回新配置
- 无变更返回 304，客户端继续轮询

## 性能优化（高并发场景）

### 🔧 已解决的问题
1. **内存泄漏**
   - 添加 `sync.RWMutex` 保护 `watchChans` 并发访问
   - 实现完整的通道清理机制，防止 goroutine 泄漏
   - 每分钟自动清理超时连接（35秒超时）

2. **连接数爆炸**
   - 最大连接数限制（默认 10,000）
   - 连接计数原子操作
   - 超出限制返回 429 Too Many Requests
   - 连接池化管理

3. **事件风暴（频繁变更）**
   - 实现事件防抖合并机制（100ms 窗口）
   - 相同应用/命名空间的多次变更合并为一次通知
   - 防止每秒 100+ 次变更导致的推送风暴

4. **HTTP 客户端优化**
   - 复用 `http.Client`，避免每次创建新连接
   - 配置连接池：MaxIdleConns=100, IdleConnTimeout=90s
   - Webhook 发送性能提升显著

### 📊 监控接口
```bash
# 健康检查
GET /health
# 返回: {"status": "ok", "time": 1234567890}

# 性能指标
GET /metrics
# 返回: {"active_connections": 156, "timestamp": 1234567890}
```

### 🏋️ 压力测试
```bash
# 运行压测脚本
go run stress_test.go

# 典型场景：
# - 100 并发长轮询连接
# - 每秒 100 次配置更新
# - 持续 30 秒
# - 无内存泄漏，连接数稳定
```

### ⚙️ 可配置参数
```go
// 设置最大连接数
configService.SetMaxConnections(50000)

// 默认值：
// - DefaultMaxConnections: 10000
// - DefaultDebounceTime: 100ms
// - ConnectionTimeout: 35s
```

### 数据存储
所有数据存储在 etcd 中，目录结构：
```
/configs/{env}/{app}/{namespace}/{key}
/versions/{env}/{app}/{namespace}/{key}/{version}
/gray/{config_id}
/audit/{app}/{timestamp}
/webhook/{app}/{id}
```

## Webhook 签名验证

Webhook 请求会携带签名头 `X-Config-Signature`，验证方式：
```javascript
const crypto = require('crypto');
const signature = crypto.createHash('sha256')
  .update(JSON.stringify(body) + secret)
  .digest('hex');
```

## License

MIT
