# 学术会议投稿系统

一个完整的学术会议投稿管理系统，支持作者投稿、审稿人评审、主席管理等功能。

## 功能特性

### 作者 (Author)
- 注册/登录账号
- 上传论文（PDF文件、标题、摘要、关键词）
- 查看投稿状态和审稿进度
- 查看最终审稿结果和评语汇总

### 审稿人 (Reviewer)
- 注册/登录账号
- 设置研究领域关键词
- 查看分配给自己的审稿任务
- 在线填写审稿意见（1-5星推荐、文字评论、接收/小修/大修/拒稿）

### 主席 (Chair)
- 登录后台管理
- 查看所有投稿论文列表
- 基于关键词自动匹配审稿人
- 每篇论文分配2-3位审稿人
- 一键发送录用通知邮件（模拟）
- 查看审稿进度统计

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Ant Design
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite + TypeORM
- **文件上传**: Multer
- **认证**: JWT

## 快速开始

### 安装依赖
```bash
npm run install:all
```

### 启动开发服务器
```bash
npm run dev
```

- 前端: http://localhost:5173
- 后端: http://localhost:3000

### 预设账号

**主席账号:**
- 邮箱: chair@conference.com
- 密码: chair123

**测试审稿人:**
- 邮箱: reviewer1@conference.com
- 密码: reviewer123

**测试作者:**
- 邮箱: author1@conference.com
- 密码: author123
