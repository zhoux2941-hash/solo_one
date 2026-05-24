# 纸浆厂换浆损耗复盘系统

面向纸浆厂工艺员的换浆损耗复盘系统，将批次切换记录、流量计读数和人工停机备注整合在同一套复盘流程中。

## 系统架构

### 后端模块
- **API服务** (server/index.js) - 提供 RESTful API 接口
- **数据模型** (server/models/) - 6个数据库模型定义
- **计算服务** (server/services/lossCalculation.js) - 阶段损耗计算逻辑
- **报表导出** (server/services/reportExport.js) - Excel报表生成
- **Worker任务** (worker/index.js) - 异步任务处理、分段生成、快照生成

### 前端页面
- **批次列表页** - 换浆批次列表展示、筛选、分页
- **时间线页** - 单次切换时间线可视化（流量计读数、人工备注、阶段分段）
- **损耗分段页** - 损耗分段分析、阶段明细查看

## 功能特性

### 核心功能
1. ✅ 换浆批次管理（创建、查询、状态跟踪）
2. ✅ 流量计读数记录与展示
3. ✅ 人工停机备注录入与关联
4. ✅ 自动阶段分段识别
5. ✅ 分段损耗计算与汇总
6. ✅ 时间线可视化复盘
7. ✅ 损耗分析报表
8. ✅ Excel导出（完整报告/简报）

### 预留增强点
- ✅ **按机台筛选复盘** - API已支持 `machineId` 筛选参数
- ✅ **导出单批次损耗简报** - API已提供简报导出接口

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动服务
```bash
npm start
```

### 启动 Worker（可选，用于后台任务处理）
```bash
npm run worker
```

### 访问系统
打开浏览器访问: `http://localhost:3000`

## API 接口

### 批次管理
- `GET /api/batches` - 获取批次列表（支持 machineId, status, 日期范围筛选）
- `GET /api/batches/:id` - 获取批次详情
- `POST /api/batches` - 创建新批次
- `POST /api/batches/:id/flow-reading` - 新增流量计读数
- `POST /api/batches/:id/downtime-remark` - 新增停机备注
- `POST /api/batches/:id/start-calculation` - 开始损耗计算

### 时间线
- `GET /api/timeline/batch/:batchId` - 获取批次时间线数据

### 损耗分析
- `GET /api/loss/batch/:batchId` - 获取批次损耗复盘数据
- `GET /api/loss/batch/:batchId/segments` - 获取损耗分段明细
- `POST /api/loss/recalculate/:batchId` - 重新计算损耗

### 报表导出
- `GET /api/reports/batch/:batchId/export` - 导出完整报告（Excel）
- `GET /api/reports/batch/:batchId/brief` - 导出损耗简报（Excel）

## 目录结构

```
.
├── server/
│   ├── index.js              # API服务入口
│   ├── initData.js           # 示例数据初始化
│   ├── models/               # 数据模型
│   │   ├── index.js
│   │   ├── pulpBatch.js
│   │   ├── flowMeterReading.js
│   │   ├── downtimeRemark.js
│   │   ├── lossSegment.js
│   │   ├── lossSnapshot.js
│   │   └── stageCalculation.js
│   ├── routes/               # API路由
│   │   ├── batches.js
│   │   ├── timeline.js
│   │   ├── loss.js
│   │   └── reports.js
│   └── services/             # 业务服务
│       ├── lossCalculation.js
│       └── reportExport.js
├── worker/
│   └── index.js              # 任务Worker
├── client/
│   ├── index.html            # 前端入口
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js
│       ├── app.js
│       ├── batches.js
│       ├── timeline.js
│       └── loss.js
├── database/                 # SQLite数据库目录
└── package.json
```

## 数据库模型

1. **PulpBatch** - 换浆批次记录
2. **FlowMeterReading** - 流量计读数
3. **DowntimeRemark** - 人工停机备注
4. **LossSegment** - 损耗分段
5. **LossSnapshot** - 损耗数据快照
6. **StageCalculation** - 阶段损耗计算结果

## 技术栈

- **后端**: Node.js + Express + Sequelize + SQLite
- **前端**: 原生 HTML/CSS/JavaScript
- **报表**: ExcelJS
- **任务调度**: node-cron
