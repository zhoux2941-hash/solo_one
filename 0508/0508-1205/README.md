# 科目一题库练习系统

一个帮助驾照学员备考科目一考试的在线刷题平台。

## 功能特性

- **顺序练习**：每次20道题，循序渐进
- **错题本**：自动收集错题，支持按错误次数排序
- **模拟考试**：随机抽取100道题，45分钟倒计时，90分及格
- **成绩单**：详细展示正确率、错题分布、各章节得分率
- **历史记录**：最近10次模拟考成绩趋势折线图

## 技术栈

- React 18
- TypeScript
- Vite
- TailwindCSS
- Zustand (状态管理)
- Recharts (图表)
- React Router v6

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 打开浏览器访问

访问 http://localhost:3000

## 项目结构

```
src/
├── components/          # 组件目录
│   └── layout/         # 布局组件
├── data/               # 题库数据
│   └── questions.ts    # 1000道题库
├── pages/              # 页面组件
│   ├── HomePage.tsx    # 首页
│   ├── PracticePage.tsx # 顺序练习
│   ├── WrongPage.tsx   # 错题本
│   ├── ExamPage.tsx    # 模拟考试
│   ├── ResultPage.tsx  # 成绩单
│   └── HistoryPage.tsx # 历史记录
├── store/              # 状态管理
│   └── appStore.ts     # 全局状态
├── types/              # 类型定义
├── utils/              # 工具函数
├── App.tsx             # 应用主组件
└── main.tsx            # 入口文件
```

## 数据存储

应用使用 localStorage 存储学习数据，包括：
- 错题本
- 考试记录
- 学习统计

## 截图预览

### 首页
![首页](./screenshots/home.png)

### 顺序练习
![练习](./screenshots/practice.png)

### 模拟考试
![考试](./screenshots/exam.png)

## License

MIT
