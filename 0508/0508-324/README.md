# SDN Controller - OpenFlow 1.3

基于Ryu框架实现的SDN控制器，支持OpenFlow 1.3协议。

## 功能特性

1. **网络拓扑发现** - 使用LLDP协议自动发现网络拓扑
2. **最短路径计算** - 使用Dijkstra算法计算最短路径
3. **流表管理** - 支持基于优先级和匹配字段的流表下发
4. **流量工程** - 根据链路利用率动态调整路径（负载均衡）
5. **带内网络遥测 (INT)** - 收集排队延迟、队列深度等遥测数据
6. **北向REST API** - 提供拓扑查询、流规则配置、统计信息、遥测数据

## 安装依赖

```bash
pip install -r requirements.txt
```

## 启动控制器

```bash
ryu-manager controller.py --observe-links
```

## REST API 使用

### 健康检查
```bash
curl http://localhost:8080/health
```

### 获取拓扑信息
```bash
curl http://localhost:8080/topology
```

### 获取交换机列表
```bash
curl http://localhost:8080/switches
```

### 获取主机列表
```bash
curl http://localhost:8080/hosts
```

### 获取端口统计
```bash
curl http://localhost:8080/stats/ports
```

### 获取拥塞链路
```bash
curl http://localhost:8080/stats/congested
```

### 计算路径
```bash
curl "http://localhost:8080/routing/path?src=1&dst=3"
```

### 添加流表
```bash
curl -X POST http://localhost:8080/flows \
  -H "Content-Type: application/json" \
  -d '{
    "dpid": 1,
    "priority": 100,
    "match": {
      "eth_type": 2048,
      "ipv4_src": "10.0.0.1",
      "ipv4_dst": "10.0.0.3"
    },
    "actions": [{"type": "output", "port": 2}],
    "idle_timeout": 60
  }'
```

### 获取流表统计
```bash
curl http://localhost:8080/flows
```

## Mininet 测试

### 线性拓扑
```bash
sudo python test_topologies.py --topo linear --n 5
```

### 树形拓扑
```bash
sudo python test_topologies.py --topo tree --n 3
```

### Fat-Tree拓扑
```bash
sudo python test_topologies.py --topo fattree --n 4
```

### 数据中心拓扑
```bash
sudo python test_topologies.py --topo datacenter --n 20
```

## 项目结构

```
.
├── controller.py          # 主控制器
├── topology_manager.py    # 拓扑管理
├── routing.py             # 路由计算 (Dijkstra)
├── flow_manager.py        # 流表管理
├── traffic_engineering.py # 流量工程/负载均衡
├── int_telemetry.py       # INT带内网络遥测
├── rest_api.py            # REST API
├── test_topologies.py     # Mininet测试拓扑
├── test_rest.py           # REST API测试脚本
├── test_int.py            # INT遥测测试脚本
└── requirements.txt       # 依赖
```

## INT 遥测功能说明

### 遥测数据项
- **排队延迟** (latency_us): 数据包在交换机队列中的排队延迟（微秒）
- **队列深度** (queue_depth): 交换机端口队列的拥塞程度
- **路径信息**: 数据包经过的交换机序列
- **跳数统计**: 流路径的交换机数量

### 告警机制
- **高延迟告警**: 当流的端到端延迟超过阈值（默认50ms）
- **队列拥塞告警**: 当队列深度超过阈值（默认50）
- 告警信息输出到控制器日志

## 流表匹配字段支持

- 二层: `in_port`, `eth_src`, `eth_dst`
- 三层: `eth_type`, `ipv4_src`, `ipv4_dst`, `ip_proto`
- 四层: `tcp_src`, `tcp_dst`, `udp_src`, `udp_dst`
