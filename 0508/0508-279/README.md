# 多模态知识图谱系统

一个支持结构化和非结构化数据处理的知识图谱系统，集成OCR、物体检测、BERT实体抽取和自然语言问答功能。

## 功能特性

### 1. 多模态数据处理
- **图片处理**: 使用OpenCV和Tesseract进行OCR文字识别和物体检测
  - ✅ **OCR识别率大幅提升**：针对低分辨率、模糊图片的14项预处理技术
  - 支持中文+英文双语识别
  - 自动人脸、建筑、树木等物体检测
- **文档处理**: 基于BERT的实体关系抽取（规则实现）
- **结构化数据**: 支持JSON和CSV格式数据导入

### 2. 跨模态检索 (CLIP)
使用OpenAI CLIP模型实现图文特征对齐，支持三种检索模式：

| 检索模式 | 功能说明 | 典型应用场景 |
|---------|---------|------------|
| **以图搜图** | 上传一张图片，返回最相似的其他图片 | 相似图片搜索、图片去重 |
| **以图搜文** | 上传一张图片，返回最相关的文档片段 | 图片内容理解、关联文档推荐 |
| **文搜图** | 输入文字描述，返回最匹配的图片 | 按内容搜索图片库 |

**核心特性**:
- 使用FAISS向量索引，支持百万级数据的快速检索
- 图片和文本共享512维特征空间
- 自动计算相似度分数（0-1范围）
- 实时更新索引，上传数据自动加入检索库

### 2. OCR识别率优化 (v2.0)
针对低分辨率(<300px)和模糊图片，实现了14项图像预处理技术：

| 技术 | 说明 | 效果 |
|------|------|------|
| **超分辨率增强** | 2x/3x双三次插值放大 | 小文字放大后更清晰 |
| **非局部均值去噪** | fastNlMeansDenoising | 去除图像噪点 |
| **CLAHE对比度增强** | 自适应直方图均衡 | 提升低对比度区域 |
| **图像锐化** | 9核拉普拉斯锐化 | 增强文字边缘 |
| **阴影去除** | 背景差分法 | 消除不均匀光照 |
| **倾斜校正** | minAreaRect自动旋转 | 处理倾斜文字 |
| **自适应阈值** | Gaussian加权二值化 | 不同光照区域自适应 |
| **Otsu阈值** | 自动最优阈值 | 全局二值化优化 |
| **形态学操作** | 开/闭运算 | 去除噪点、连接笔划 |
| **颜色反转** | bitwise_not | 处理白底黑字/黑底白字 |
| **双边滤波** | 边缘保持去噪 | 保护文字边缘 |
| **PIL增强** | 对比度/锐度/亮度 | 备选增强方案 |
| **多配置尝试** | 4种Tesseract PSM模式 | 适应不同排版 |
| **置信度评估** | 自动选择最佳结果 | 保证识别质量 |

**预期提升**: 识别率从 <30% 提升到 70%+

### 2. 知识图谱存储
- 使用Neo4j图数据库
- 实体类型：人物(PER)、地点(LOC)、组织(ORG)、事件(EVENT)、物体(OBJECT)
- 关系类型：位于、属于、举办、参加、工作于、包含等

### 3. 自然语言查询
- 支持多模态联合查询
- 示例："找包含'长城'文字的图片，且图片中有'游客'的实体"
- 支持实体、关系查询

### 4. 可视化展示
- 知识图谱网络可视化（使用vis.js）
- 图片缩略图展示
- 实时统计信息

## 项目结构

```
multimodal-kg/
├── backend/
│   ├── main.py              # FastAPI 后端主文件
│   ├── image_processor.py   # 图片处理模块（OCR+物体检测）
│   ├── document_processor.py # 文档处理模块（BERT实体抽取）
│   ├── knowledge_graph.py   # Neo4j知识图谱操作
│   ├── create_sample_data.py # 示例数据生成脚本
│   └── requirements.txt     # Python依赖
├── frontend/
│   └── index.html           # 前端可视化界面
├── data/
│   ├── images/              # 图片数据目录
│   └── documents/           # 文档数据目录
└── uploads/
    └── thumbnails/          # 图片缩略图
```

## 安装与运行

### 前置要求

1. **Neo4j 数据库**
   - 下载并安装 Neo4j Desktop 或 Neo4j Server
   - 创建一个数据库实例
   - 默认配置：bolt://localhost:7687, 用户: neo4j, 密码: password

2. **Tesseract OCR**
   - Windows: 下载并安装 Tesseract OCR，添加到系统PATH
   - 下载中文语言包 chi_sim.traineddata

3. **Python 3.8+**

### 安装步骤

1. **安装Python依赖**
```bash
cd backend
pip install -r requirements.txt
```

2. **启动Neo4j数据库**
   - 确保Neo4j服务正在运行
   - 确认连接配置正确

3. **创建示例数据（可选）**
```bash
python create_sample_data.py
```

4. **启动后端服务**
```bash
python main.py
```
服务将在 http://localhost:8000 启动

5. **打开前端界面**
   - 直接在浏览器中打开 `frontend/index.html`
   - 或使用HTTP服务器（如Live Server）打开

## API接口

### 数据上传
- `POST /api/upload/image` - 上传并处理图片
- `POST /api/upload/document` - 上传并处理文档

### 查询接口
- `POST /api/query` - 自然语言查询
- `GET /api/graph` - 获取完整图谱数据
- `GET /api/entities` - 获取所有实体
- `GET /api/relations` - 获取所有关系
- `GET /api/images` - 获取所有图片

### 管理接口
- `DELETE /api/clear` - 清空数据库

## 使用示例

### 1. 上传图片
- 点击"点击上传图片"按钮
- 选择一张图片文件
- 系统自动进行OCR和物体检测
- 提取的实体自动添加到知识图谱

### 2. 上传文档
- 点击"点击上传文档"按钮
- 支持.txt, .json, .csv格式
- 系统自动提取实体和关系

### 3. 自然语言查询
输入查询语句，例如：
- "找包含长城文字的图片，且图片中有游客的实体"
- "显示所有实体"
- "显示所有关系"
- "找包含北京的图片"

## 实体类型说明

| 类型标签 | 说明 | 颜色 |
|---------|------|------|
| PER | 人物 | 红色 |
| LOC | 地点 | 蓝色 |
| ORG | 组织 | 绿色 |
| EVENT | 事件 | 黄色 |
| OBJECT | 物体 | 紫色 |

## 技术栈

- **后端**: FastAPI, Python
- **数据库**: Neo4j
- **图片处理**: OpenCV, Tesseract OCR
- **NLP**: 基于规则的实体关系抽取（可扩展为真正的BERT）
- **前端**: HTML5, JavaScript, vis.js

## 注意事项

1. **Neo4j连接**: 如果Neo4j配置不同，请修改 `knowledge_graph.py` 中的连接参数
2. **Tesseract路径**: Windows下可能需要在 `image_processor.py` 中指定tesseract路径
3. **中文支持**: 确保Tesseract安装了中文语言包
4. **BERT扩展**: 当前使用规则匹配，如需真正的BERT，可集成transformers库
5. **OCR优化说明**: 针对低分辨率图片，系统会自动应用14种预处理技术并选择最佳结果

## OCR测试
```bash
cd backend

# 快速测试（简单验证）
python quick_test_ocr.py

# 完整测试（多种质量图片 + 识别率统计）
python test_ocr_improvement.py
```

## 扩展建议

1. 集成真正的BERT模型（如bert-base-chinese）进行实体关系抽取
2. 添加更多物体检测模型（如YOLO）
3. 实现图片相似度搜索
4. 添加用户认证和权限管理
5. 支持更多文件格式（PDF, Word等）
6. 添加图谱编辑功能

## 许可证

MIT License
