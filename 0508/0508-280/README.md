# WebGPU 实时海面波浪模拟

基于WebGPU和WGSL实现的实时海面波浪模拟系统，使用FFT方法基于Phillips频谱生成海浪。

## 功能特性

### 🌊 波浪生成
- **快速傅里叶变换(FFT)**: 使用Compute Shader实现2D FFT计算
- **Phillips频谱**: 基于物理的海浪频谱生成
- **实时更新**: 每一帧重新计算高度场和法线

### 🎨 海面渲染
- **动态细分网格**: 多LOD层级网格渲染
- **Patch系统**: 平铺式海面扩展，支持大面积渲染
- **高级材质**: 菲涅尔效果、反射、高光、深度雾效

### 💨 粒子系统泡沫
- **波峰检测**: 基于斜率检测波峰位置
- **粒子模拟**: 50000粒子模拟泡沫效果
- **混合渲染**: 加法混合实现真实泡沫效果

### 🎮 参数控制
- 风速调节 (1-30 m/s)
- 风向调节 (0-360度)
- 波浪高度缩放
- 泡沫强度调节

### 📷 摄像机系统
- **第一人称飞行模式**: WASD移动，鼠标旋转视角
- **跟随模式**: 自动环绕观察海面
- 空格键快速切换模式

## 运行要求

- 浏览器支持 WebGPU (Chrome 113+, Edge 113+)
- 启用WebGPU功能 (chrome://flags/#enable-unsafe-webgpu)

## 运行方法

1. 使用本地HTTP服务器运行项目，例如：

```bash
# 使用Python 3
python -m http.server 8000

# 或使用Node.js http-server
npx http-server -p 8000

# 或使用VS Code的Live Server插件
```

2. 在浏览器中打开 `http://localhost:8000`

## 操作说明

| 操作 | 说明 |
|------|------|
| W/S | 前进/后退 |
| A/D | 左移/右移 |
| Shift | 上升 |
| Ctrl | 下降 |
| 鼠标 | 旋转视角（点击画布锁定鼠标） |
| 空格 | 切换摄像机模式 |

## 项目结构

```
├── index.html              # 入口HTML
├── src/
│   ├── main.js             # 主入口文件
│   ├── camera.js           # 摄像机系统
│   ├── input.js            # 输入处理
│   ├── ocean-renderer.js   # 核心海洋渲染器
│   └── shaders/
│       ├── fft.wgsl        # FFT计算着色器
│       ├── spectrum.wgsl   # 频谱生成和法线计算
│       ├── ocean.wgsl      # 海面渲染
│       └── particles.wgsl  # 泡沫粒子系统
```

## 技术实现

### FFT海浪算法
1. 生成初始Phillips频谱 h0(k)
2. 每帧根据时间计算相位：h(k,t) = h0(k)e^(iω(k)t) + h0*(-k)e^(-iω(k)t)
3. 执行逆向FFT得到高度场
4. 计算法线用于光照

### 渲染优化
- 多层次LOD减少远处三角形数量
- Compute Shader并行计算FFT
- 纹理采样实现高度位移
- 深度雾效提升空间感
