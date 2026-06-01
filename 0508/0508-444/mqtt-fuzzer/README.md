# MQTT Fuzzer - MQTT Broker 协议模糊测试引擎

一个用Go语言实现的MQTT Broker协议模糊测试引擎，不依赖现成fuzz框架，完全自主实现。

## 功能特性

- 支持 MQTT v3.1.1 和 v5.0 协议
- 支持6种报文类型的模糊测试:
  - CONNECT
  - PUBLISH
  - SUBSCRIBE
  - UNSUBSCRIBE
  - DISCONNECT
  - PINGREQ

- 多种畸形构造规则:
  - `invalid_remaining_length` - 剩余长度字段故意填错
  - `wrong_protocol_name` - 协议名大小写乱改
  - `duplicate_packet_id` - 重复的报文标识符
  - `payload_empty_bytes` - payload里塞空字节
  - `payload_long_string` - payload里塞超长字符串
  - `invalid_flags_combination` - 标志位组合违规
  - `variable_header_mismatch` - 可变头长度不匹配
  - `truncated_packet` - 截断报文
  - `garbage_bytes` - 追加垃圾字节
  - `invalid_qos_value` - 无效QoS值

- 四种测试结果分类:
  - `normal_response` - 正常响应
  - `disconnect` - 异常断开
  - `timeout` - 超时不响应
  - `crash` - 直接崩溃

- 高并发支持: 同时维持200个连接
- REST API控制: 启动/停止测试、查询进度、导出报告
- 测试结果存储在SQLite数据库
- 自动按严重程度分类报告

## 项目结构

```
mqtt-fuzzer/
├── cmd/
│   └── main.go              # 主程序入口
├── internal/
│   ├── mqtt/
│   │   └── packet.go        # MQTT协议编解码
│   ├── fuzzer/
│   │   ├── mutator.go       # 畸形报文生成器
│   │   └── engine.go        # 测试引擎
│   ├── storage/
│   │   └── storage.go       # 数据库存储
│   ├── api/
│   │   └── server.go        # REST API服务
│   └── report/
│       └── generator.go     # 报告生成
├── configs/
│   └── config.yaml          # 配置文件
├── go.mod
└── README.md
```

## 快速开始

### 1. 编译

```bash
cd mqtt-fuzzer
go mod tidy
go build -o mqtt-fuzzer ./cmd
```

### 2. 配置

编辑 `configs/config.yaml`:

```yaml
target_host: "localhost"
target_port: 1883
mqtt_version: "3.1.1"
client_id_prefix: "mqtt-fuzzer"
username: ""
password: ""

concurrent_connections: 200
timeout: 5
test_iterations: 10

enabled_packet_types:
  - "CONNECT"
  - "PUBLISH"
  - "SUBSCRIBE"
  - "UNSUBSCRIBE"
  - "DISCONNECT"
  - "PINGREQ"
```

### 3. 运行

#### 单次运行模式

```bash
./mqtt-fuzzer -run-once
```

#### API服务模式

```bash
./mqtt-fuzzer -api :8080
```

## REST API 使用

### 启动测试

```bash
curl -X POST http://localhost:8080/api/v1/test/start \
  -H "Content-Type: application/json" \
  -d '{
    "target_host": "localhost",
    "target_port": 1883,
    "mqtt_version": "3.1.1",
    "concurrent_connections": 200,
    "timeout": 5,
    "test_iterations": 10
  }'
```

### 停止测试

```bash
curl -X POST http://localhost:8080/api/v1/test/stop
```

### 查询状态

```bash
curl http://localhost:8080/api/v1/test/status
```

### 查询进度

```bash
curl http://localhost:8080/api/v1/test/progress
```

### 查看报告

```bash
curl http://localhost:8080/api/v1/test/{sessionId}/report
```

### 导出完整报告

```bash
curl -OJ http://localhost:8080/api/v1/test/{sessionId}/export
```

### 查看崩溃详情

```bash
curl http://localhost:8080/api/v1/test/{sessionId}/crashes
```

## 命令行参数

```
-config string      配置文件路径 (default "configs/config.yaml")
-db string          数据库文件路径 (default "fuzzer.db")
-api string         API服务监听地址 (default ":8080")
-run-once           运行一次测试后退出
-report string      生成指定session的报告
```

## 测试报告示例

测试完成后会生成类似以下的报告摘要：

```
============================================================
MQTT FUZZER TEST REPORT
============================================================

Session: session_1234567890
Target:  localhost:1883 (MQTT 3.1.1)
Duration: 2m30s
Status:   completed

--- TEST SUMMARY ---
  Total Tests:      12000
  Normal Response:  8500
  Disconnect:       2000
  Timeout:          1200
  CRASH (CRITICAL): 300
  Anomaly Rate:     29.17%

--- CRITICAL CRASHES (HIGH PRIORITY) ---
  #1: CONNECT - payload_long_string
       Client ID contains extremely long string
  #2: PUBLISH - invalid_remaining_length
       Remaining length field does not match actual payload size

--- MUTATION ANALYSIS ---
  invalid_remaining_length     : 2400 tests,  800 anomalies, 150 crashes (33.3%) [CRITICAL]
  payload_long_string          : 2400 tests,  600 anomalies, 100 crashes (25.0%) [CRITICAL]
  ...
```

## 关于数据库说明

**注意**: 由于Go语言没有原生H2数据库驱动，本项目使用SQLite替代H2作为嵌入式数据库。SQLite同样是轻量级嵌入式数据库，支持事务和复杂查询，完全满足测试结果存储需求。

如果需要H2，可以通过以下方式:
1. 启动H2服务器模式
2. 使用Go的JDBC桥接（如: gojdbc）
3. 导出JSON后导入H2

## 安全说明

本工具仅用于授权的安全测试，请确保:
1. 已获得测试目标的明确授权
2. 不要在生产环境中使用
3. 遵守相关法律法规

## 许可证

MIT License
