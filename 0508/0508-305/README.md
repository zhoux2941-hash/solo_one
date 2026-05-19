# 机械键盘固件配置工具 (WebHID + WebUSB)

基于 WebHID/WebUSB 技术的客制化机械键盘在线配置工具，支持 QMK/VIA 固件键盘。

## ✨ 最新功能

### 🎵 音乐联动 RGB 灯效 (NEW!)
- **实时音频频谱分析**：使用 Web Audio API 采集麦克风音频
- **频谱可视化**：实时显示音频频谱柱状图
- **四种色彩模式**：
  - 🌈 彩虹渐变：全频段彩色流动
  - 💫 脉冲单色：随节奏亮度变化
  - 🌊 频谱渐变：频率决定颜色
  - 🎶 重低音增强：低频段高亮显示
- **可调参数**：灵敏度 10-150%，平滑度 0-100%
- **高频发送**：30fps 实时发送频谱数据到键盘
- **频段分离**：低频/中频/高频独立处理显示

详细的 QMK 固件实现请查看 `qmk_music_rgb.md`。

### 🔧 RGB 灯效写入修复
- **双协议支持**：优先使用 WebHID，自动回退到 WebUSB
- **Feature Report 支持**：正确读取 HID 描述符，使用正确的 Report ID
- **QMK RAW HID 兼容**：支持 Usage Page 0xFF60, Usage 0x61 的标准 QMK 协议
- **动态数据包大小**：自动检测设备的最大数据包长度

### 🎯 宏录制按键弹起修复
- **完整按键事件**：同时记录 `keydown` 和 `keyup` 事件
- **QMK 键码转换**：自动将 JavaScript 键码转换为 QMK 键码
- **可视化状态显示**：绿色显示按下，橙色显示弹起
- **实时更新**：录制过程中实时显示按键序列
- **正确序列化**：每个宏步骤包含 [键码, 状态(1=按下,0=弹起), 延迟]

## ✨ 功能特性

### 🔌 WebHID + WebUSB 双协议
- 直接通过浏览器连接键盘，无需安装驱动
- 支持 Windows、Mac、Linux 跨平台
- 自动识别 QMK 固件键盘设备

### ⌨️ 键位映射配置
- 可视化键盘布局，直观展示当前键位
- 支持 4 层键位切换
- 点击按键即可修改键值
- 支持基础键、修饰键、功能键、媒体键、层切换、宏触发等各类键码

### 💡 RGB 灯效控制
- **12 种预设灯效**：
  - 静态单色
  - 呼吸灯效
  - 波浪效果
  - 涟漪扩散
  - 彩虹渐变
  - 渐变脉冲
  - 螺旋旋转
  - 激光追逐
  - KITT 扫描
  - 音乐律动
  - 打字点亮
  - 关闭灯光
- 亮度调节 (0-100%)
- 速度调节 (0-100%)
- 自定义颜色选择

### 🎯 宏编程功能
- 录制按键序列
- 支持 16 个宏存储
- 可设置按键间延迟
- 可视化编辑宏步骤
- 宏可分配给任意按键

### 💾 配置管理
- 读取当前键盘配置
- 写入配置到 EEPROM
- 配置立即生效，无需重启
- 重置为默认配置

## 🚀 使用方法

### 1. 启动本地服务器
```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve . -p 8000

# 或使用 PHP
php -S localhost:8000
```

### 2. 打开浏览器
访问 `http://localhost:8000`

### 3. 连接键盘
1. 点击 "连接键盘" 按钮
2. 在弹出的设备选择窗口中选择您的键盘
3. 等待连接成功

### 4. 配置键盘
- **键位映射**：点击键盘上的按键，然后选择新的键值
- **RGB 灯效**：选择灯效模式，调整亮度、速度和颜色
- **宏编程**：选择宏，点击录制，按顺序按键盘按键

### 5. 保存配置
点击 "写入配置" 按钮，配置将保存到键盘 EEPROM 并立即生效。

## 🔧 键盘固件要求

### QMK 固件设置
在 `rules.mk` 中启用：
```makefile
RAW_ENABLE = yes
```

在 `config.h` 中配置 WebUSB：
```c
#define RAW_USAGE_PAGE 0xFF60
#define RAW_USAGE_ID 0x61
```

### 处理 WebUSB 命令
在 `keymap.c` 中添加：
```c
#include "raw_hid.h"

void raw_hid_receive(uint8_t *data, uint8_t length) {
    uint8_t command = data[1];
    uint8_t response[64] = {0};
    
    switch(command) {
        case 0x01: { // 读取键位
            uint8_t layer = data[2];
            uint8_t row = data[3];
            uint8_t col = data[4];
            uint16_t keycode = keymap_key_to_keycode(layer, (keypos_t){.row = row, .col = col});
            response[0] = 0x00;
            response[1] = (keycode >> 8) & 0xFF;
            response[2] = keycode & 0xFF;
            break;
        }
        case 0x02: { // 写入键位
            // 实现键位写入逻辑
            response[0] = 0x00;
            break;
        }
        // 添加其他命令处理...
    }
    
    raw_hid_send(response, sizeof(response));
}
```

## 📁 文件结构

```
.
├── index.html          # 主页面
├── styles.css          # 样式文件
├── app.js              # 主应用逻辑
├── webusb.js           # WebUSB 通信模块
├── keyboard.js         # 键盘可视化组件
├── keycodes.js         # 键码定义
├── rgb.js              # RGB 灯效控制
├── macro.js            # 宏编程模块
└── README.md           # 说明文档
```

## 🌐 浏览器兼容性

| 浏览器 | 最低版本 | 支持状态 |
|--------|----------|----------|
| Chrome | 89+      | ✅ 完全支持 |
| Edge   | 89+      | ✅ 完全支持 |
| Opera  | 75+      | ✅ 完全支持 |
| Firefox | -       | ❌ 不支持 |
| Safari | -        | ❌ 不支持 |

## ⚠️ 注意事项

1. WebUSB 仅在安全上下文 (HTTPS 或 localhost) 中可用
2. 某些键盘可能需要进入引导加载程序模式
3. 写入配置前建议先备份现有配置
4. 如果连接失败，请尝试刷新页面重新连接

## 🔗 相关链接

- [QMK 固件文档](https://docs.qmk.fm/)
- [WebUSB API 规范](https://wicg.github.io/webusb/)
- [QMK WebUSB 示例](https://github.com/qmk/qmk_firmware/tree/master/quantum/raw_hid.c)

## 📄 许可证

MIT License