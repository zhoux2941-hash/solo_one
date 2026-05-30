import { City } from '../types';

export const CITIES: City[] = [
  {
    id: 'chu-jinan',
    name: '楚纪南城',
    pinyin: 'Chu Jinan City',
    dynasty: '东周·楚国',
    era: '春秋时期',
    year: '公元前689年 - 公元前278年',
    area: 16,
    population: '约30万',
    description: '楚纪南城是春秋战国时期楚国的都城，位于今湖北省荆州市。城址平面呈不规则长方形，是当时南方最大的都城之一，其排水系统体现了楚国工匠对水利工程的深刻理解。',
    outline: [
      { x: 100, y: 80 },
      { x: 500, y: 80 },
      { x: 520, y: 200 },
      { x: 520, y: 420 },
      { x: 480, y: 450 },
      { x: 100, y: 450 },
      { x: 80, y: 300 },
      { x: 100, y: 80 },
    ],
    gates: [
      { name: '东门', x: 520, y: 260, side: 'east' },
      { name: '西门', x: 80, y: 260, side: 'west' },
      { name: '南门', x: 300, y: 450, side: 'south' },
      { name: '北门', x: 310, y: 80, side: 'north' },
    ],
  },
  {
    id: 'han-changan',
    name: '汉长安城',
    pinyin: "Han Chang'an City",
    dynasty: '西汉',
    era: '西汉时期',
    year: '公元前202年 - 公元8年',
    area: 36,
    population: '约50万',
    description: '汉长安城是西汉王朝的都城，位于今陕西省西安市西北。城址平面呈不规则方形，因渭河和地势而建，其排水系统设计周密，规模宏大，体现了大一统王朝的气魄。',
    outline: [
      { x: 120, y: 60 },
      { x: 520, y: 60 },
      { x: 540, y: 180 },
      { x: 520, y: 420 },
      { x: 480, y: 460 },
      { x: 140, y: 460 },
      { x: 100, y: 350 },
      { x: 120, y: 60 },
    ],
    gates: [
      { name: '宣平门', x: 540, y: 220, side: 'east' },
      { name: '章城门', x: 100, y: 230, side: 'west' },
      { name: '西安门', x: 320, y: 460, side: 'south' },
      { name: '洛城门', x: 310, y: 60, side: 'north' },
    ],
  },
  {
    id: 'tang-luoyang',
    name: '唐洛阳城',
    pinyin: 'Tang Luoyang City',
    dynasty: '唐代',
    era: '隋唐时期',
    year: '公元605年 - 公元907年',
    area: 47,
    population: '约100万',
    description: '唐洛阳城是隋唐时期的东都，位于今河南省洛阳市。城址平面略呈方形，布局严谨，规划整齐，其排水系统融合了前代智慧并有所创新，代表了中国古代城市建设的最高水平。',
    outline: [
      { x: 80, y: 80 },
      { x: 520, y: 80 },
      { x: 520, y: 440 },
      { x: 80, y: 440 },
      { x: 80, y: 80 },
    ],
    gates: [
      { name: '建春门', x: 520, y: 260, side: 'east' },
      { name: '丽景门', x: 80, y: 260, side: 'west' },
      { name: '定鼎门', x: 300, y: 440, side: 'south' },
      { name: '徽安门', x: 300, y: 80, side: 'north' },
    ],
  },
];

export const getCityById = (id: string): City | undefined => {
  return CITIES.find(city => city.id === id);
};
