import type { RadicalData } from '@/types';

const radicalColors = [
  'rgba(6, 182, 212, 0.4)',
  'rgba(59, 130, 246, 0.4)',
  'rgba(139, 92, 246, 0.4)',
  'rgba(236, 72, 153, 0.4)',
  'rgba(34, 197, 94, 0.4)',
  'rgba(249, 115, 22, 0.4)',
];

const strokeColors = [
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#22c55e',
  '#f97316',
];

export const getRadicalColor = (index: number): string => {
  return radicalColors[index % radicalColors.length];
};

export const getStrokeColor = (index: number): string => {
  return strokeColors[index % strokeColors.length];
};

export const radicalData: Record<string, RadicalData> = {
  '好': {
    strokes: [
      { path: 'M20,30 Q30,20 40,30 L40,70 Q30,80 20,70 Z', radical: '女', order: 1 },
      { path: 'M55,25 L55,45 L75,45 L55,45 L55,60 Q55,75 65,75 Q80,75 80,60 L80,45 L60,45 L80,45 L80,25 Z', radical: '子', order: 2 },
    ],
    viewBox: '0 0 100 100',
  },
  '你': {
    strokes: [
      { path: 'M15,20 L15,80 M15,35 L30,20', radical: '亻', order: 1 },
      { path: 'M35,25 Q50,15 65,25 Q75,35 70,50 Q65,65 50,65 Q35,65 35,50 Q35,40 45,35', radical: 'ク', order: 2 },
      { path: 'M40,70 L60,70 L50,85 Z M45,70 L45,60 M55,70 L55,60', radical: '小', order: 3 },
    ],
    viewBox: '0 0 100 100',
  },
  '我': {
    strokes: [
      { path: 'M10,25 Q15,15 25,20', radical: '丿', order: 1 },
      { path: 'M20,30 L20,70 M20,40 L50,40 M35,30 L35,70', radical: '扌', order: 2 },
      { path: 'M45,15 L85,15 L55,50 L85,85 L70,85 L45,55 L45,85 L35,85 L35,15 Z', radical: '戈', order: 3 },
    ],
    viewBox: '0 0 100 100',
  },
  '是': {
    strokes: [
      { path: 'M25,15 Q50,5 75,15 Q85,25 75,35 Q50,45 25,35 Q15,25 25,15 Z', radical: '日', order: 1 },
      { path: 'M30,40 L70,40', radical: '一', order: 2 },
      { path: 'M25,45 L75,45 L65,60 L55,50 L55,85 M45,55 L45,85 M35,65 L65,65', radical: '疋', order: 3 },
    ],
    viewBox: '0 0 100 100',
  },
  '的': {
    strokes: [
      { path: 'M20,15 Q45,5 70,15 Q80,25 70,35 Q45,45 20,35 Q10,25 20,15 Z M30,25 L60,25 M45,15 L45,35', radical: '白', order: 1 },
      { path: 'M35,45 Q50,40 65,45 Q75,55 70,70 Q60,80 45,75 Q35,70 35,60', radical: '勺', order: 2 },
    ],
    viewBox: '0 0 100 100',
  },
  '有': {
    strokes: [
      { path: 'M15,20 L50,20 L30,50 Z M25,35 L55,35 L40,55 Z', radical: '大', order: 1 },
      { path: 'M35,55 Q60,45 80,55 Q90,70 75,85 Q60,90 45,85 Q35,80 35,70', radical: '月', order: 2 },
    ],
    viewBox: '0 0 100 100',
  },
  '国': {
    strokes: [
      { path: 'M15,10 L15,90 L85,90 L85,10 Z M15,10 L85,10 M15,90 L85,90 M15,10 L15,90 M85,10 L85,90', radical: '囗', order: 1 },
      { path: 'M30,25 L70,25 L50,50 L70,75 L30,75 L50,50 L30,25 Z M50,25 L50,75 M30,50 L70,50 M40,35 L60,65 M60,35 L40,65', radical: '玉', order: 2 },
    ],
    viewBox: '0 0 100 100',
  },
  '人': {
    strokes: [
      { path: 'M50,15 L20,85', radical: '人', order: 1 },
      { path: 'M50,15 L80,85', radical: '人', order: 2 },
    ],
    viewBox: '0 0 100 100',
  },
  '大': {
    strokes: [
      { path: 'M50,10 L50,90', radical: '大', order: 1 },
      { path: 'M15,35 L85,35', radical: '大', order: 2 },
      { path: 'M50,35 L15,85 M50,35 L85,85', radical: '大', order: 3 },
    ],
    viewBox: '0 0 100 100',
  },
  '中': {
    strokes: [
      { path: 'M20,20 L20,80 L80,80 L80,20 Z', radical: '口', order: 1 },
      { path: 'M50,5 L50,95', radical: '丨', order: 2 },
    ],
    viewBox: '0 0 100 100',
  },
  '天': {
    strokes: [
      { path: 'M15,25 L85,25', radical: '一', order: 1 },
      { path: 'M50,10 L50,90 M15,45 L85,45 M50,45 L15,90 M50,45 L85,90', radical: '大', order: 2 },
    ],
    viewBox: '0 0 100 100',
  },
  '地': {
    strokes: [
      { path: 'M15,25 L45,25 L45,55 L15,55 Z M15,25 L45,55 M45,25 L15,55', radical: '土', order: 1 },
      { path: 'M55,20 L55,80 M55,35 L75,20 M55,50 L85,35', radical: '也', order: 2 },
    ],
    viewBox: '0 0 100 100',
  },
  '学': {
    strokes: [
      { path: 'M25,15 L35,25 M50,10 L50,30 M65,15 L75,25', radical: '丶', order: 1 },
      { path: 'M20,35 Q50,25 80,35 Q85,45 75,50 Q50,55 25,50 Q15,45 20,35 Z', radical: '冖', order: 2 },
      { path: 'M30,55 L70,55 L60,70 L40,70 L30,55 Z M40,70 L40,90 L60,90 L60,70', radical: '子', order: 3 },
    ],
    viewBox: '0 0 100 100',
  },
  '生': {
    strokes: [
      { path: 'M25,15 L35,25', radical: '丿', order: 1 },
      { path: 'M20,30 L80,30 M35,20 L35,70 M65,20 L65,70 M20,50 L80,50 M20,70 L80,70', radical: '土', order: 2 },
    ],
    viewBox: '0 0 100 100',
  },
  '日': {
    strokes: [
      { path: 'M20,15 Q50,5 80,15 Q85,25 80,35 Q50,45 20,35 Q15,25 20,15 Z M30,25 L70,25 M45,15 L45,35', radical: '日', order: 1 },
    ],
    viewBox: '0 0 100 100',
  },
  '月': {
    strokes: [
      { path: 'M25,15 Q60,5 75,15 Q85,30 80,50 Q75,70 60,85 Q45,80 35,65 Q25,50 25,30 Z M35,35 L65,35 M35,55 L65,55', radical: '月', order: 1 },
    ],
    viewBox: '0 0 100 100',
  },
  '水': {
    strokes: [
      { path: 'M50,5 L50,95', radical: '水', order: 1 },
      { path: 'M30,25 L15,50 L30,75', radical: '水', order: 2 },
      { path: 'M70,25 L85,50 L70,75', radical: '水', order: 3 },
      { path: 'M35,50 L20,85', radical: '水', order: 4 },
      { path: 'M65,50 L80,85', radical: '水', order: 5 },
    ],
    viewBox: '0 0 100 100',
  },
  '火': {
    strokes: [
      { path: 'M25,35 L35,50', radical: '火', order: 1 },
      { path: 'M75,35 L65,50', radical: '火', order: 2 },
      { path: 'M50,15 L50,60', radical: '火', order: 3 },
      { path: 'M15,85 L50,50 L85,85', radical: '火', order: 4 },
    ],
    viewBox: '0 0 100 100',
  },
  '山': {
    strokes: [
      { path: 'M50,10 L50,90', radical: '山', order: 1 },
      { path: 'M15,40 L15,90', radical: '山', order: 2 },
      { path: 'M85,40 L85,90', radical: '山', order: 3 },
      { path: 'M15,90 L85,90', radical: '山', order: 4 },
    ],
    viewBox: '0 0 100 100',
  },
  '木': {
    strokes: [
      { path: 'M50,10 L50,90', radical: '木', order: 1 },
      { path: 'M15,45 L85,45', radical: '木', order: 2 },
      { path: 'M50,45 L15,90', radical: '木', order: 3 },
      { path: 'M50,45 L85,90', radical: '木', order: 4 },
    ],
    viewBox: '0 0 100 100',
  },
  '土': {
    strokes: [
      { path: 'M20,25 L80,25', radical: '土', order: 1 },
      { path: 'M50,10 L50,90', radical: '土', order: 2 },
      { path: 'M15,70 L85,70', radical: '土', order: 3 },
    ],
    viewBox: '0 0 100 100',
  },
  '王': {
    strokes: [
      { path: 'M15,20 L85,20', radical: '王', order: 1 },
      { path: 'M50,10 L50,90', radical: '王', order: 2 },
      { path: 'M15,50 L85,50', radical: '王', order: 3 },
      { path: 'M15,80 L85,80', radical: '王', order: 4 },
    ],
    viewBox: '0 0 100 100',
  },
};

export const getRadicalData = (char: string): RadicalData | null => {
  return radicalData[char] || null;
};

export const hasRadicalData = (char: string): boolean => {
  return char in radicalData;
};
