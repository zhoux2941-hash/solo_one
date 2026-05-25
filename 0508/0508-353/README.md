# 手语教学系统

AI辅助手语学习平台，基于MediaPipe手部关键点检测和DTW动态时间规整算法。

## 功能特性

- 20个常用手语词汇教学
- 摄像头实时录制手语视频
- MediaPipe手部关键点提取（21个关键点）
- DTW动态时间规整比对算法
- 相似度评分（0-100分）
- 关键点偏差热力图
- 练习历史记录和趋势图
- SQLite数据库存储

## 技术栈

### 后端
- FastAPI
- MediaPipe
- OpenCV
- SQLAlchemy + SQLite
- SciPy

### 前端
- React 18 + TypeScript
- Vite
- TailwindCSS
- Chart.js
- Lucide Icons

## 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+
- 摄像头设备

### 方式一：使用启动脚本（推荐）

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

### 方式二：手动启动

#### 启动后端
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 启动前端
```bash
cd frontend
npm install
npm run dev
```

## 访问地址

- 前端应用: http://localhost:5173
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

## API接口

### 健康检查
```
GET /api/health
```

### 词汇列表
```
GET /api/words
```

### 获取模板
```
GET /api/templates/{word_id}
```

### 创建用户
```
POST /api/users
Content-Type: application/json

{
  "username": "用户名"
}
```

### 比对手语
```
POST /api/compare/{word_id}?user_id={user_id}
Content-Type: multipart/form-data

video: 视频文件
```

### 练习历史
```
GET /api/history/{user_id}
GET /api/history/{user_id}/records
```

### 删除记录
```
DELETE /api/records/{record_id}
```

## 20个常用手语词汇

1. 你好 (hello)
2. 谢谢 (thank_you)
3. 对不起 (sorry)
4. 请 (please)
5. 好 (good)
6. 不好 (bad)
7. 是 (yes)
8. 不是 (no)
9. 要 (want)
10. 不要 (dont_want)
11. 我 (i)
12. 你 (you)
13. 他 (he)
14. 喜欢 (like)
15. 帮助 (help)
16. 学习 (learn)
17. 工作 (work)
18. 吃饭 (eat)
19. 喝水 (drink)
20. 再见 (goodbye)

## 项目结构

```
.
├── backend/                 # 后端代码
│   ├── app/
│   │   ├── main.py         # FastAPI主应用
│   │   ├── database.py     # 数据库配置
│   │   ├── models.py       # SQLAlchemy模型
│   │   ├── schemas.py      # Pydantic模式
│   │   ├── hand_landmark.py # MediaPipe手部关键点提取
│   │   ├── dtw_comparator.py # DTW比对算法
│   │   └── templates.py    # 标准手语模板
│   ├── data/               # 数据目录
│   │   ├── sign_language.db # SQLite数据库
│   │   └── templates/      # 模板JSON文件
│   ├── requirements.txt    # Python依赖
│   └── test_api.py         # API测试脚本
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── services/       # API服务
│   │   ├── types/          # TypeScript类型
│   │   ├── App.tsx         # 主应用组件
│   │   └── main.tsx        # 入口文件
│   ├── package.json        # Node依赖
│   └── vite.config.ts      # Vite配置
├── start.bat               # Windows启动脚本
└── start.sh                # Linux/Mac启动脚本
```

## 使用说明

1. 打开浏览器访问 http://localhost:5173
2. 输入用户名开始学习
3. 选择想要学习的手语词汇
4. 点击"开始录制"按钮，用手比划相应的手语动作
5. 录制完成后系统会自动分析并给出评分
6. 查看评分结果和偏差热力图
7. 在"历史记录"页面查看练习趋势

## 评分标准

- 90-100分：优秀
- 80-89分：良好
- 60-79分：及格
- 0-59分：需要练习

## 注意事项

- 首次启动会自动初始化20个标准手语模板
- 单次比对时间应小于3秒
- 数据库存储关键点数据而非原视频文件
- 录制时长限制为15秒
