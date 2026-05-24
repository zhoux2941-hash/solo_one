# 市政巡检渗漏告警聚合服务

统一聚合湿度探头、视频抓拍和人工巡检数据的渗漏告警系统。

## 项目结构

```
leakage-alert-service/
├── main.py                    # 服务入口
├── config.py                  # 配置管理
├── requirements.txt           # 依赖包
├── .env.example              # 环境变量示例
├── sample_data.py            # 示例数据脚本
├── storage/                  # 存储层
│   ├── __init__.py
│   ├── database.py           # 数据库连接
│   ├── models.py             # 数据模型
│   └── repository.py         # 数据访问层
├── ingestion/                # 接入层
│   ├── __init__.py
│   ├── schemas.py            # 数据结构定义
│   ├── validators.py         # 数据验证器
│   └── service.py            # 接入服务
├── rules_engine/             # 规则判定
│   ├── __init__.py
│   ├── schemas.py            # 告警等级定义
│   ├── rules.py              # 告警规则引擎
│   └── service.py            # 规则服务
├── merging_service/          # 归并服务
│   ├── __init__.py
│   ├── schemas.py            # 归并结果模型
│   ├── time_window.py        # 时间窗归并逻辑
│   └── service.py            # 归并服务
├── scheduler/                # 任务调度
│   ├── __init__.py
│   ├── tasks.py              # 异步任务定义
│   └── manager.py            # 调度器管理
├── snapshot_export/          # 快照导出
│   ├── __init__.py
│   ├── schemas.py            # 快照模型
│   ├── generator.py          # 摘要生成器
│   └── service.py            # 导出服务
└── api/                      # API路由
    ├── __init__.py
    ├── ingestion.py          # 数据接入接口
    ├── alerts.py             # 告警管理接口
    └── admin.py              # 管理接口
```

## 功能模块

### 1. 接入层 (ingestion)
- 接收湿度探头数据
- 接收视频抓拍结果
- 接收人工巡检回执
- 数据验证和标准化

### 2. 规则判定 (rules_engine)
- 多维度告警评分
- 五级告警等级（INFO/LOW/MEDIUM/HIGH/CRITICAL）
- 基于规则的智能判定

### 3. 归并服务 (merging_service)
- 时间窗数据归并（默认30分钟）
- 告警事件聚合
- **预留：按管段批量重算** (`/alerts/recalculate/segment/{segment_id}`)

### 4. 任务调度 (scheduler)
- 异步处理新上报数据
- 补齐迟到数据
- 自动生成事件快照
- 清理旧快照

### 5. 存储层 (storage)
- SQLite内置数据库
- 原始数据存储
- 告警事件存储
- 快照和任务日志

### 6. 快照导出 (snapshot_export)
- 自动生成事件快照
- **预留：导出单次告警复盘摘要** (`/alerts/{alert_id}/review-summary`)
- 支持JSON和文本格式

## 快速开始

### 1. 安装依赖
```bash
pip install -r requirements.txt
```

### 2. 配置环境变量
```bash
copy .env.example .env
```

### 3. 启动服务
```bash
python main.py
```

### 4. 访问API文档
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 5. 运行示例数据
```bash
# 创建示例管段
python sample_data.py segments

# 生成示例数据
python sample_data.py data

# 处理数据生成告警
python sample_data.py process

# 查看告警
python sample_data.py alerts

# 一键运行全部示例
python sample_data.py all
```

## API接口

### 数据接入
- `POST /ingest/data` - 通用数据上报
- `POST /ingest/batch` - 批量数据上报
- `POST /ingest/humidity` - 湿度数据上报
- `POST /ingest/video` - 视频结果上报
- `POST /ingest/manual` - 人工巡检上报

### 告警管理
- `GET /alerts/` - 查询告警列表
- `GET /alerts/{id}` - 查询单个告警
- `POST /alerts/{id}/review` - 复核告警
- `POST /alerts/process` - 处理待处理数据
- `GET /alerts/summary/pending` - 待复核统计
- `POST /alerts/{id}/snapshot` - 生成快照
- `GET /alerts/{id}/review-summary` - 导出复盘摘要
- `POST /alerts/recalculate/segment/{id}` - 按管段重算
- `POST /alerts/recalculate/all` - 全部重算

### 管理接口
- `GET /admin/scheduler/status` - 调度器状态
- `POST /admin/scheduler/start` - 启动调度器
- `POST /admin/scheduler/stop` - 停止调度器
- `POST /admin/task/run/{task}` - 手动执行任务
- `GET /admin/segments` - 管段列表
- `POST /admin/segments` - 创建管段
- `GET /admin/health` - 健康检查

## 告警等级判定规则

| 等级 | 分数范围 | 说明 |
|------|----------|------|
| CRITICAL | ≥70 | 严重渗漏，需立即处理 |
| HIGH | 50-69 | 高风险，24小时内排查 |
| MEDIUM | 30-49 | 中风险，3天内确认 |
| LOW | 15-29 | 低风险，纳入巡检 |
| INFO | <15 | 信息，持续观察 |

## 配置说明

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| TIME_WINDOW_MINUTES | 30 | 时间归并窗口 |
| ALERT_REVIEW_WINDOW_HOURS | 24 | 迟到数据补齐窗口 |
| ASYNC_TASK_INTERVAL_MINUTES | 5 | 异步任务执行间隔 |
| SNAPSHOT_RETENTION_DAYS | 30 | 快照保留天数 |
