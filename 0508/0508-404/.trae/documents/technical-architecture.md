## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        A["React SPA"] --> B["地图组件(SVG)"]
        A --> C["筛选组件"]
        A --> D["详情面板"]
        A --> E["搜索组件"]
        A --> F["收藏组件"]
    end
    subgraph "数据层"
        G["Mock数据(JSON)"] --> H["高速线路数据"]
        G --> I["服务区数据"]
        G --> J["设施数据"]
    end
    subgraph "存储层"
        K["localStorage"] --> L["收藏记录"]
        K --> M["筛选偏好"]
    end
    A --> G
    A --> K
```

## 2. 技术说明
- **前端**: React@18 + TailwindCSS@3 + Vite
- **初始化工具**: Vite (vite init react-ts)
- **后端**: 无（纯前端应用，使用Mock数据）
- **数据库**: 无（使用内嵌JSON数据 + localStorage持久化收藏）

### 关键依赖
- **framer-motion**: 面板动画、标记动效
- **react-icons**: 设施图标
- **SVG内联绘制**: 高速公路简图

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 地图主页，含筛选、搜索、收藏全部功能 |

> 单页应用，所有功能在同一页面通过面板交互完成，无需多路由

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    "Highway" ||--o{ "ServiceArea" : "包含"
    "ServiceArea" ||--o{ "Facility" : "拥有"
    "User" ||--o{ "Favorite" : "收藏"

    "Highway" {
        string id PK
        string name "高速名称"
        string code "编号如G4"
        string color "线路颜色"
        json path "SVG路径坐标"
        number totalLength "总长度km"
    }

    "ServiceArea" {
        string id PK
        string name "服务区名称"
        string highwayId FK "所属高速"
        number distance "距起点距离km"
        number lat "纬度"
        number lng "经度"
        number svgX "地图X坐标"
        number svgY "地图Y坐标"
    }

    "Facility" {
        string id PK
        string serviceAreaId FK "所属服务区"
        string type "设施类型"
        boolean available "是否可用"
    }

    "Favorite" {
        string id PK
        string serviceAreaId FK "收藏的服务区"
        number createdAt "收藏时间"
    }
```

### 4.2 数据定义

**高速线路数据** (6条):
| 编号 | 名称 | 起止城市 | 总里程 |
|------|------|----------|--------|
| G4 | 京港澳高速 | 北京-珠海 | 2285km |
| G2 | 京沪高速 | 北京-上海 | 1262km |
| G5 | 京昆高速 | 北京-昆明 | 2865km |
| G15 | 沈海高速 | 沈阳-海口 | 3710km |
| G30 | 连霍高速 | 连云港-霍尔果斯 | 4395km |
| G50 | 沪渝高速 | 上海-重庆 | 1768km |

**设施类型枚举**: gas_station(加油站), charging(充电桩), restaurant(餐厅), restroom(卫生间), nursery(母婴室), auto_repair(汽修点)

**每条高速约8-12个服务区**，共约60个服务区数据点，每个服务区包含1-6种设施
