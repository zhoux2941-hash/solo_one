# QMK 音乐联动 RGB 灯效实现指南

本指南说明如何在 QMK 固件中实现音乐联动 RGB 灯效，配合 WebUSB 配置工具使用。

## 1. 启用 RAW HID

在 `rules.mk` 中添加:
```makefile
RAW_ENABLE = yes
RGB_MATRIX_ENABLE = yes
```

## 2. 配置 HID

在 `config.h` 中添加:
```c
#define RAW_USAGE_PAGE 0xFF60
#define RAW_USAGE_ID 0x61

// 可选：增加RGB矩阵LED数量
#define RGB_MATRIX_LED_COUNT 87
```

## 3. 实现音乐效果代码

创建 `features/music_rgb.h`:
```c
#pragma once
#include <stdint.h>

void music_rgb_init(void);
void music_rgb_task(void);
void music_rgb_update(uint8_t bass, uint8_t mid, uint8_t high, 
                      uint8_t color_mode, uint8_t brightness);
```

创建 `features/music_rgb.c`:
```c
#include "music_rgb.h"
#include "rgb_matrix.h"
#include "color.h"

typedef struct {
    uint8_t bass;
    uint8_t mid;
    uint8_t high;
    uint8_t color_mode;
    uint8_t brightness;
    uint32_t last_update;
} music_state_t;

static music_state_t music_state = {0};
static uint8_t led_intensity[RGB_MATRIX_LED_COUNT] = {0};

void music_rgb_init(void) {
    music_state.bass = 0;
    music_state.mid = 0;
    music_state.high = 0;
    music_state.color_mode = 0;
    music_state.brightness = 255;
    music_state.last_update = 0;
}

static HSV hsv_from_spectrum(uint8_t band, uint8_t intensity) {
    uint8_t hue;
    switch (music_state.color_mode) {
        case 0: // 彩虹
            hue = band * 32;
            break;
        case 1: // 脉冲单色
            hue = rgb_matrix_get_hue();
            break;
        case 2: // 渐变
            hue = 180 + (intensity / 3);
            break;
        case 3: // 重低音
            if (band < 3) hue = 280;
            else if (band < 6) hue = 200;
            else hue = 60;
            break;
        default:
            hue = 0;
    }
    return (HSV){hue, 255, (intensity * music_state.brightness) / 255};
}

static uint8_t get_led_band(uint8_t led_index) {
    // 根据键盘布局将LED分配到不同频段
    // 这里是示例，需要根据实际键盘布局调整
    const uint8_t col_count = 12;
    uint8_t col = led_index % col_count;
    return (col * 8) / col_count;
}

void music_rgb_task(void) {
    uint32_t now = timer_read32();
    
    // 平滑衰减效果
    for (int i = 0; i < RGB_MATRIX_LED_COUNT; i++) {
        if (led_intensity[i] > 0) {
            led_intensity[i] = (led_intensity[i] * 95) / 100;
        }
    }
    
    // 根据音频数据更新LED亮度
    for (int i = 0; i < RGB_MATRIX_LED_COUNT; i++) {
        uint8_t band = get_led_band(i);
        uint8_t intensity;
        
        if (band < 2) {
            intensity = music_state.bass;
        } else if (band < 5) {
            intensity = music_state.mid;
        } else {
            intensity = music_state.high;
        }
        
        if (intensity > led_intensity[i]) {
            led_intensity[i] = intensity;
        }
    }
    
    // 设置LED颜色
    for (int i = 0; i < RGB_MATRIX_LED_COUNT; i++) {
        if (led_intensity[i] > 5) {
            HSV hsv = hsv_from_spectrum(get_led_band(i), led_intensity[i]);
            RGB rgb = hsv_to_rgb(hsv);
            rgb_matrix_set_color(i, rgb.r, rgb.g, rgb.b);
        } else {
            rgb_matrix_set_color(i, 0, 0, 0);
        }
    }
}

void music_rgb_update(uint8_t bass, uint8_t mid, uint8_t high, 
                      uint8_t color_mode, uint8_t brightness) {
    music_state.bass = bass;
    music_state.mid = mid;
    music_state.high = high;
    music_state.color_mode = color_mode;
    music_state.brightness = brightness;
}
```

## 4. 实现 RAW HID 命令处理

在 `keymap.c` 中添加:

```c
#include "raw_hid.h"
#include "features/music_rgb.h"

enum custom_commands {
    CMD_READ_KEYMAP = 0x01,
    CMD_WRITE_KEYMAP = 0x02,
    CMD_READ_RGB = 0x03,
    CMD_WRITE_RGB = 0x04,
    CMD_READ_MACRO = 0x05,
    CMD_WRITE_MACRO = 0x06,
    CMD_SAVE_EEPROM = 0x07,
    CMD_RESET_EEPROM = 0x08,
    CMD_GET_MATRIX = 0x09,
    CMD_APPLY_CONFIG = 0x0A,
    CMD_MUSIC_DATA = 0x0B,  // 音乐频谱数据
};

static bool music_mode_active = false;

void raw_hid_receive(uint8_t *data, uint8_t length) {
    uint8_t command = data[0];
    uint8_t response[32] = {0};
    
    switch(command) {
        case CMD_MUSIC_DATA: {
            uint8_t bass = data[1];
            uint8_t mid = data[2];
            uint8_t high = data[3];
            uint8_t color_mode = data[4];
            uint8_t brightness = data[5];
            
            music_rgb_update(bass, mid, high, color_mode, brightness);
            music_mode_active = true;
            
            response[0] = 0x00;  // 成功
            break;
        }
        
        case CMD_WRITE_RGB: {
            // 如果退出音乐模式，停止音乐效果
            if (data[1] != 9) {  // 9 = 音乐律动
                music_mode_active = false;
            }
            // 原有的RGB设置代码...
            break;
        }
        
        // 其他命令处理...
    }
    
    raw_hid_send(response, sizeof(response));
}
```

## 5. 集成到 RGB 矩阵效果

在 `rgb_matrix_kb.inc` 或相应文件中添加自定义效果:

```c
bool music_rgb_effect(effect_params_t* params) {
    if (!music_mode_active) {
        return false;
    }
    
    music_rgb_task();
    return false;
}

void keyboard_post_init_kb(void) {
    music_rgb_init();
    keyboard_post_init_user();
}
```

## 6. 自定义效果模式

在 `rgb_matrix_user.inc` 中添加:

```c
RGB_MATRIX_EFFECT(MUSIC_SPECTRUM)

#ifdef RGB_MATRIX_CUSTOM_EFFECT_IMPLS

static bool MUSIC_SPECTRUM(effect_params_t* params) {
    music_rgb_task();
    return false;
}

#endif // RGB_MATRIX_CUSTOM_EFFECT_IMPLS
```

## 7. 使用方法

1. 编译并刷写固件到键盘
2. 打开网页配置工具
3. 连接键盘
4. 选择 "音乐律动" 灯效
5. 点击 "开始采集音频"
6. 播放音乐，享受随音乐律动的键盘灯效！

## 8. 性能优化建议

- 减少LED数量可以降低CPU使用率
- 降低发送频率（默认为30fps）
- 使用定时器代替每帧计算
- 预计算LED频段映射
- 实现渐入渐出的平滑效果

## 9. 故障排除

**问题:** 灯效无响应
- 检查 RAW HID 是否正确启用
- 确认命令 ID 匹配 (0x0B)
- 检查 USB 连接是否正常

**问题:** 灯效卡顿
- 降低发送频率
- 减少计算复杂度
- 检查键盘CPU使用率

**问题:** 颜色不正确
- 检查 HSV 到 RGB 转换是否正确
- 调整颜色模式参数
- 确认LED映射正确
