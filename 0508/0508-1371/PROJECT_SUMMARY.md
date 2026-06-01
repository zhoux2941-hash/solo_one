# USB HID 攻击载荷生成与检测框架 - 项目总结

## ✅ 项目完成状态

**开发完成！** 所有核心功能模块已实现，TypeScript编译通过。

---

## 📁 项目结构

```
d:\trae-project\0508-1371/
├── .trae/documents/
│   ├── PRD.md                    # 产品需求文档
│   └── ARCHITECTURE.md           # 技术架构文档
├── electron/
│   ├── main/
│   │   ├── index.ts               # Electron主进程入口
│   │   ├── compiler/              # DSL编译器
│   │   │   ├── ast.ts             # AST节点定义
│   │   │   ├── lexer.ts           # 词法分析器
│   │   │   └── parser.ts          # 语法解析器
│   │   ├── generators/            # 设备代码生成器
│   │   │   ├── base.ts            # 基础生成器
│   │   │   ├── arduino.ts         # Arduino Leonardo
│   │   │   ├── pico.ts            # Raspberry Pi Pico
│   │   │   ├── badusb.ts          # BadUSB/Rubber Ducky
│   │   │   └── flipper.ts         # Flipper Zero
│   │   ├── detection/             # 检测模块
│   │   │   ├── hid-listener.ts    # HID输入监听
│   │   │   ├── analyzer.ts        # 异常行为分析
│   │   │   └── signatures.ts      # 签名匹配引擎
│   │   ├── database/              # 数据层
│   │   │   ├── schema.sql         # 数据库Schema
│   │   │   └── db.ts              # 数据库操作类
│   │   ├── services/              # 服务管理
│   │   │   └── windows-service.ts # Windows服务
│   │   ├── playback/              # 回放模块
│   │   │   └── player.ts          # 输入序列播放器
│   │   ├── virustotal/            # VirusTotal模块
│   │   │   └── client.ts          # VT API客户端
│   │   ├── signatures/            # 签名库管理
│   │   │   ├── manager.ts         # 签名管理器
│   │   │   └── default-signatures.yaml # 默认签名
│   │   ├── ipc/                   # IPC通信
│   │   │   └── handlers.ts        # IPC处理器
│   │   └── types/                 # 类型声明
│   │       ├── better-sqlite3.d.ts
│   │       └── node-windows.d.ts
│   ├── preload/
│   │   └── index.ts               # 预加载脚本
│   └── tsconfig.json              # Electron TypeScript配置
├── src/
│   ├── renderer/                  # React前端
│   │   ├── App.tsx                # 主应用组件
│   │   ├── main.tsx               # 入口文件
│   │   ├── store/
│   │   │   └── index.ts           # Zustand状态管理
│   │   ├── hooks/
│   │   │   ├── useIPC.ts          # IPC调用hooks
│   │   │   └── useDetection.ts    # 检测相关hooks
│   │   ├── types/
│   │   │   └── electron.d.ts      # Electron API类型
│   │   ├── components/            # UI组件
│   │   │   ├── Layout.tsx         # 主布局
│   │   │   ├── Sidebar.tsx        # 侧边栏导航
│   │   │   ├── StatusBar.tsx      # 状态栏
│   │   │   └── AlertBanner.tsx    # 告警横幅
│   │   └── pages/                 # 页面组件
│   │       ├── Dashboard.tsx      # 仪表板
│   │       ├── PayloadGenerator.tsx # 载荷生成
│   │       ├── TemplateLibrary.tsx # 模板库
│   │       ├── DeviceCompiler.tsx  # 设备编译
│   │       ├── DetectionMonitor.tsx # 检测监控
│   │       ├── EventQuery.tsx     # 事件查询
│   │       ├── ServiceControl.tsx # 服务控制
│   │       ├── AnalysisTools.tsx  # 分析工具
│   │       ├── SignatureManager.tsx # 签名管理
│   │       └── SystemSettings.tsx # 系统设置
│   ├── shared/                    # 前后端共享代码
│   │   ├── types/
│   │   │   └── index.ts           # 共享类型定义
│   │   ├── constants/
│   │   │   └── index.ts           # 常量定义
│   │   └── templates/             # 攻击模板
│   │       ├── index.ts           # 模板索引
│   │       ├── windows-reverse-shell.dsl
│   │       ├── macos-privilege-escalation.dsl
│   │       ├── linux-ssh-steal.dsl
│   │       ├── bypass-uac.dsl
│   │       ├── disable-defender.dsl
│   │       └── usb-boot-execute.dsl
│   ├── index.css                  # 全局样式(赛博朋克风格)
│   └── vite-env.d.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── electron-builder.json
└── PROJECT_SUMMARY.md
```

---

## 🎯 已实现的核心功能

### 🔴 攻击载荷生成模块

| 功能 | 状态 | 文件 |
|------|------|------|
| DSL词法分析器 | ✅ | [lexer.ts](file:///d:/trae-project/0508-1371/electron/main/compiler/lexer.ts) |
| DSL语法解析器 | ✅ | [parser.ts](file:///d:/trae-project/0508-1371/electron/main/compiler/parser.ts) |
| AST节点定义 | ✅ | [ast.ts](file:///d:/trae-project/0508-1371/electron/main/compiler/ast.ts) |
| Arduino代码生成 | ✅ | [arduino.ts](file:///d:/trae-project/0508-1371/electron/main/generators/arduino.ts) |
| Raspberry Pi Pico代码生成 | ✅ | [pico.ts](file:///d:/trae-project/0508-1371/electron/main/generators/pico.ts) |
| BadUSB格式生成 | ✅ | [badusb.ts](file:///d:/trae-project/0508-1371/electron/main/generators/badusb.ts) |
| Flipper Zero格式生成 | ✅ | [flipper.ts](file:///d:/trae-project/0508-1371/electron/main/generators/flipper.ts) |

### 🛡️ HID检测与防御模块

| 功能 | 状态 | 文件 |
|------|------|------|
| HID设备监听 | ✅ | [hid-listener.ts](file:///d:/trae-project/0508-1371/electron/main/detection/hid-listener.ts) |
| 异常行为分析引擎 | ✅ | [analyzer.ts](file:///d:/trae-project/0508-1371/electron/main/detection/analyzer.ts) |
| 攻击签名匹配 | ✅ | [signatures.ts](file:///d:/trae-project/0508-1371/electron/main/detection/signatures.ts) |
| 输入速度检测 | ✅ | [analyzer.ts](file:///d:/trae-project/0508-1371/electron/main/detection/analyzer.ts#L100-L150) |
| 快捷键密度检测 | ✅ | [analyzer.ts](file:///d:/trae-project/0508-1371/electron/main/detection/analyzer.ts#L150-L200) |
| 鼠标边缘检测 | ✅ | [analyzer.ts](file:///d:/trae-project/0508-1371/electron/main/detection/analyzer.ts#L200-L250) |

### 💾 数据存储模块

| 功能 | 状态 | 文件 |
|------|------|------|
| SQLite数据库Schema | ✅ | [schema.sql](file:///d:/trae-project/0508-1371/electron/main/database/schema.sql) |
| 数据库操作类 | ✅ | [db.ts](file:///d:/trae-project/0508-1371/electron/main/database/db.ts) |
| 设备CRUD | ✅ | [db.ts](file:///d:/trae-project/0508-1371/electron/main/database/db.ts#L232-L318) |
| 事件CRUD | ✅ | [db.ts](file:///d:/trae-project/0508-1371/electron/main/database/db.ts#L320-L540) |
| 告警CRUD | ✅ | [db.ts](file:///d:/trae-project/0508-1371/electron/main/database/db.ts#L542-L793) |
| 签名CRUD | ✅ | [db.ts](file:///d:/trae-project/0508-1371/electron/main/database/db.ts#L795-L881) |
| VT扫描结果CRUD | ✅ | [db.ts](file:///d:/trae-project/0508-1371/electron/main/database/db.ts#L883-L979) |

### ⚙️ 系统服务模块

| 功能 | 状态 | 文件 |
|------|------|------|
| Windows服务安装/卸载 | ✅ | [windows-service.ts](file:///d:/trae-project/0508-1371/electron/main/services/windows-service.ts) |
| Windows服务启动/停止 | ✅ | [windows-service.ts](file:///d:/trae-project/0508-1371/electron/main/services/windows-service.ts) |
| 开机自启配置 | ✅ | [windows-service.ts](file:///d:/trae-project/0508-1371/electron/main/services/windows-service.ts) |
| 服务状态查询 | ✅ | [windows-service.ts](file:///d:/trae-project/0508-1371/electron/main/services/windows-service.ts) |

### 🎮 分析工具模块

| 功能 | 状态 | 文件 |
|------|------|------|
| 键盘输入序列回放 | ✅ | [player.ts](file:///d:/trae-project/0508-1371/electron/main/playback/player.ts) |
| 鼠标操作回放 | ✅ | [player.ts](file:///d:/trae-project/0508-1371/electron/main/playback/player.ts) |
| 播放速度控制 | ✅ | [player.ts](file:///d:/trae-project/0508-1371/electron/main/playback/player.ts) |
| VirusTotal API客户端 | ✅ | [client.ts](file:///d:/trae-project/0508-1371/electron/main/virustotal/client.ts) |
| 文件上传扫描 | ✅ | [client.ts](file:///d:/trae-project/0508-1371/electron/main/virustotal/client.ts) |
| 检测率计算 | ✅ | [client.ts](file:///d:/trae-project/0508-1371/electron/main/virustotal/client.ts) |

### 📜 签名库管理模块

| 功能 | 状态 | 文件 |
|------|------|------|
| 默认攻击签名库(8个) | ✅ | [default-signatures.yaml](file:///d:/trae-project/0508-1371/electron/main/signatures/default-signatures.yaml) |
| 签名增删改查 | ✅ | [manager.ts](file:///d:/trae-project/0508-1371/electron/main/signatures/manager.ts) |
| 远程签名更新 | ✅ | [manager.ts](file:///d:/trae-project/0508-1371/electron/main/signatures/manager.ts) |
| YAML签名格式 | ✅ | [default-signatures.yaml](file:///d:/trae-project/0508-1371/electron/main/signatures/default-signatures.yaml) |

### 📋 攻击模板库

| 模板 | 状态 | 文件 |
|------|------|------|
| Windows反向Shell | ✅ | [windows-reverse-shell.dsl](file:///d:/trae-project/0508-1371/src/shared/templates/windows-reverse-shell.dsl) |
| MacOS提权 | ✅ | [macos-privilege-escalation.dsl](file:///d:/trae-project/0508-1371/src/shared/templates/macos-privilege-escalation.dsl) |
| Linux SSH密钥窃取 | ✅ | [linux-ssh-steal.dsl](file:///d:/trae-project/0508-1371/src/shared/templates/linux-ssh-steal.dsl) |
| UAC绕过 | ✅ | [bypass-uac.dsl](file:///d:/trae-project/0508-1371/src/shared/templates/bypass-uac.dsl) |
| 禁用Windows Defender | ✅ | [disable-defender.dsl](file:///d:/trae-project/0508-1371/src/shared/templates/disable-defender.dsl) |
| U盘启动执行 | ✅ | [usb-boot-execute.dsl](file:///d:/trae-project/0508-1371/src/shared/templates/usb-boot-execute.dsl) |

### 🖥️ React前端界面 (10个页面)

| 页面 | 状态 | 文件 |
|------|------|------|
| 仪表板 | ✅ | [Dashboard.tsx](file:///d:/trae-project/0508-1371/src/renderer/pages/Dashboard.tsx) |
| 载荷生成 | ✅ | [PayloadGenerator.tsx](file:///d:/trae-project/0508-1371/src/renderer/pages/PayloadGenerator.tsx) |
| 模板库 | ✅ | [TemplateLibrary.tsx](file:///d:/trae-project/0508-1371/src/renderer/pages/TemplateLibrary.tsx) |
| 设备编译 | ✅ | [DeviceCompiler.tsx](file:///d:/trae-project/0508-1371/src/renderer/pages/DeviceCompiler.tsx) |
| 检测监控 | ✅ | [DetectionMonitor.tsx](file:///d:/trae-project/0508-1371/src/renderer/pages/DetectionMonitor.tsx) |
| 事件查询 | ✅ | [EventQuery.tsx](file:///d:/trae-project/0508-1371/src/renderer/pages/EventQuery.tsx) |
| 服务控制 | ✅ | [ServiceControl.tsx](file:///d:/trae-project/0508-1371/src/renderer/pages/ServiceControl.tsx) |
| 分析工具 | ✅ | [AnalysisTools.tsx](file:///d:/trae-project/0508-1371/src/renderer/pages/AnalysisTools.tsx) |
| 签名管理 | ✅ | [SignatureManager.tsx](file:///d:/trae-project/0508-1371/src/renderer/pages/SignatureManager.tsx) |
| 系统设置 | ✅ | [SystemSettings.tsx](file:///d:/trae-project/0508-1371/src/renderer/pages/SystemSettings.tsx) |

---

## 🎨 UI设计特点

### 赛博朋克风格
- **深色主题**：`#0f172a` 深蓝色背景
- **霓虹色调**：青色 `#06b6d4`、紫色 `#8b5cf6`、绿色 `#10b981`、红色 `#ef4444`、黄色 `#f59e0b`
- **发光效果**：霓虹阴影、文字发光
- **玻璃态面板**：backdrop-blur 半透明效果
- **数据流动画**：顶部渐变流动边框
- **网格背景**：赛博风格网格线
- **扫描线效果**：复古CRT扫描线

### 字体
- **代码/显示**：Fira Code, JetBrains Mono (等宽字体)

---

## 🛠️ 技术栈

### 后端 (Electron 主进程)
- **运行时**: Electron 28
- **语言**: TypeScript 5.8
- **数据库**: better-sqlite3 (同步高性能)
- **HID设备**: node-hid + usb
- **输入回放**: robotjs
- **Windows服务**: node-windows
- **YAML解析**: js-yaml
- **HTTP客户端**: axios
- **文件系统**: fs-extra

### 前端 (Electron 渲染进程)
- **框架**: React 18
- **构建工具**: Vite 6
- **语言**: TypeScript 5.8
- **样式**: TailwindCSS 3
- **状态管理**: Zustand
- **代码编辑器**: Monaco Editor
- **图表**: Recharts
- **图标**: Lucide React
- **路由**: React Router v7

---

## 🚀 运行方式

### 开发模式
```bash
# 安装依赖
npm install

# 开发模式启动
npm run dev:electron
```

### 构建打包
```bash
# 构建Windows安装包
npm run build:win

# 构建Electron应用
npm run build:electron
```

### 类型检查
```bash
# 检查前端类型
npm run check

# 检查Electron类型
npx tsc -p electron/tsconfig.json --noEmit
```

---

## 📝 DSL语法支持

### 基础命令
| 命令 | 说明 |
|------|------|
| `DELAY ms` | 延迟指定毫秒 |
| `STRING text` | 输入字符串 |
| `ENTER` | 按下回车键 |
| `GUI r` / `WINDOWS r` | Win+R组合键 |
| `CTRL SHIFT ESC` | 多修饰键组合 |
| `DOWN 3` | 方向键重复 |
| `F1-F12` | 功能键 |

### 高级命令
| 命令 | 说明 |
|------|------|
| `VAR $NAME = value` | 定义变量 |
| `REPEAT N { ... }` | 循环执行 |
| `IF_OS windows { ... }` | 条件判断 |
| `INCLUDE template` | 包含模板 |
| `MOUSE_MOVE x y` | 移动鼠标 |
| `MOUSE_CLICK left` | 点击鼠标 |

---

## 🔍 检测引擎特性

### 异常检测维度
1. **输入速度**：超过每分钟400字符触发警告
2. **快捷键密度**：短时间内大量快捷键组合
3. **输入间隔方差**：检测机械规律性输入
4. **鼠标边缘移动**：检测鼠标移到屏幕角落
5. **序列模式匹配**：匹配已知攻击序列

### 内置攻击签名 (8个)
- STAT-001: 异常输入速度检测
- STAT-002: 快速快捷键攻击
- SEQ-001: Win+R+cmd序列检测
- SEQ-002: PowerShell反向Shell模式
- REG-001: 注册表命令检测
- REG-002: 系统命令执行检测
- MOUSE-001: 鼠标边缘移动检测
- SEQ-003: UAC绕过模式

---

## 📊 数据库表结构

1. **detected_devices** - 检测到的HID设备
2. **input_events** - 输入事件记录
3. **detection_alerts** - 检测告警
4. **attack_signatures** - 攻击签名库
5. **alert_signatures** - 告警-签名关联
6. **compiled_payloads** - 编译的载荷
7. **virustotal_scans** - VT扫描结果
8. **app_settings** - 应用设置

---

## ✅ 编译验证

```
✓ 前端TypeScript编译: 通过 (tsc -b --noEmit)
✓ Electron TypeScript编译: 通过 (tsc -p electron/tsconfig.json --noEmit)
✓ 所有类型声明: 已配置
✓ 依赖: 已安装
```

---

## 📚 文档

- **PRD文档**: [PRD.md](file:///d:/trae-project/0508-1371/.trae/documents/PRD.md)
- **技术架构**: [ARCHITECTURE.md](file:///d:/trae-project/0508-1371/.trae/documents/ARCHITECTURE.md)

---

**项目开发完成！** 🎉
