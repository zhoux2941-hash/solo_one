import type { Preset, LissajousParams } from '../types';

export const presets: Preset[] = [
  {
    id: 'circle',
    name: '圆形',
    icon: '⭕',
    params: {
      fx: 1,
      fy: 1,
      phase: 90,
      amplitude: 0.8,
    } as LissajousParams,
    description: '频率比1:1，相位差90°',
  },
  {
    id: 'ellipse',
    name: '椭圆',
    icon: '🔵',
    params: {
      fx: 1,
      fy: 1,
      phase: 45,
      amplitude: 0.8,
    } as LissajousParams,
    description: '频率比1:1，相位差45°',
  },
  {
    id: 'diagonal',
    name: '直线',
    icon: '➖',
    params: {
      fx: 1,
      fy: 1,
      phase: 0,
      amplitude: 0.8,
    } as LissajousParams,
    description: '频率比1:1，同相位',
  },
  {
    id: 'figure8',
    name: '八字形',
    icon: '8️⃣',
    params: {
      fx: 1,
      fy: 2,
      phase: 90,
      amplitude: 0.8,
    } as LissajousParams,
    description: '频率比1:2，相位差90°',
  },
  {
    id: 'infinity',
    name: '无限形',
    icon: '∞',
    params: {
      fx: 2,
      fy: 1,
      phase: 90,
      amplitude: 0.8,
    } as LissajousParams,
    description: '频率比2:1，相位差90°',
  },
  {
    id: '3petal',
    name: '三瓣花',
    icon: '🌸',
    params: {
      fx: 3,
      fy: 1,
      phase: 90,
      amplitude: 0.8,
    } as LissajousParams,
    description: '频率比3:1，相位差90°',
  },
  {
    id: 'classic32',
    name: '经典3:2',
    icon: '🔺',
    params: {
      fx: 3,
      fy: 2,
      phase: 90,
      amplitude: 0.8,
    } as LissajousParams,
    description: '频率比3:2，相位差90°',
  },
  {
    id: 'complex53',
    name: '复杂5:3',
    icon: '🌀',
    params: {
      fx: 5,
      fy: 3,
      phase: 45,
      amplitude: 0.8,
    } as LissajousParams,
    description: '频率比5:3，相位差45°',
  },
];
