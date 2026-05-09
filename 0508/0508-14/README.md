# 文档搜索分析系统

一个企业级文档搜索与分析平台，支持文档搜索、关键词分词、搜索日志记录以及多维度数据分析。

## 技术栈

### 后端
- **框架**: Spring Boot 3.2
- **数据库**: MySQL 8.0
- **缓存**: Redis
- **ORM**: Spring Data JPA
- **分词**: HanLP
- **构建工具**: Maven

### 前端
- **框架**: Vue 3 + Vite
- **UI组件**: Element Plus
- **图表库**: ECharts
- **词云**: wordcloud2
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios

## 功能特性

### 搜索功能
- 支持标题和内容全文搜索
- 中文分词（基于HanLP）
- 模糊匹配
- 搜索结果排序（匹配度 + 点击量）
- 热门搜索词推荐

### 搜索日志记录
- 记录搜索关键词
- 记录用户ID
- 记录点击的文档ID
- 记录搜索时间戳
- 记录搜索结果数量

### 数据分析仪表盘
- **搜索量趋势图**: 过去24小时搜索量曲线
- **搜索词云**: 展示高频搜索词
- **点击热力图**: 按文档分类展示点击热度
- **无结果率趋势图**: 近7天搜索无结果率变化

### 文档管理
- 文档CRUD操作
- 文档分类管理
- 文档点击次数统计

## 项目结构

```
.
├── backend/                 # 后端项目
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/company/docsearch/
│       │   ├── config/     # 配置类
│       │   ├── controller/ # 控制器
│       │   ├── dto/        # 数据传输对象
│       │   ├── entity/     # 实体类
│       │   ├── repository/ # 数据访问层
│       │   └── service/    # 业务逻辑层
│       └── resources/
│           ├── application.yml
│           └── schema.sql  # 数据库初始化脚本
└── frontend/               # 前端项目
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── components/     # Vue组件
        ├── router/         # 路由配置
        ├── styles/         # 样式文件
        ├── utils/          # 工具函数
        ├── views/          # 页面组件
        ├── App.vue
        └── main.js
```

## 快速开始

### 环境要求
- JDK 17+
- Node.js 16+
- MySQL 8.0+
- Redis 5.0+
- Maven 3.6+

### 1. 数据库配置

创建数据库并执行初始化脚本：

```bash
mysql -u root -p < backend/src/main/resources/schema.sql
```

或者在MySQL中手动执行：
```sql
CREATE DATABASE doc_search DEFAULT CHARACTER SET utf8mb4;
-- 然后执行 schema.sql 中的内容
```

### 2. 修改配置文件

编辑 `backend/src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/doc_search
    username: your_username
    password: your_password
  
  data:
    redis:
      host: localhost
      port: 6379
      password: your_redis_password  # 如有密码
```

### 3. 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端服务将在 `http://localhost:8080` 启动。

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 `http://localhost:3000` 启动。

## API接口文档

### 搜索接口
- `POST /api/search` - 执行搜索
- `POST /api/search/click` - 记录点击
- `GET /api/search/hot?limit=10` - 获取热门搜索

### 统计接口
- `GET /api/analytics/volume-trend?hours=24` - 搜索量趋势
- `GET /api/analytics/noresult-rate?days=7` - 无结果率趋势
- `GET /api/analytics/click-heatmap` - 点击热力图数据
- `GET /api/analytics/wordcloud?limit=50` - 词云数据
- `GET /api/analytics/doc-ranking?limit=10` - 文档点击排行
- `GET /api/analytics/summary` - 仪表盘汇总数据

### 文档接口
- `GET /api/documents` - 获取所有文档
- `GET /api/documents/{id}` - 获取单篇文档
- `POST /api/documents` - 创建文档
- `PUT /api/documents/{id}` - 更新文档
- `DELETE /api/documents/{id}` - 删除文档

## 数据库表结构

### documents 表
| 字段 | 类型 | 说明 |
|------|------|------|
| doc_id | VARCHAR(100) | 文档ID（主键） |
| title | VARCHAR(500) | 文档标题 |
| content | TEXT | 文档内容 |
| category | VARCHAR(100) | 文档分类 |
| click_count | INT | 点击次数 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### search_logs 表
| 字段 | 类型 | 说明 |
|------|------|------|
| search_id | BIGINT | 搜索ID（主键，自增） |
| keyword | VARCHAR(500) | 搜索关键词 |
| user_id | VARCHAR(100) | 用户ID |
| clicked_doc_id | VARCHAR(100) | 点击的文档ID |
| timestamp | DATETIME | 搜索时间 |
| result_count | INT | 搜索结果数量 |

## Redis 数据结构

- **Key**: `hot_searches`
- **类型**: ZSET（有序集合）
- **用途**: 存储热门搜索词及其搜索次数

## 功能扩展建议

1. **搜索功能增强**
   - 集成Elasticsearch进行全文检索
   - 添加搜索建议（AutoComplete）
   - 支持高级搜索（AND/OR/NOT）

2. **数据分析**
   - 实时数据推送（WebSocket）
   - 用户行为分析
   - 自定义时间范围查询

3. **安全性**
   - 用户认证和授权（Spring Security）
   - API限流（Rate Limiting）
   - 敏感数据脱敏

4. **性能优化**
   - 数据库读写分离
   - Redis缓存热点数据
   - 搜索结果分页

## License

MIT
