# 在线文献管理工具

一个功能完整的在线文献管理系统，支持BibTeX解析、文献分组标签管理、CSL引用格式化、以及多种格式导出。

## 功能特性

### 核心功能
- **BibTeX文件上传解析** - 支持批量导入BibTeX格式文献
- **手动录入文献** - 支持手动添加文献信息
- **文献搜索** - 全文搜索标题、作者、摘要、关键词
- **标签管理** - 为文献添加自定义标签
- **分组管理** - 文献分组分类

### 引用格式化
- 支持多种期刊/会议引用格式：
  - ACM
  - IEEE
  - Nature
  - APA
  - Chicago
- 实时预览引用格式
- 基于CSL（Citation Style Language）引擎

### 导出功能
- **RIS格式** - 适用于大多数文献管理软件（EndNote, Zotero, Mendeley等）
- **EndNote XML格式** - 专门适用于EndNote
- **BibTeX格式** - 适用于LaTeX排版系统

### 性能优化
- MongoDB文本索引支持高性能搜索
- 5000条文献检索速度<1秒
- 支持分页加载

## 技术栈

### 后端
- Node.js + Express
- MongoDB + Mongoose
- citeproc-js (CSL格式化引擎)
- bibtex-parse-js
- xmlbuilder2

### 前端
- React 18
- Material-UI (MUI)
- Axios
- React Router

## 安装与运行

### 前置要求
- Node.js (v16+)
- MongoDB (v4.4+)

### 后端安装
```bash
cd backend
npm install
```

### 前端安装
```bash
cd frontend
npm install
```

### 配置环境变量
在backend目录下创建`.env`文件：
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/reference-manager
```

### 运行

#### 启动MongoDB
确保MongoDB服务正在运行：
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongodb
# 或
brew services start mongodb-community
```

#### 启动后端
```bash
cd backend
npm start
```
后端运行在 http://localhost:3001

#### 启动前端
```bash
cd frontend
npm start
```
前端运行在 http://localhost:3000

## REST API文档

### 文献管理

#### 上传BibTeX文件
```
POST /api/references/upload
Content-Type: multipart/form-data

Body:
- file: BibTeX文件
或
- content: BibTeX文本内容
```

#### 创建文献
```
POST /api/references
Content-Type: application/json

Body: 文献JSON对象
```

#### 获取文献列表
```
GET /api/references
Parameters:
- search: 搜索关键词
- tags: 标签筛选（逗号分隔）
- groups: 分组筛选（逗号分隔）
- page: 页码（默认1）
- limit: 每页数量（默认50）
- sort: 排序方式（默认-createdAt）
```

#### 获取单条文献
```
GET /api/references/:id
```

#### 更新文献
```
PUT /api/references/:id
Content-Type: application/json
```

#### 删除文献
```
DELETE /api/references/:id
```

#### 批量删除文献
```
POST /api/references/batch-delete
Content-Type: application/json
Body: { ids: [id1, id2, ...] }
```

### 引用格式化

#### 获取可用样式列表
```
GET /api/styles
```

#### 格式化引用
```
POST /api/styles/format
Content-Type: application/json
Body:
{
  "referenceIds": ["id1", "id2", ...],
  "style": "acm"
}
```

#### 预览单个文献引用
```
POST /api/styles/preview
Content-Type: application/json
Body:
{
  "reference": { ... },
  "style": "acm"
}
```

### 导出功能

#### 导出RIS格式
```
POST /api/export/ris
Content-Type: application/json
Body: { referenceIds: ["id1", "id2", ...] }
Response: application/x-research-info-systems
```

#### 导出EndNote XML格式
```
POST /api/export/endnote
Content-Type: application/json
Body: { referenceIds: ["id1", "id2", ...] }
Response: application/xml
```

#### 导出BibTeX格式
```
POST /api/export/bibtex
Content-Type: application/json
Body: { referenceIds: ["id1", "id2", ...] }
Response: application/x-bibtex
```

## 项目结构

```
reference-manager/
├── backend/
│   ├── src/
│   │   ├── server.js          # 服务器入口
│   │   ├── models/            # 数据模型
│   │   │   ├── Reference.js
│   │   │   └── Group.js
│   │   ├── routes/            # API路由
│   │   │   ├── referenceRoutes.js
│   │   │   ├── styleRoutes.js
│   │   │   └── exportRoutes.js
│   │   └── services/          # 业务服务
│   │       ├── bibtexParser.js
│   │       ├── citationFormatter.js
│   │       └── exportService.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.js
    │   ├── index.js
    │   └── components/         # React组件
    │       ├── ReferenceList.js
    │       ├── UploadForm.js
    │       ├── CitationPreview.js
    │       ├── ExportPanel.js
    │       └── SearchBar.js
    ├── public/
    └── package.json
```

## 使用说明

1. **导入文献**：
   - 点击"上传文献"标签
   - 可以选择上传.bib文件、粘贴BibTeX文本或手动录入

2. **管理文献**：
   - 在"文献列表"中查看所有文献
   - 使用搜索栏快速查找
   - 可以编辑或删除文献

3. **引用预览**：
   - 在文献列表中选择一条或多条文献
   - 切换到"引用预览"标签
   - 选择不同的期刊格式查看效果

4. **导出文献**：
   - 选择要导出的文献
   - 切换到"导出"标签
   - 选择需要的格式进行导出

## 数据库索引

为了保证高性能搜索，系统自动创建以下索引：

- `_id` - 主键索引
- `citationKey` - 引用键索引
- `title` - 标题索引
- `tags` - 标签索引
- `groups` - 分组索引
- `createdAt` - 创建时间索引
- 全文索引：`title`, `author.family`, `abstract`, `journal`, `keywords`

## 扩展开发

### 添加新的引用样式
在 `backend/src/services/citationFormatter.js` 中的 `loadStyles()` 方法中添加新的CSL XML样式。

### 自定义文献类型
在 `backend/src/models/Reference.js` 中的 `type` 枚举字段中添加新类型。

## License

MIT