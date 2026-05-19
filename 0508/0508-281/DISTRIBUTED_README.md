# 分布式多摄像头协同追踪系统

基于YOLOv5 + DeepSORT + 分布式协同追踪，支持多边缘设备协同工作，实现大范围场景的跨摄像头追踪。

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    MASTER 主节点                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  GlobalTracker - 全局轨迹管理 + ID统一分配        │   │
│  │  NodeManager - 节点管理 + 通信协调           │   │
│  │  TimeSynchronizer - 时间同步                 │   │
│  └─────────────────────────────────────────────────┘   │
└────────────┬─────────────────────┬────────────────────┘
             │                     │
     ┌───────┴───────┐     ┌───────┴───────┐
     │   EDGE 节点 1  │     │   EDGE 节点 2  │
     │  (cam_01)      │     │  (cam_02)      │
     │  - YOLO检测      │     │  - YOLO检测     │
     │  - DeepSORT追踪  │     │  - DeepSORT追踪 │
     │  - 特征提取     │     │  - 特征提取    │
     │  - 本地摄像头    │     │  - 本地摄像头   │
     └─────────────────┘     └─────────────────┘
```

## 核心功能

### 1. 节点管理 (NodeManager)
- ✅ 自动节点发现和心跳检测
- ✅ WebSocket实时通信
- ✅ 节点状态监控
- ✅ 多区域分组管理

### 2. 跨摄像头重识别 (ReID)
- ✅ 外观特征提取（颜色直方图 + HOG纹理）
- ✅ 基于外观的相似度匹配
- ✅ 空间位置约束
- ✅ 类别一致性检查

### 3. 全局轨迹融合 (GlobalTracker)
- ✅ 全局唯一ID分配
- ✅ 跨摄像头轨迹关联
- ✅ 轨迹历史管理
- ✅ 多摄像头统计

### 4. 时间同步 (TimeSynchronizer)
- ✅ NTP风格时间同步
- ✅ 网络延迟估计
- ✅ 时间戳校准

## 快速开始

### 配置文件说明

```yaml
# config/config.yaml
distributed:
  enabled: true              # 启用分布式追踪
  is_master: false           # 是否为主节点
  master_host: localhost       # 主节点地址
  master_port: 8765           # 分布式通信端口
  camera_id: cam_01          # 摄像头ID
  region: region_a           # 所属区域
  
  association:
    feature_weight: 0.6       # 外观特征权重
    spatial_weight: 0.3       # 空间位置权重
    temporal_weight: 0.1      # 时间权重
    threshold: 0.45         # 匹配阈值
```

### 启动 MASTER 节点

```bash
# 方式1: 使用脚本
./scripts/start_master.sh

# 方式2: 手动设置
python scripts/set_master.py
python backend/api/main.py
```

### 启动 EDGE 节点

```bash
# 节点1
python scripts/set_edge.py cam_01 region_a 8001
python backend/api/main.py

# 节点2
python scripts/set_edge.py cam_02 region_a 8002
python backend/api/main.py
```

### Windows 启动

```cmd
:: 主节点
python scripts\set_master.py
python backend\api\main.py

:: 边缘节点
python scripts\set_edge.py cam_01 region_a 8001
python backend\api\main.py
```

## API 接口

### 分布式相关

| 接口 | 方法 | 说明 | 节点类型 |
|------|------|------|---------|
| `/api/distributed/status` | GET | 获取分布式状态 | All |
| `/api/distributed/nodes` | GET | 获取在线节点列表 | All |
| `/api/distributed/global_tracks` | GET | 获取全局轨迹 | Master |
| `/api/distributed/cross_camera_stats` | GET | 跨摄像头统计 | Master |

### 状态响应示例

```json
{
  "success": true,
  "enabled": true,
  "node_id": "abc123",
  "is_master": true,
  "camera_id": "cam_master",
  "online_nodes": 3,
  "global_tracks": 15,
  "cross_camera": {
    "total_tracks": 15,
    "multi_camera_tracks": 8,
    "camera_distribution": {
      "cam_01": 10,
      "cam_02": 12
    }
  }
}
```

## 通信协议

### 消息类型

1. **心跳消息 (heartbeat)
```json
{
  "type": "heartbeat",
  "node_id": "abc123",
  "status": "online",
  "timestamp": 1234567890.123
}
```

2. **轨迹更新消息 (track_update)**
```json
{
  "type": "track_update",
  "message_id": "abc123_1_100",
  "source_node": "abc123",
  "timestamp": 1234567890.123,
  "track_id": 1,
  "class_id": 0,
  "class_name": "person",
  "bbox": [100, 100, 200, 300],
  "confidence": 0.85,
  "feature_vector": [...],
  "camera_id": "cam_01"
}
```

3. **全局ID分配 (global_id_assignment)
```json
{
  "type": "global_id_assignment",
  "camera_id": "cam_01",
  "local_track_id": 5,
  "global_track_id": 12,
  "confidence": 0.78,
  "method": "matched"
}
```

## 匹配算法

### 多维相似度计算：
```
总相似度 = 0.6 * 外观相似度 + 0.3 * 空间相似度 + 0.1 * 时间相似度
```

**外观相似度**:
- 颜色直方图 (Color Histogram)
- HOG纹理特征
- 余弦相似度计算

**空间相似度**:
- 基于摄像头位置的投影
- 欧氏距离归一化
- 高斯核函数

**时间相似度**:
- 轨迹时间差
- 指数衰减

## 部署建议

### 硬件要求

**Master 节点**:
- CPU: 4核以上
- 内存: 4GB+
- 网络: 千兆局域网

**Edge 节点**:
- CPU/GPU: Jetson Nano / Xavier NX
- 内存: 2GB+
- 摄像头: USB/RTSP

### 网络要求

- 所有节点在同一局域网内
- 延迟 < 100ms
- 带宽: 10Mbps+ 每个节点

### 摄像头布置

```
区域覆盖建议：
- 重叠区域: 20-30%
- 高度: 3-5米
- 视角: 60-90度
```

## 性能指标

### 单节点性能 (Jetson Nano)
- 检测速度: >15 FPS (640x640)
- 追踪延迟: <50ms
- 内存占用: ~1.5GB

### 分布式性能
- 节点同步延迟: <100ms
- 跨摄像头匹配准确率: >85%
- 全局ID稳定性: >90%

## 常见问题

### Q: 如何添加新的边缘节点？
A: 配置新节点的 `camera_id和region，确保master_host指向主节点地址。

### Q: 跨摄像头匹配不准确怎么办？
A: 
1. 增加摄像头重叠区域
2. 调整 `feature_weight权重
3. 确保摄像头位置校准

### Q: 主节点故障怎么办？
A: 当前版本需要手动切换主节点。

### Q: 支持多少个边缘节点？
A: 建议单主节点最多连接8-16个边缘节点。

## 未来计划

- [ ] 主节点自动选举
- [ ] 多主节点集群
- [ ] 轨迹可视化地图
- [ ] 目标行为分析
- [ ] 异常检测告警
- [ ] 录像存储与回放
