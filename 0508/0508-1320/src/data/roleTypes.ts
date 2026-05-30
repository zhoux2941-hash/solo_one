import { RoleType } from '../types';

export const roleTypes: RoleType[] = [
  {
    id: 'warrior',
    name: '武将',
    description: '征战沙场的英雄豪杰，色彩鲜明强烈，彰显勇猛无畏的英雄气概。',
    mainColors: [
      { color: '#C41E3A', name: '正红', meaning: '忠勇正义，赤胆忠心' },
      { color: '#1E1E1E', name: '黑色', meaning: '刚直不阿，铁面无私' },
      { color: '#2E7D32', name: '深绿', meaning: '勇猛善战，鲁莽豪放' },
    ],
    secondaryColors: [
      { color: '#FF8C00', name: '橙色', meaning: '暴躁冲动，正义感强' },
      { color: '#1565C0', name: '深蓝', meaning: '沉稳坚毅，智勇双全' },
      { color: '#8B4513', name: '棕色', meaning: '老成持重，阅历丰富' },
    ],
    accentColors: [
      { color: '#FFD700', name: '金色', meaning: '功勋卓著，身份尊贵' },
      { color: '#FFFFFF', name: '白色', meaning: '英武俊朗，器宇轩昂' },
    ],
  },
  {
    id: 'civilian',
    name: '文官',
    description: '辅佐朝政的文臣谋士，色彩典雅庄重，体现儒雅智慧的风范。',
    mainColors: [
      { color: '#1565C0', name: '深蓝', meaning: '沉稳睿智，深谋远虑' },
      { color: '#8B4513', name: '棕色', meaning: '老成持重，公正廉明' },
      { color: '#F5DEB3', name: '肤色', meaning: '忠厚老实，恪尽职守' },
    ],
    secondaryColors: [
      { color: '#4A4A4A', name: '深灰', meaning: '深沉内敛，思虑周全' },
      { color: '#9C27B0', name: '紫色', meaning: '高官显爵，身份尊贵' },
      { color: '#2E7D32', name: '深绿', meaning: '清正廉洁，刚正不阿' },
    ],
    accentColors: [
      { color: '#FFD700', name: '金色', meaning: '皇恩浩荡，官运亨通' },
      { color: '#C41E3A', name: '正红', meaning: '忠心耿耿，义薄云天' },
    ],
  },
  {
    id: 'clown',
    name: '丑角',
    description: '滑稽幽默的喜剧角色，色彩夸张搞笑，增添戏剧情趣。',
    mainColors: [
      { color: '#FFFFFF', name: '白色', meaning: '滑稽可笑，机智幽默' },
      { color: '#FF69B4', name: '粉红', meaning: '诙谐风趣，讨人喜爱' },
      { color: '#40E0D0', name: '青绿', meaning: '精灵古怪，活泼好动' },
    ],
    secondaryColors: [
      { color: '#FF8C00', name: '橙色', meaning: '热情开朗，乐观向上' },
      { color: '#FFD700', name: '金色', meaning: '富贵吉祥，喜气洋洋' },
      { color: '#E040FB', name: '亮紫', meaning: '神秘莫测，变幻多端' },
    ],
    accentColors: [
      { color: '#C41E3A', name: '正红', meaning: '喜庆热闹，红红火火' },
      { color: '#1E1E1E', name: '黑色', meaning: '憨直可爱，大智若愚' },
    ],
  },
  {
    id: 'fairy',
    name: '仙女',
    description: '天宫下凡的神仙丽人，色彩柔美飘逸，展现超凡脱俗的仙气。',
    mainColors: [
      { color: '#FF69B4', name: '粉红', meaning: '娇媚温柔，美丽动人' },
      { color: '#E040FB', name: '亮紫', meaning: '神秘高贵，仙气缭绕' },
      { color: '#42A5F5', name: '天蓝', meaning: '清新脱俗，飘逸灵动' },
    ],
    secondaryColors: [
      { color: '#FFFFFF', name: '白色', meaning: '纯洁无瑕，冰清玉洁' },
      { color: '#FFD700', name: '金色', meaning: '金光护体，法力无边' },
      { color: '#40E0D0', name: '青绿', meaning: '清新自然，草木精灵' },
    ],
    accentColors: [
      { color: '#FFB6C1', name: '浅粉', meaning: '娇羞可爱，楚楚动人' },
      { color: '#9C27B0', name: '紫色', meaning: '高贵典雅，仙风道骨' },
    ],
  },
  {
    id: 'monster',
    name: '动物精怪',
    description: '幻化人形的妖魔鬼怪，色彩怪诞奇异，表现神秘诡异的特质。',
    mainColors: [
      { color: '#2E7D32', name: '深绿', meaning: '山林精怪，野性难驯' },
      { color: '#1E1E1E', name: '黑色', meaning: '阴险狡诈，邪恶凶残' },
      { color: '#9C27B0', name: '紫色', meaning: '妖术高强，神秘莫测' },
    ],
    secondaryColors: [
      { color: '#40E0D0', name: '青绿', meaning: '水怪蛇精，阴冷诡异' },
      { color: '#8B4513', name: '棕色', meaning: '狼虫虎豹，凶猛残暴' },
      { color: '#FF8C00', name: '橙色', meaning: '狡猾多变，诡计多端' },
    ],
    accentColors: [
      { color: '#C41E3A', name: '正红', meaning: '嗜血成性，残暴凶猛' },
      { color: '#FFD700', name: '金色', meaning: '修炼千年，道行高深' },
    ],
  },
];
