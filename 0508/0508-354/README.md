# 汉字描红字帖生成与临摹评估系统

一个基于图像处理和机器学习的汉字书法练习系统，支持字帖生成、临摹拍照评分和PDF导出。

## 功能特性

### 1. 字帖生成
- **字体选择**: 支持楷书、行书、隶书三种字体
- **米字格**: 自动生成标准米字格背景
- **笔顺箭头**: 显示汉字笔画顺序指引（红色箭头）
- **自定义排版**: 可调节行列数，生成多字排版字帖

### 2. 临摹评分
- **拍照上传**: 支持摄像头拍照或从相册选择
- **智能评分**: 
  - 结构相似度分析
  - 形状上下文匹配
  - 相关度计算
  - 综合得分 (0-100)
- **差异标注**: 自动识别差异区域并用红圈标注
- **实时反馈**: 给出改进建议
- **快速响应**: 单字比对 < 2秒

### 3. PDF导出
- **A4纸打印**: 标准A4纸张格式
- **多字排版**: 支持行列自定义
- **描红模式**: 首行黑色，后续灰色描红

## 项目结构

```
e:\trae-project\0508-354/
├── backend/                    # 后端服务
│   ├── app.py                 # Flask主应用
│   ├── requirements.txt       # Python依赖
│   ├── fonts/                 # 字体文件目录
│   └── services/              # 核心服务模块
│       ├── character_generator.py   # 字帖生成
│       ├── skeleton_extractor.py    # 骨架提取 (Zhang-Suen)
│       ├── shape_context.py         # 形状上下文匹配
│       ├── similarity.py            # 相似度计算
│       └── pdf_generator.py         # PDF生成
├── frontend/                   # 前端应用
│   ├── package.json           # npm依赖
│   ├── public/
│   │   └── index.html         # HTML入口
│   └── src/
│       ├── App.js             # 主应用组件
│       ├── index.js           # React入口
│       └── components/        # UI组件
│           ├── CharacterSelector.jsx   # 汉字选择
│           ├── CopybookGenerator.jsx   # 字帖生成
│           └── PracticeEvaluator.jsx   # 评分评估
├── install_backend.bat        # 后端依赖安装
├── install_frontend.bat       # 前端依赖安装
├── start_backend.bat          # 后端启动
└── start_frontend.bat         # 前端启动
```

## 安装与运行

### 环境要求

- Python 3.8+
- Node.js 16+
- npm 8+

### 第一步：安装后端依赖

双击运行 `install_backend.bat`，或手动执行：

```bash
cd backend
pip install -r requirements.txt
```

### 第二步：安装前端依赖

双击运行 `install_frontend.bat`，或手动执行：

```bash
cd frontend
npm install
```

### 第三步：启动后端服务

双击运行 `start_backend.bat`，或手动执行：

```bash
cd backend
python app.py
```

后端服务将在 `http://localhost:5000` 启动。

### 第四步：启动前端服务

双击运行 `start_frontend.bat`，或手动执行：

```bash
cd frontend
npm start
```

前端服务将在 `http://localhost:3000` 启动。

## 使用指南

### 1. 选择汉字

1. 点击"选择汉字"标签
2. 选择字体（楷书/行书/隶书）
3. 点击常用汉字按钮或手动输入汉字
4. 预览生成的字帖
5. 点击"确认选择"

### 2. 生成字帖

1. 点击"生成字帖"标签
2. 选择字体
3. 输入多个汉字（用空格或直接连续输入）
4. 设置行列数
5. 点击"预览字帖"查看效果
6. 点击"下载PDF"导出可打印的PDF文件

### 3. 临摹评分

1. 点击"评分对比"标签
2. 查看参考字帖
3. 点击上传区域或"拍照"按钮上传临摹作品
4. 点击"开始评分"
5. 查看评分结果：
   - 综合得分 (0-100)
   - 结构/形状/相关度分项得分
   - 差异区域标注
   - 改进建议

## 核心算法说明

### 骨架提取 (Zhang-Suen细化算法)
- 二值化图像
- 迭代式细化，保持连通性
- 提取单像素宽的笔画骨架

### 形状上下文匹配
- 从骨架中采样特征点
- 计算每个点的形状上下文直方图（极坐标分箱）
- 使用匈牙利算法进行最优匹配
- 计算匹配代价作为形状相似度

### 综合评分
```
总分 = 0.4 × 结构得分 + 0.35 × 形状得分 + 0.25 × 相关度得分
```

- **结构得分**: 基于IoU（交并比）的骨架重叠度
- **形状得分**: 基于形状上下文的形状相似度
- **相关度**: 基于像素级相关系数

## API接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/fonts` | GET | 获取可用字体列表 |
| `/api/generate-character` | POST | 生成单字字帖 |
| `/api/generate-copybook` | POST | 生成多字字帖 |
| `/api/extract-skeleton` | POST | 提取图像骨架 |
| `/api/calculate-similarity` | POST | 计算临摹相似度 |
| `/api/detailed-analysis` | POST | 详细分析（含笔顺评分） |
| `/api/generate-pdf` | POST | 生成PDF字帖 |
| `/api/download-pdf` | POST | 下载PDF文件 |
| `/api/batch-evaluate` | POST | 批量评估多个字 |

## 常见问题

### Q: 如何添加自定义字体？
A: 将字体文件（.ttf或.ttc）放入 `backend/fonts/` 目录，然后在 `character_generator.py` 的 `font_map` 中添加映射。

### Q: 评分不准确怎么办？
A: 
- 确保拍照时光线充足，角度正面
- 尽量让汉字充满画面
- 使用米字格练习本效果更好

### Q: 如何调整评分权重？
A: 修改 `similarity.py` 中 `calculate_similarity` 方法的权重参数。

## 技术栈

**后端**:
- Flask - Web框架
- OpenCV - 图像处理
- Pillow - 图像生成
- NumPy/SciPy - 数值计算
- ReportLab - PDF生成

**前端**:
- React 18 - UI框架
- Axios - HTTP客户端
- CSS3 - 样式

## 许可证

MIT License
