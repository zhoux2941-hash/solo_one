import { FoodOption } from '../types/game';

export const FOOD_OPTIONS: FoodOption[] = [
  {
    id: 'berry',
    name: '野果',
    icon: '🫐',
    description: '丛林中常见的野果，容易获取，风险较低',
    satiety: { min: 8, max: 15 },
    healthRisk: { probability: 0.1, damage: { min: 5, max: 15 }, type: 'poison' },
    timeCost: 1
  },
  {
    id: 'mushroom',
    name: '蘑菇',
    icon: '🍄',
    description: '湿润处生长的菌类，营养价值高但需仔细辨识',
    satiety: { min: 15, max: 25 },
    healthRisk: { probability: 0.3, damage: { min: 10, max: 30 }, type: 'poison' },
    timeCost: 2
  },
  {
    id: 'bark',
    name: '树皮',
    icon: '🪵',
    description: '树木的内层树皮，营养有限但几乎没有风险',
    satiety: { min: 3, max: 8 },
    healthRisk: { probability: 0.05, damage: { min: 3, max: 8 }, type: 'injury' },
    timeCost: 1
  },
  {
    id: 'fish',
    name: '捕鱼',
    icon: '🐟',
    description: '溪流中捕鱼，营养丰富但需要消耗时间',
    satiety: { min: 25, max: 40 },
    healthRisk: { probability: 0.15, damage: { min: 5, max: 15 }, type: 'injury' },
    timeCost: 4
  },
  {
    id: 'hunt',
    name: '捕猎',
    icon: '🏹',
    description: '设陷阱捕猎小型动物，高风险高回报',
    satiety: { min: 35, max: 55 },
    healthRisk: { probability: 0.35, damage: { min: 15, max: 35 }, type: 'injury' },
    timeCost: 5
  }
];

export const getFoodById = (id: string): FoodOption | undefined => {
  return FOOD_OPTIONS.find(food => food.id === id);
};
