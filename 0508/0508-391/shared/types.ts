export interface Star {
  id: number;
  name: string;
  traditionalName: string | null;
  magnitude: number;
  ra: number;
  dec: number;
  constellationId: number | null;
  xingguan: string | null;
}

export interface Constellation {
  id: number;
  name: string;
  type: 'san-yuan' | 'er-shi-ba-xiu' | 'other';
  mansion: string | null;
  description: string;
  starIds: number[];
}

export interface Connection {
  id: number;
  constellationId: number;
  fromStarId: number;
  toStarId: number;
  order: number;
}

export type ProjectionType = 'stereographic' | 'equidistant' | 'mercator';

export interface ProjectionParams {
  type: ProjectionType;
  centerRa: number;
  centerDec: number;
  scale: number;
  rotation: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  visible: boolean;
  alpha?: number;
}

export interface DrawingStep {
  type: 'circle' | 'line' | 'point' | 'text';
  progress: number;
  data: {
    cx?: number;
    cy?: number;
    r?: number;
    startAngle?: number;
    endAngle?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    px?: number;
    py?: number;
    text?: string;
    fontSize?: number;
    color?: string;
  };
}

export const CONSTELLATION_COLORS = {
  'san-yuan': '#c41e3a',
  'er-shi-ba-xiu': '#2e5eaa',
  'other': '#8b7355',
} as const;

export const PROJECTION_INFO: Record<ProjectionType, { name: string; description: string }> = {
  stereographic: {
    name: '球极投影',
    description: '保持角度不变的方位投影，适合绘制极区星图，常用于传统中国星图',
  },
  equidistant: {
    name: '等距投影',
    description: '保持中心到各点距离比例的方位投影，简单直观，易于测量',
  },
  mercator: {
    name: '墨卡托投影',
    description: '等角圆柱投影，经线纬线平行，适合绘制赤道附近星图',
  },
};

export const MANSIONS = [
  { name: '角宿', mansion: '东方苍龙' },
  { name: '亢宿', mansion: '东方苍龙' },
  { name: '氐宿', mansion: '东方苍龙' },
  { name: '房宿', mansion: '东方苍龙' },
  { name: '心宿', mansion: '东方苍龙' },
  { name: '尾宿', mansion: '东方苍龙' },
  { name: '箕宿', mansion: '东方苍龙' },
  { name: '斗宿', mansion: '北方玄武' },
  { name: '牛宿', mansion: '北方玄武' },
  { name: '女宿', mansion: '北方玄武' },
  { name: '虚宿', mansion: '北方玄武' },
  { name: '危宿', mansion: '北方玄武' },
  { name: '室宿', mansion: '北方玄武' },
  { name: '壁宿', mansion: '北方玄武' },
  { name: '奎宿', mansion: '西方白虎' },
  { name: '娄宿', mansion: '西方白虎' },
  { name: '胃宿', mansion: '西方白虎' },
  { name: '昴宿', mansion: '西方白虎' },
  { name: '毕宿', mansion: '西方白虎' },
  { name: '觜宿', mansion: '西方白虎' },
  { name: '参宿', mansion: '西方白虎' },
  { name: '井宿', mansion: '南方朱雀' },
  { name: '鬼宿', mansion: '南方朱雀' },
  { name: '柳宿', mansion: '南方朱雀' },
  { name: '星宿', mansion: '南方朱雀' },
  { name: '张宿', mansion: '南方朱雀' },
  { name: '翼宿', mansion: '南方朱雀' },
  { name: '轸宿', mansion: '南方朱雀' },
];
