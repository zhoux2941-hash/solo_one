# 摩尔密码加解密与训练工具 - 技术架构文档

## 1. 架构概述

### 1.1 整体架构
采用React + TypeScript单页应用架构，使用TailwindCSS进行样式管理，Web Audio API实现音频播放功能。

### 1.2 架构风格
- **前端框架**: React 18 + TypeScript
- **样式方案**: TailwindCSS 3
- **状态管理**: React Hooks (useState, useReducer)
- **音频处理**: Web Audio API
- **数据持久化**: localStorage

### 1.3 模块划分
| 模块 | 职责 | 状态 |
|------|------|------|
| morse-utils | 摩尔斯电码编码/解码核心逻辑 | 独立模块 |
| audio-player | 音频播放控制 | 独立模块 |
| training-mode | 训练模式逻辑 | 组件模块 |
| ui-components | 通用UI组件 | 组件模块 |

---

## 2. 目录结构

```
src/
├── components/          # UI组件
│   ├── Header.tsx       # 头部导航组件
│   ├── ModeSwitch.tsx   # 模式切换组件
│   ├── InputPanel.tsx   # 输入面板
│   ├── OutputPanel.tsx  # 输出面板
│   ├── ControlPanel.tsx # 控制面板（速度/频率调节）
│   ├── TrainingPanel.tsx # 训练模式面板
│   └── StatsPanel.tsx   # 统计面板
├── hooks/               # 自定义Hooks
│   ├── useAudioPlayer.ts # 音频播放Hook
│   └── useTraining.ts   # 训练模式Hook
├── utils/               # 工具函数
│   ├── morseCode.ts     # 摩尔斯电码映射表和转换函数
│   └── storage.ts       # localStorage操作
├── types/               # TypeScript类型定义
│   └── index.ts         # 类型定义文件
├── App.tsx              # 主应用组件
├── main.tsx             # 入口文件
└── index.css            # 全局样式
```

---

## 3. 核心组件设计

### 3.1 Header组件
- **功能**: 显示标题和模式切换
- **props**: 当前模式、模式切换回调
- **状态**: 无

### 3.2 ModeSwitch组件
- **功能**: 切换编码/解码/训练模式
- **props**: 当前模式、切换回调
- **状态**: 无

### 3.3 InputPanel组件
- **功能**: 输入文本或摩尔斯电码
- **props**: 输入值、输入类型、变化回调
- **状态**: 输入内容

### 3.4 OutputPanel组件
- **功能**: 显示转换结果
- **props**: 输出内容、播放按钮回调
- **状态**: 无

### 3.5 ControlPanel组件
- **功能**: 调节播放速度和频率
- **props**: 当前速度、当前频率、变化回调
- **状态**: 无

### 3.6 TrainingPanel组件
- **功能**: 训练模式界面
- **props**: 训练状态、控制回调
- **状态**: 用户输入答案

### 3.7 StatsPanel组件
- **功能**: 显示训练统计
- **props**: 统计数据
- **状态**: 无

---

## 4. 核心工具函数

### 4.1 morseCode.ts

#### 4.1.1 摩尔斯电码映射表
```typescript
export const MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
  'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
  'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
  'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
  'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
  'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....',
  '7': '--...', '8': '---..', '9': '----.', '.': '.-.-.-',
  ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...',
  ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
  '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-',
  '@': '.--.-.'
};
```

#### 4.1.2 编码函数
```typescript
export function textToMorse(text: string): string;
```

#### 4.1.3 解码函数
```typescript
export function morseToText(morse: string): string;
```

### 4.2 useAudioPlayer Hook

#### 4.2.1 接口定义
```typescript
interface AudioPlayer {
  play: (morseCode: string) => void;
  stop: () => void;
  isPlaying: boolean;
}
```

#### 4.2.2 参数
- **wpm**: 播放速度（5-20 WPM）
- **frequency**: 音频频率（默认800Hz）

### 4.3 useTraining Hook

#### 4.3.1 训练状态接口
```typescript
interface TrainingState {
  currentChar: string;      // 当前字符
  currentMorse: string;     // 当前字符的摩尔斯电码
  userInput: string;        // 用户输入
  isPlaying: boolean;       // 是否正在播放
  score: number;            // 得分
  total: number;            // 总题数
  correct: number;          // 正确数
  wrong: number;            // 错误数
  successRate: number;      // 成功率
  streak: number;           // 连续正确数
}
```

#### 4.3.2 方法
- **startNewRound**: 开始新一轮
- **checkAnswer**: 检查答案
- **resetStats**: 重置统计

---

## 5. 音频播放实现

### 5.1 Web Audio API 使用

#### 5.1.1 振荡器创建
```typescript
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();
```

#### 5.1.2 时长计算
- **点(.)**: 1单位时间
- **划(-)**: 3单位时间
- **字符间隔**: 1单位时间
- **单词间隔**: 7单位时间

#### 5.1.3 WPM到时间单位转换
```typescript
// PARIS标准: 50个点划单位 = 1词
// 1 WPM = 60秒 / 50单位 * 1词 = 1.2秒/词
const dotDuration = 60 / (wpm * 50) * 1000; // 毫秒
```

---

## 6. 数据流

### 6.1 编码模式数据流
```
用户输入 → textToMorse → 显示结果 → playAudio
```

### 6.2 解码模式数据流
```
用户输入 → morseToText → 显示结果
```

### 6.3 训练模式数据流
```
开始 → 随机选择字符 → 播放音频 → 用户输入 → checkAnswer → 更新统计
```

---

## 7. 状态管理

### 7.1 应用状态
```typescript
interface AppState {
  mode: 'encode' | 'decode' | 'train';
  inputText: string;
  outputText: string;
  wpm: number;
  frequency: number;
  trainingState: TrainingState;
}
```

### 7.2 持久化策略
- 使用localStorage保存训练统计数据
- 保存键: `morse-trainer-stats`
- 数据结构: `{ total, correct, wrong, successRate }`

---

## 8. 样式设计

### 8.1 主题色
- **背景色**: #0a0e17（深色背景）
- **主色**: #00ff88（绿色高亮）
- **辅色**: #00d4ff（蓝色高亮）
- **文本色**: #e0e6ed（浅色文本）
- **错误色**: #ff4757（红色）

### 8.2 字体
- **等宽字体**: 'JetBrains Mono', 'Fira Code', 'Consolas'
- **标题字体**: 'Orbitron', 'Rajdhani'

### 8.3 动画效果
- **脉冲动画**: 播放音频时的视觉反馈
- **渐变过渡**: 模式切换动画
- **闪烁效果**: 训练正确/错误提示

---

## 9. 性能优化

### 9.1 音频优化
- 使用Web Audio API原生实现，避免音频延迟
- 预计算时间单位，避免运行时重复计算

### 9.2 渲染优化
- 使用React.memo避免不必要的重渲染
- 虚拟滚动（如果需要显示大量历史记录）

### 9.3 缓存策略
- 缓存编码/解码结果
- localStorage缓存训练统计

---

## 10. 错误处理

### 10.1 输入验证
- 编码模式: 过滤无效字符
- 解码模式: 验证摩尔斯电码格式

### 10.2 音频错误
- 处理AudioContext不支持的情况
- 处理用户未授权音频播放的情况

### 10.3 边界情况
- 空输入处理
- 极端WPM值处理（限制在5-20范围内）

---

## 11. 测试策略

### 11.1 单元测试
- 编码函数测试
- 解码函数测试
- WPM计算测试

### 11.2 集成测试
- 音频播放流程测试
- 训练模式流程测试

### 11.3 端到端测试
- 用户流程测试（编码→播放→训练）

---

## 12. 部署方案

### 12.1 构建工具
- Vite 6.x
- 生产构建: `npm run build`

### 12.2 部署目标
- 静态网站托管（Vercel, Netlify, GitHub Pages）
- 无需后端支持

### 12.3 CI/CD
- GitHub Actions自动构建部署
