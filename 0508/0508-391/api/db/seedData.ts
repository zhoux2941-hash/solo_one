import type { Star, Connection } from '../../shared/types';

export const seedStars: Omit<Star, 'id'>[] = [
  { name: '天枢', traditionalName: '北斗一', magnitude: 1.79, ra: 11.06, dec: 61.75, constellationId: 4, xingguan: '北斗' },
  { name: '天璇', traditionalName: '北斗二', magnitude: 2.37, ra: 11.03, dec: 56.38, constellationId: 4, xingguan: '北斗' },
  { name: '天玑', traditionalName: '北斗三', magnitude: 2.44, ra: 11.90, dec: 53.69, constellationId: 4, xingguan: '北斗' },
  { name: '天权', traditionalName: '北斗四', magnitude: 3.31, ra: 12.26, dec: 57.03, constellationId: 4, xingguan: '北斗' },
  { name: '玉衡', traditionalName: '北斗五', magnitude: 2.41, ra: 12.90, dec: 55.96, constellationId: 4, xingguan: '北斗' },
  { name: '开阳', traditionalName: '北斗六', magnitude: 2.23, ra: 13.40, dec: 54.92, constellationId: 4, xingguan: '北斗' },
  { name: '摇光', traditionalName: '北斗七', magnitude: 1.86, ra: 13.79, dec: 49.31, constellationId: 4, xingguan: '北斗' },
  
  { name: '北极星', traditionalName: '勾陈一', magnitude: 1.98, ra: 2.53, dec: 89.26, constellationId: 1, xingguan: '勾陈' },
  { name: '帝星', traditionalName: '小熊座β', magnitude: 4.20, ra: 14.86, dec: 74.16, constellationId: 1, xingguan: '紫微' },
  { name: '太子', traditionalName: '小熊座γ', magnitude: 4.30, ra: 15.47, dec: 71.83, constellationId: 1, xingguan: '紫微' },
  
  { name: '角宿一', traditionalName: '室女座α', magnitude: 0.98, ra: 13.42, dec: -11.16, constellationId: 5, xingguan: '角宿' },
  { name: '角宿二', traditionalName: '室女座ζ', magnitude: 3.37, ra: 13.38, dec: -0.59, constellationId: 5, xingguan: '角宿' },
  
  { name: '亢宿一', traditionalName: '室女座κ', magnitude: 4.18, ra: 14.13, dec: -10.41, constellationId: 6, xingguan: '亢宿' },
  { name: '亢宿二', traditionalName: '室女座ι', magnitude: 4.08, ra: 14.28, dec: -5.68, constellationId: 6, xingguan: '亢宿' },
  
  { name: '氐宿一', traditionalName: '天秤座α', magnitude: 2.75, ra: 14.81, dec: -16.04, constellationId: 7, xingguan: '氐宿' },
  { name: '氐宿三', traditionalName: '天秤座γ', magnitude: 3.91, ra: 15.13, dec: -14.78, constellationId: 7, xingguan: '氐宿' },
  
  { name: '房宿一', traditionalName: '天蝎座π', magnitude: 3.58, ra: 16.32, dec: -19.65, constellationId: 8, xingguan: '房宿' },
  { name: '房宿三', traditionalName: '天蝎座δ', magnitude: 2.29, ra: 16.72, dec: -22.65, constellationId: 8, xingguan: '房宿' },
  { name: '房宿四', traditionalName: '天蝎座β', magnitude: 2.56, ra: 16.49, dec: -19.51, constellationId: 8, xingguan: '房宿' },
  
  { name: '心宿一', traditionalName: '天蝎座σ', magnitude: 3.05, ra: 16.96, dec: -25.59, constellationId: 9, xingguan: '心宿' },
  { name: '心宿二', traditionalName: '天蝎座α', magnitude: 0.96, ra: 16.49, dec: -26.43, constellationId: 9, xingguan: '心宿' },
  { name: '心宿三', traditionalName: '天蝎座τ', magnitude: 3.06, ra: 17.06, dec: -27.91, constellationId: 9, xingguan: '心宿' },
  
  { name: '尾宿一', traditionalName: '天蝎座μ1', magnitude: 3.08, ra: 17.11, dec: -33.13, constellationId: 10, xingguan: '尾宿' },
  { name: '尾宿二', traditionalName: '天蝎座ε', magnitude: 2.29, ra: 17.38, dec: -34.30, constellationId: 10, xingguan: '尾宿' },
  { name: '尾宿八', traditionalName: '天蝎座λ', magnitude: 1.63, ra: 17.56, dec: -37.29, constellationId: 10, xingguan: '尾宿' },
  { name: '尾宿九', traditionalName: '天蝎座υ', magnitude: 2.70, ra: 17.74, dec: -37.53, constellationId: 10, xingguan: '尾宿' },
  
  { name: '箕宿一', traditionalName: '人马座γ', magnitude: 2.99, ra: 18.06, dec: -30.42, constellationId: 11, xingguan: '箕宿' },
  { name: '箕宿三', traditionalName: '人马座ε', magnitude: 1.85, ra: 18.58, dec: -34.37, constellationId: 11, xingguan: '箕宿' },
  
  { name: '南斗六', traditionalName: '人马座ζ', magnitude: 3.26, ra: 19.23, dec: -29.93, constellationId: 12, xingguan: '斗宿' },
  { name: '南斗五', traditionalName: '人马座μ', magnitude: 3.86, ra: 19.03, dec: -21.05, constellationId: 12, xingguan: '斗宿' },
  { name: '南斗四', traditionalName: '人马座τ', magnitude: 3.32, ra: 19.07, dec: -27.54, constellationId: 12, xingguan: '斗宿' },
  { name: '南斗三', traditionalName: '人马座φ', magnitude: 3.17, ra: 18.94, dec: -26.90, constellationId: 12, xingguan: '斗宿' },
  { name: '南斗二', traditionalName: '人马座λ', magnitude: 2.81, ra: 18.45, dec: -25.43, constellationId: 12, xingguan: '斗宿' },
  { name: '南斗一', traditionalName: '人马座σ', magnitude: 2.02, ra: 18.55, dec: -26.30, constellationId: 12, xingguan: '斗宿' },
  
  { name: '牵牛一', traditionalName: '摩羯座β', magnitude: 3.05, ra: 20.32, dec: -14.79, constellationId: 13, xingguan: '牛宿' },
  { name: '牵牛六', traditionalName: '摩羯座α', magnitude: 3.58, ra: 20.47, dec: -12.36, constellationId: 13, xingguan: '牛宿' },
  
  { name: '须女一', traditionalName: '宝瓶座ε', magnitude: 3.77, ra: 20.78, dec: -9.39, constellationId: 14, xingguan: '女宿' },
  { name: '须女二', traditionalName: '宝瓶座μ', magnitude: 4.62, ra: 21.02, dec: -8.59, constellationId: 14, xingguan: '女宿' },
  
  { name: '虚宿一', traditionalName: '宝瓶座β', magnitude: 2.90, ra: 21.48, dec: -5.95, constellationId: 15, xingguan: '虚宿' },
  { name: '虚宿二', traditionalName: '小马座α', magnitude: 3.92, ra: 21.27, dec: 4.98, constellationId: 15, xingguan: '虚宿' },
  
  { name: '危宿一', traditionalName: '宝瓶座α', magnitude: 2.94, ra: 22.06, dec: -0.02, constellationId: 16, xingguan: '危宿' },
  { name: '危宿二', traditionalName: '飞马座θ', magnitude: 3.23, ra: 22.10, dec: 6.12, constellationId: 16, xingguan: '危宿' },
  { name: '危宿三', traditionalName: '飞马座ε', magnitude: 2.39, ra: 21.73, dec: 9.87, constellationId: 16, xingguan: '危宿' },
  
  { name: '室宿一', traditionalName: '飞马座α', magnitude: 2.49, ra: 23.14, dec: 15.18, constellationId: 17, xingguan: '室宿' },
  { name: '室宿二', traditionalName: '飞马座γ', magnitude: 2.83, ra: 0.27, dec: 15.65, constellationId: 17, xingguan: '室宿' },
  
  { name: '壁宿一', traditionalName: '飞马座β', magnitude: 2.44, ra: 23.63, dec: 28.08, constellationId: 18, xingguan: '壁宿' },
  { name: '壁宿二', traditionalName: '仙女座α', magnitude: 1.79, ra: 0.14, dec: 29.09, constellationId: 18, xingguan: '壁宿' },
  
  { name: '奎宿一', traditionalName: '仙女座η', magnitude: 4.43, ra: 0.50, dec: 35.62, constellationId: 19, xingguan: '奎宿' },
  { name: '奎宿二', traditionalName: '仙女座ζ', magnitude: 4.08, ra: 0.43, dec: 37.57, constellationId: 19, xingguan: '奎宿' },
  { name: '奎宿九', traditionalName: '仙女座β', magnitude: 2.06, ra: 1.09, dec: 35.37, constellationId: 19, xingguan: '奎宿' },
  
  { name: '娄宿一', traditionalName: '白羊座β', magnitude: 2.64, ra: 1.84, dec: 20.52, constellationId: 20, xingguan: '娄宿' },
  { name: '娄宿二', traditionalName: '白羊座γ1', magnitude: 4.75, ra: 2.03, dec: 19.28, constellationId: 20, xingguan: '娄宿' },
  { name: '娄宿三', traditionalName: '白羊座α', magnitude: 2.01, ra: 2.13, dec: 23.43, constellationId: 20, xingguan: '娄宿' },
  
  { name: '胃宿一', traditionalName: '白羊座35', magnitude: 5.22, ra: 2.59, dec: 28.20, constellationId: 21, xingguan: '胃宿' },
  { name: '胃宿二', traditionalName: '白羊座39', magnitude: 5.60, ra: 2.72, dec: 29.49, constellationId: 21, xingguan: '胃宿' },
  { name: '胃宿三', traditionalName: '白羊座41', magnitude: 5.17, ra: 2.77, dec: 30.63, constellationId: 21, xingguan: '胃宿' },
  
  { name: '昴宿一', traditionalName: '金牛座17', magnitude: 5.09, ra: 3.65, dec: 24.07, constellationId: 22, xingguan: '昴宿' },
  { name: '昴宿六', traditionalName: '金牛座η', magnitude: 2.87, ra: 3.87, dec: 24.07, constellationId: 22, xingguan: '昴宿' },
  { name: '昴宿七', traditionalName: '金牛座27', magnitude: 4.58, ra: 3.94, dec: 23.99, constellationId: 22, xingguan: '昴宿' },
  
  { name: '毕宿一', traditionalName: '金牛座ε', magnitude: 3.53, ra: 4.56, dec: 19.17, constellationId: 23, xingguan: '毕宿' },
  { name: '毕宿四', traditionalName: '金牛座γ', magnitude: 3.65, ra: 4.42, dec: 15.93, constellationId: 23, xingguan: '毕宿' },
  { name: '毕宿五', traditionalName: '金牛座α', magnitude: 0.85, ra: 4.59, dec: 16.51, constellationId: 23, xingguan: '毕宿' },
  
  { name: '觜宿一', traditionalName: '猎户座λ', magnitude: 3.54, ra: 5.68, dec: 9.93, constellationId: 24, xingguan: '觜宿' },
  { name: '觜宿二', traditionalName: '猎户座φ1', magnitude: 4.75, ra: 5.59, dec: 9.19, constellationId: 24, xingguan: '觜宿' },
  
  { name: '参宿一', traditionalName: '猎户座ζ', magnitude: 1.70, ra: 5.60, dec: -1.94, constellationId: 25, xingguan: '参宿' },
  { name: '参宿二', traditionalName: '猎户座ε', magnitude: 1.70, ra: 5.68, dec: -1.20, constellationId: 25, xingguan: '参宿' },
  { name: '参宿三', traditionalName: '猎户座δ', magnitude: 2.23, ra: 5.56, dec: -0.30, constellationId: 25, xingguan: '参宿' },
  { name: '参宿四', traditionalName: '猎户座α', magnitude: 0.42, ra: 5.92, dec: 7.41, constellationId: 25, xingguan: '参宿' },
  { name: '参宿七', traditionalName: '猎户座β', magnitude: 0.18, ra: 5.24, dec: -8.20, constellationId: 25, xingguan: '参宿' },
  
  { name: '井宿一', traditionalName: '双子座μ', magnitude: 2.87, ra: 6.46, dec: 22.51, constellationId: 26, xingguan: '井宿' },
  { name: '井宿三', traditionalName: '双子座γ', magnitude: 1.93, ra: 6.38, dec: 16.40, constellationId: 26, xingguan: '井宿' },
  { name: '井宿五', traditionalName: '双子座ε', magnitude: 2.98, ra: 6.72, dec: 25.13, constellationId: 26, xingguan: '井宿' },
  { name: '井宿七', traditionalName: '双子座ζ', magnitude: 3.79, ra: 7.03, dec: 20.57, constellationId: 26, xingguan: '井宿' },
  { name: '北河三', traditionalName: '双子座β', magnitude: 1.14, ra: 7.64, dec: 28.03, constellationId: 26, xingguan: '井宿' },
  { name: '北河二', traditionalName: '双子座α', magnitude: 1.58, ra: 7.67, dec: 31.86, constellationId: 26, xingguan: '井宿' },
  
  { name: '鬼宿一', traditionalName: '巨蟹座θ', magnitude: 5.63, ra: 8.39, dec: 18.33, constellationId: 27, xingguan: '鬼宿' },
  { name: '鬼宿二', traditionalName: '巨蟹座η', magnitude: 5.73, ra: 8.53, dec: 20.45, constellationId: 27, xingguan: '鬼宿' },
  { name: '鬼宿三', traditionalName: '巨蟹座γ', magnitude: 4.66, ra: 8.48, dec: 21.46, constellationId: 27, xingguan: '鬼宿' },
  { name: '鬼宿四', traditionalName: '巨蟹座δ', magnitude: 4.28, ra: 8.67, dec: 18.47, constellationId: 27, xingguan: '鬼宿' },
  { name: '积尸气', traditionalName: 'M44', magnitude: 3.10, ra: 8.67, dec: 19.67, constellationId: 27, xingguan: '鬼宿' },
  
  { name: '柳宿一', traditionalName: '长蛇座δ', magnitude: 4.16, ra: 8.52, dec: 5.58, constellationId: 28, xingguan: '柳宿' },
  { name: '柳宿二', traditionalName: '长蛇座σ', magnitude: 4.44, ra: 8.56, dec: 3.69, constellationId: 28, xingguan: '柳宿' },
  { name: '柳宿三', traditionalName: '长蛇座η', magnitude: 4.12, ra: 8.69, dec: 2.35, constellationId: 28, xingguan: '柳宿' },
  
  { name: '星宿一', traditionalName: '长蛇座α', magnitude: 1.99, ra: 9.48, dec: -8.66, constellationId: 29, xingguan: '星宿' },
  { name: '星宿二', traditionalName: '长蛇座τ1', magnitude: 4.90, ra: 9.33, dec: -7.33, constellationId: 29, xingguan: '星宿' },
  
  { name: '张宿一', traditionalName: '长蛇座υ1', magnitude: 4.93, ra: 10.13, dec: -14.27, constellationId: 30, xingguan: '张宿' },
  { name: '张宿二', traditionalName: '长蛇座λ', magnitude: 4.56, ra: 9.95, dec: -11.44, constellationId: 30, xingguan: '张宿' },
  
  { name: '翼宿一', traditionalName: '巨爵座α', magnitude: 4.03, ra: 11.24, dec: -14.67, constellationId: 31, xingguan: '翼宿' },
  { name: '翼宿二', traditionalName: '巨爵座β', magnitude: 5.48, ra: 11.35, dec: -16.54, constellationId: 31, xingguan: '翼宿' },
  
  { name: '轸宿一', traditionalName: '乌鸦座γ', magnitude: 2.59, ra: 12.32, dec: -17.34, constellationId: 32, xingguan: '轸宿' },
  { name: '轸宿二', traditionalName: '乌鸦座ε', magnitude: 3.02, ra: 12.28, dec: -16.46, constellationId: 32, xingguan: '轸宿' },
  { name: '轸宿三', traditionalName: '乌鸦座δ', magnitude: 2.93, ra: 12.35, dec: -18.51, constellationId: 32, xingguan: '轸宿' },
  { name: '轸宿四', traditionalName: '乌鸦座β', magnitude: 2.65, ra: 12.20, dec: -23.40, constellationId: 32, xingguan: '轸宿' },
  
  { name: '太微左垣一', traditionalName: '室女座η', magnitude: 3.89, ra: 12.58, dec: -4.38, constellationId: 2, xingguan: '太微' },
  { name: '太微左垣二', traditionalName: '室女座γ', magnitude: 2.74, ra: 12.46, dec: -1.23, constellationId: 2, xingguan: '太微' },
  { name: '太微右垣一', traditionalName: '狮子座β', magnitude: 2.14, ra: 10.15, dec: 11.97, constellationId: 2, xingguan: '太微' },
  { name: '太微右垣二', traditionalName: '狮子座δ', magnitude: 2.56, ra: 10.66, dec: 20.52, constellationId: 2, xingguan: '太微' },
  
  { name: '天市左垣一', traditionalName: '武仙座δ', magnitude: 3.13, ra: 17.25, dec: 24.82, constellationId: 3, xingguan: '天市' },
  { name: '天市左垣二', traditionalName: '武仙座λ', magnitude: 4.41, ra: 16.73, dec: 25.05, constellationId: 3, xingguan: '天市' },
  { name: '天市右垣一', traditionalName: '巨蛇座α', magnitude: 2.63, ra: 15.84, dec: 6.40, constellationId: 3, xingguan: '天市' },
  { name: '天市右垣二', traditionalName: '巨蛇座γ', magnitude: 5.12, ra: 15.71, dec: 10.33, constellationId: 3, xingguan: '天市' },
  
  { name: '织女星', traditionalName: '天琴座α', magnitude: 0.03, ra: 18.62, dec: 38.78, constellationId: null, xingguan: '织女' },
  { name: '牵牛星', traditionalName: '天鹰座α', magnitude: 0.77, ra: 19.85, dec: 8.87, constellationId: null, xingguan: '河鼓' },
  { name: '天津四', traditionalName: '天鹅座α', magnitude: 1.25, ra: 20.69, dec: 45.28, constellationId: null, xingguan: '天津' },
];

export const seedConnections: Omit<Connection, 'id'>[] = [
  { constellationId: 4, fromStarId: 1, toStarId: 2, order: 1 },
  { constellationId: 4, fromStarId: 2, toStarId: 3, order: 2 },
  { constellationId: 4, fromStarId: 3, toStarId: 4, order: 3 },
  { constellationId: 4, fromStarId: 4, toStarId: 5, order: 4 },
  { constellationId: 4, fromStarId: 5, toStarId: 6, order: 5 },
  { constellationId: 4, fromStarId: 6, toStarId: 7, order: 6 },
  
  { constellationId: 1, fromStarId: 8, toStarId: 9, order: 1 },
  { constellationId: 1, fromStarId: 9, toStarId: 10, order: 2 },
  
  { constellationId: 5, fromStarId: 11, toStarId: 12, order: 1 },
  
  { constellationId: 6, fromStarId: 13, toStarId: 14, order: 1 },
  
  { constellationId: 7, fromStarId: 15, toStarId: 16, order: 1 },
  
  { constellationId: 8, fromStarId: 17, toStarId: 18, order: 1 },
  { constellationId: 8, fromStarId: 18, toStarId: 19, order: 2 },
  
  { constellationId: 9, fromStarId: 20, toStarId: 21, order: 1 },
  { constellationId: 9, fromStarId: 21, toStarId: 22, order: 2 },
  
  { constellationId: 10, fromStarId: 23, toStarId: 24, order: 1 },
  { constellationId: 10, fromStarId: 24, toStarId: 25, order: 2 },
  { constellationId: 10, fromStarId: 25, toStarId: 26, order: 3 },
  
  { constellationId: 11, fromStarId: 27, toStarId: 28, order: 1 },
  
  { constellationId: 12, fromStarId: 29, toStarId: 30, order: 1 },
  { constellationId: 12, fromStarId: 30, toStarId: 31, order: 2 },
  { constellationId: 12, fromStarId: 31, toStarId: 32, order: 3 },
  { constellationId: 12, fromStarId: 32, toStarId: 33, order: 4 },
  { constellationId: 12, fromStarId: 33, toStarId: 34, order: 5 },
  
  { constellationId: 13, fromStarId: 35, toStarId: 36, order: 1 },
  
  { constellationId: 14, fromStarId: 37, toStarId: 38, order: 1 },
  
  { constellationId: 15, fromStarId: 39, toStarId: 40, order: 1 },
  
  { constellationId: 16, fromStarId: 41, toStarId: 42, order: 1 },
  { constellationId: 16, fromStarId: 42, toStarId: 43, order: 2 },
  
  { constellationId: 17, fromStarId: 44, toStarId: 45, order: 1 },
  
  { constellationId: 18, fromStarId: 46, toStarId: 47, order: 1 },
  
  { constellationId: 19, fromStarId: 48, toStarId: 49, order: 1 },
  { constellationId: 19, fromStarId: 49, toStarId: 50, order: 2 },
  
  { constellationId: 20, fromStarId: 51, toStarId: 52, order: 1 },
  { constellationId: 20, fromStarId: 52, toStarId: 53, order: 2 },
  
  { constellationId: 21, fromStarId: 54, toStarId: 55, order: 1 },
  { constellationId: 21, fromStarId: 55, toStarId: 56, order: 2 },
  
  { constellationId: 22, fromStarId: 57, toStarId: 58, order: 1 },
  { constellationId: 22, fromStarId: 58, toStarId: 59, order: 2 },
  
  { constellationId: 23, fromStarId: 60, toStarId: 61, order: 1 },
  { constellationId: 23, fromStarId: 61, toStarId: 62, order: 2 },
  
  { constellationId: 24, fromStarId: 63, toStarId: 64, order: 1 },
  
  { constellationId: 25, fromStarId: 65, toStarId: 66, order: 1 },
  { constellationId: 25, fromStarId: 66, toStarId: 67, order: 2 },
  { constellationId: 25, fromStarId: 67, toStarId: 68, order: 3 },
  { constellationId: 25, fromStarId: 68, toStarId: 69, order: 4 },
  
  { constellationId: 26, fromStarId: 70, toStarId: 71, order: 1 },
  { constellationId: 26, fromStarId: 71, toStarId: 72, order: 2 },
  { constellationId: 26, fromStarId: 72, toStarId: 73, order: 3 },
  { constellationId: 26, fromStarId: 73, toStarId: 74, order: 4 },
  { constellationId: 26, fromStarId: 74, toStarId: 75, order: 5 },
  
  { constellationId: 27, fromStarId: 76, toStarId: 77, order: 1 },
  { constellationId: 27, fromStarId: 77, toStarId: 78, order: 2 },
  { constellationId: 27, fromStarId: 78, toStarId: 79, order: 3 },
  { constellationId: 27, fromStarId: 79, toStarId: 80, order: 4 },
  
  { constellationId: 28, fromStarId: 81, toStarId: 82, order: 1 },
  { constellationId: 28, fromStarId: 82, toStarId: 83, order: 2 },
  
  { constellationId: 29, fromStarId: 84, toStarId: 85, order: 1 },
  
  { constellationId: 30, fromStarId: 86, toStarId: 87, order: 1 },
  
  { constellationId: 31, fromStarId: 88, toStarId: 89, order: 1 },
  
  { constellationId: 32, fromStarId: 90, toStarId: 91, order: 1 },
  { constellationId: 32, fromStarId: 91, toStarId: 92, order: 2 },
  { constellationId: 32, fromStarId: 92, toStarId: 93, order: 3 },
  
  { constellationId: 2, fromStarId: 94, toStarId: 95, order: 1 },
  { constellationId: 2, fromStarId: 96, toStarId: 97, order: 2 },
  
  { constellationId: 3, fromStarId: 98, toStarId: 99, order: 1 },
  { constellationId: 3, fromStarId: 100, toStarId: 101, order: 2 },
];
