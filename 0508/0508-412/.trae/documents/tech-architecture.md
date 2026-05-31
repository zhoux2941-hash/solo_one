## 1. 架构设计

```mermaid
flowchart TD
    "前端 React 应用" --> "GeoHash 工具库"
    "前端 React 应用" --> "Canvas 可视化模块"
    "前端 React 应用" --> "状态管理 (Zustand)"
    "GeoHash 工具库" --> "编码函数 (lat/lng -> hash)"
    "GeoHash 工具库" --> "解码函数 (hash -> bbox)"
    "GeoHash 工具库" --> "相邻区域计算函数"
    "Canvas 可视化模块" --> "网格绘制"
    "Canvas 可视化模块" --> "区域标注"
```

## 2. 技术说明
- 前端：React@18 + TypeScript + Tailwind CSS@3 + Vite
- 初始化工具：vite-init
- 后端：无（纯前端应用）
- 数据库：无（所有计算在客户端完成）
- 状态管理：Zustand

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主页面，包含编码、解码、可视化、批量转换所有功能模块 |

## 4. 数据模型

无需数据库，核心数据结构如下：

```typescript
interface GeoPoint {
  lat: number;
  lng: number;
}

interface BBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface GeoHashResult {
  hash: string;
  point: GeoPoint;
  bbox: BBox;
  precision: number;
}

interface PresetLocation {
  name: string;
  lat: number;
  lng: number;
}
```

## 5. 核心算法说明

### 5.1 GeoHash 编码
1. 将经纬度范围二分，经度范围 [-180, 180]，纬度范围 [-90, 90]
2. 交替对经度和纬度进行二分编码（奇数位经度，偶数位纬度）
3. 每5位二进制映射为一个 Base32 字符
4. 重复直到达到指定精度

### 5.2 GeoHash 解码
1. 将每个 Base32 字符还原为5位二进制
2. 分离经度和纬度的二进制位
3. 根据二进制位逐步缩小范围
4. 返回边界框（BBox）和中心点

### 5.3 相邻区域计算
1. 解码当前 GeoHash 得到中心点
2. 根据当前精度对应的最小单元尺寸，计算8个方向的偏移中心点
3. 对8个偏移中心点分别编码，得到相邻 GeoHash
