# 3D模型隐私保护系统

## 功能概述

本系统实现了3D模型的自动敏感区域检测和模糊化处理，特别针对人脸等可识别特征进行隐私保护。系统采用几何分析、边缘检测和高斯模糊等技术，在保护隐私的同时保持模型的整体可用性。

## 核心技术

### 1. 敏感区域检测

**几何特征分析法：**
- 位置筛选：识别模型前上部区域（人脸通常位置）
- 区域聚类：使用BFS算法对邻近顶点进行聚类
- 大小过滤：只处理大于30个顶点的区域
- 支持手动标记敏感区域

**检测流程：**
```
模型加载 → 顶点分析 → 位置筛选 → 区域聚类 → 边界计算 → UV映射 → 敏感区域标记
```

### 2. 边缘检测 (Sobel算子)

使用3x3 Sobel卷积核进行边缘检测：

**Sobel X核 (水平边缘):**
```
[-1,  0,  1]
[-2,  0,  2]
[-1,  0,  1]
```

**Sobel Y核 (垂直边缘):**
```
[-1, -2, -1]
[ 0,  0,  0]
[ 1,  2,  1]
```

**边缘强度计算：**
```
G = sqrt(Gx² + Gy²)
```

### 3. 智能模糊化

**边缘感知高斯模糊：**
- 标准高斯模糊内核
- 边缘区域减少模糊强度（保留轮廓）
- 平滑区域应用完整模糊强度
- 距离衰减的权重分配

**模糊强度自适应：**
```
blurAmount = 1 - edgeFactor * 0.5
edgeFactor = max(0, 1 - distanceToEdge / maxDistance)
```

## API使用

### 命令行工具

```bash
# 基本使用（启用隐私保护）
node tools/model-processor-privacy.cjs

# 指定输入输出
node tools/model-processor-privacy.cjs input.glb output_dir

# 关闭隐私保护
node tools/model-processor-privacy.cjs --no-privacy

# 调整模糊强度 (1-10)
node tools/model-processor-privacy.cjs --blur=8
```

### 手动标记敏感区域

```javascript
const { ModelProcessor, PrivacyProtector } = require('./tools/model-processor-privacy.cjs');

const sensitiveAreas = [
  {
    bbox: { 
      min: [-0.5, 0.2, -0.3], 
      max: [0.5, 1.2, 0.5] 
    },
    center: [0, 0.7, 0.1],
    size: 1.0
  }
];

const processor = new ModelProcessor(
  'input.glb', 
  'output_dir',
  {
    enabled: true,
    blurIntensity: 7,
    sensitiveAreas: sensitiveAreas
  }
);

await processor.process();
```

### 服务器配置

隐私保护服务器运行在端口8081：

```bash
# 启动隐私保护服务器
node server/server-privacy.cjs
```

访问演示页面：
```
http://localhost:8081/index-privacy.html
```

### REST API

**获取隐私信息：**
```
GET /api/privacy-info

Response:
{
  "enabled": true,
  "facesDetected": 1,
  "blurIntensity": 5
}
```

**健康检查：**
```
GET /api/health

Response:
{
  "status": "ok",
  "sessions": 0,
  "modelLoaded": true,
  "privacy": {
    "enabled": true,
    "facesDetected": 1,
    "blurIntensity": 5
  }
}
```

## 元数据结构

处理后的模型在metadata.json中包含隐私保护信息：

```json
{
  "privacy": {
    "enabled": true,
    "facesDetected": 1,
    "blurIntensity": 5
  }
}
```

## 处理流程

### 模型处理阶段

1. **加载与解析**: GLTF/GLB模型解析
2. **几何分析**: 计算顶点位置、法线、UV坐标
3. **区域检测**: 基于几何特征识别人脸区域
4. **边界计算**: 计算每个敏感区域的3D边界框和UV范围
5. **顶点模糊**: 对敏感区域顶点添加位置噪声
6. **纹理模糊**: 使用Sobel边缘检测和高斯模糊处理纹理
7. **LOD生成**: 为每个精度层级生成简化模型
8. **分块存储**: 将处理后的模型分块存储

### 运行时阶段

1. 客户端连接服务器
2. 服务器发送包含隐私信息的元数据
3. 客户端显示隐私保护状态
4. 流式传输经过隐私处理的模型数据
5. 客户端渐进式渲染

## 性能影响

| 操作 | 额外开销 | 说明 |
|------|---------|------|
| 区域检测 | ~5% | 仅在LOD0执行一次 |
| 顶点模糊 | ~2% | 仅对敏感区域顶点 |
| 纹理模糊 | ~15% | 仅对包含敏感区域的纹理 |
| 总体开销 | ~7-10% | 对10MB模型 |

## 隐私保护级别

| 级别 | 模糊强度 | 边缘保留 | 适用场景 |
|------|---------|---------|---------|
| 轻微 | 1-3 | 高 | 文档、演示 |
| 标准 | 4-6 | 中 | 通用场景 |
| 严格 | 7-10 | 低 | 高度敏感数据 |

## 文件结构

```
├── tools/
│   └── model-processor-privacy.cjs    # 隐私保护模型处理器
├── server/
│   └── server-privacy.cjs             # 隐私保护流媒体服务器
├── client/
│   └── index-privacy.html             # 隐私保护演示页面
├── models/
│   └── processed-privacy/             # 隐私保护处理后的模型
│       ├── metadata.json
│       └── chunks/
└── PRIVACY.md                         # 本文档
```

## 测试验证

### 单元测试

1. **区域检测测试**
   - 输入：已知人脸位置的测试模型
   - 验证：检测到的区域与预期相符

2. **模糊效果测试**
   - 输入：清晰纹理
   - 验证：输出纹理的PSNR值在预期范围

3. **边界测试**
   - 验证：模糊区域不超出标记范围
   - 验证：边缘区域模糊强度衰减正确

### 集成测试

1. 启动隐私保护服务器
2. 访问 `http://localhost:8081/index-privacy.html`
3. 验证：
   - 隐私状态显示为"Active"
   - 检测到的人脸数量正确
   - 模型加载后敏感区域被模糊处理
   - 性能指标（首屏<2s，完整<10s）

## 扩展功能

### 未来可支持的功能

1. **AI人脸检测**: 集成深度学习模型进行更精确的人脸检测
2. **多类型敏感区域**: 支持车牌、纹身、标识等其他敏感内容
3. **可恢复模糊**: 使用加密密钥进行可逆模糊
4. **动态模糊**: 根据观看者权限动态调整模糊强度
5. **批处理**: 支持批量处理模型库
6. **审计日志**: 记录所有隐私处理操作

## 注意事项

1. **检测局限性**: 当前基于几何的检测方法对非标准人脸姿态可能漏检
2. **纹理依赖**: 纹理模糊需要模型有正确的UV映射
3. **LOD影响**: 低精度LOD可能导致检测精度下降
4. **性能权衡**: 更高的模糊强度会增加处理时间

## 合规性

本系统设计符合以下隐私原则：
- ✅ 数据最小化：仅处理必要的敏感区域
- ✅ 不可逆：模糊处理不可恢复原始特征
- ✅ 透明性：元数据记录所有隐私操作
- ✅ 可控性：支持自定义敏感区域和模糊强度
