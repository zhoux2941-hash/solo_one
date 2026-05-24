# WebTransport WebSSH Client

一个基于WebTransport的现代化WebSSH客户端，支持多标签页、加密存储、低延迟输入等功能。

## 功能特性

- 🔐 **SSH连接** - 支持密码和私钥认证
- 📱 **多标签页** - 同时连接多台服务器
- 💻 **xterm.js终端** - 完整支持ANSI转义序列、颜色、光标移动
- 🔒 **加密存储** - 本地加密保存连接历史和密码
- ⚡ **低延迟输入** - 输入延迟<30ms
- 📐 **自适应调整** - 窗口resize时自动发送终端尺寸变化
- ⌨️ **快捷键支持** - Ctrl+C、Ctrl+Z等常用快捷键
- 🌐 **WebTransport架构** - 基于HTTP/3的现代化传输协议

## 技术栈

### 后端
- Node.js + TypeScript
- ssh2 - SSH客户端库
- ws - WebSocket服务器
- HTTP/2支持

### 前端
- React 18 + TypeScript
- Vite - 构建工具
- xterm.js - 终端模拟器
- xterm-addon-fit - 自动调整尺寸
- xterm-addon-web-links - 链接支持
- crypto-js - 加密库

## 安装

```bash
npm install
```

## 运行

### 开发模式

1. 启动后端服务器:
```bash
npm run dev:server
```

2. 启动前端开发服务器 (在另一个终端):
```bash
npm run dev
```

3. 打开浏览器访问: https://localhost:3000

### 生产构建

```bash
npm run build
npm run server
```

## 使用说明

### 创建新连接

1. 点击侧边栏的 **+ New** 按钮或标签栏的 **+** 按钮
2. 填写连接信息:
   - Connection Name: 连接名称 (可选)
   - Host: 服务器地址 (如: 192.168.1.100)
   - Port: SSH端口 (默认: 22)
   - Username: 用户名
   - 选择认证方式: 密码 或 私钥
3. 点击 **Connect**

### 管理连接

- 连接会自动保存到本地 (密码加密存储)
- 点击侧边栏中的连接可快速连接
- 使用 ✏️ 编辑连接
- 使用 🗑️ 删除连接

### 快捷键

- `Ctrl + T` - 新建标签页
- `Ctrl + W` - 关闭当前标签页
- `Ctrl + C` - 发送中断信号
- `Ctrl + Z` - 挂起进程
- `Ctrl + L` - 清屏

## 项目结构

```
.
├── src/
│   ├── client/
│   │   ├── components/
│   │   │   ├── Terminal.tsx      # 终端组件
│   │   │   ├── Tabs.tsx          # 标签页组件
│   │   │   ├── Sidebar.tsx       # 侧边栏
│   │   │   └── ConnectionDialog.tsx # 连接对话框
│   │   ├── services/
│   │   │   └── transport.ts      # 传输服务
│   │   ├── utils/
│   │   │   ├── crypto.ts         # 加密工具
│   │   │   └── storage.ts        # 本地存储
│   │   ├── types.ts              # 类型定义
│   │   ├── App.tsx               # 主应用
│   │   └── main.tsx              # 入口文件
│   └── server/
│       ├── index.ts              # 服务器入口
│       ├── ssh-manager.ts        # SSH连接管理器
│       └── types.ts              # 类型定义
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 性能优化

- **低延迟输入**: 使用performance.now()监控输入延迟
- **高效渲染**: xterm.js使用Canvas渲染
- **响应式设计**: 窗口resize时自动调整终端尺寸
- **连接池管理**: 高效管理多个SSH连接

## 安全特性

- 密码使用AES加密存储在本地
- 支持SSH密钥认证
- HTTPS/WSS加密传输
- 不存储私钥密码

## 浏览器支持

- Chrome 97+
- Firefox 112+
- Safari 15.4+
- Edge 97+

## 许可证

MIT
