import { SolarTerm } from '../types';
import { getLunarDateString } from './lunar';

const SOLAR_TERMS_INFO: { name: string; phenology: string; season: string }[] = [
  { name: '立春', phenology: '东风解冻，蛰虫始振', season: '春' },
  { name: '雨水', phenology: '獭祭鱼，鸿雁来', season: '春' },
  { name: '惊蛰', phenology: '桃始华，仓庚鸣', season: '春' },
  { name: '春分', phenology: '玄鸟至，雷乃发声', season: '春' },
  { name: '清明', phenology: '桐始华，田鼠化为鴽', season: '春' },
  { name: '谷雨', phenology: '萍始生，鸣鸠拂羽', season: '春' },
  { name: '立夏', phenology: '蝼蝈鸣，蚯蚓出', season: '夏' },
  { name: '小满', phenology: '苦菜秀，靡草死', season: '夏' },
  { name: '芒种', phenology: '螳螂生，鵙始鸣', season: '夏' },
  { name: '夏至', phenology: '鹿角解，蝉始鸣', season: '夏' },
  { name: '小暑', phenology: '温风至，蟋蟀居壁', season: '夏' },
  { name: '大暑', phenology: '腐草为萤，土润溽暑', season: '夏' },
  { name: '立秋', phenology: '凉风至，白露降', season: '秋' },
  { name: '处暑', phenology: '鹰乃祭鸟，天地始肃', season: '秋' },
  { name: '白露', phenology: '鸿雁来，玄鸟归', season: '秋' },
  { name: '秋分', phenology: '雷始收声，蛰虫坯户', season: '秋' },
  { name: '寒露', phenology: '鸿雁来宾，雀入大水', season: '秋' },
  { name: '霜降', phenology: '豺乃祭兽，草木黄落', season: '秋' },
  { name: '立冬', phenology: '水始冰，地始冻', season: '冬' },
  { name: '小雪', phenology: '虹藏不见，天气上升', season: '冬' },
  { name: '大雪', phenology: '鹖鴠不鸣，虎始交', season: '冬' },
  { name: '冬至', phenology: '蚯蚓结，麋角解', season: '冬' },
  { name: '小寒', phenology: '雁北乡，鹊始巢', season: '冬' },
  { name: '大寒', phenology: '鸡始乳，征鸟厉疾', season: '冬' },
];

const TERM_DATA_2000_2030: number[][] = [
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,18,4,18,5,20,5,21,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,18,4,18,5,20,5,21,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,18,4,18,5,20,5,21,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
  [4,19,4,19,5,20,5,20,6,21,6,21,7,22,7,23,7,23,8,23,8,23,8,23],
];

const MONTH_DAYS = [
  [4,19], [4,19], [5,20], [5,21], [6,21], [6,21],
  [7,22], [7,23], [7,23], [8,23], [8,23], [8,23],
];

function getSolarTermDay(year: number, termIndex: number): number {
  if (year >= 2000 && year <= 2030) {
    const yearOffset = year - 2000;
    if (TERM_DATA_2000_2030[yearOffset] && TERM_DATA_2000_2030[yearOffset][termIndex] !== undefined) {
      return TERM_DATA_2000_2030[yearOffset][termIndex];
    }
  }
  
  const baseDays = [
    4,19,4,19,5,20,5,21,6,21,6,21,
    7,23,7,23,8,23,8,23,8,23,7,22
  ];
  const offset = Math.floor((year - 2000) / 4);
  return baseDays[termIndex] + (offset % 2);
}

export function getSolarTermsForYear(year: number): SolarTerm[] {
  const terms: SolarTerm[] = [];
  const months = [1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,1];
  
  for (let i = 0; i < 24; i++) {
    const month = months[i];
    const day = getSolarTermDay(year, i);
    const info = SOLAR_TERMS_INFO[i];
    const lunarDate = getLunarDateString(year, month, day);
    
    terms.push({
      name: info.name,
      date: `${month}月${day}日`,
      month,
      day,
      phenology: info.phenology,
      season: info.season,
      lunarDate,
    });
  }
  
  return terms;
}

export function getTermsBySeason(terms: SolarTerm[]): Record<string, SolarTerm[]> {
  return {
    '春': terms.filter(t => t.season === '春'),
    '夏': terms.filter(t => t.season === '夏'),
    '秋': terms.filter(t => t.season === '秋'),
    '冬': terms.filter(t => t.season === '冬'),
  };
}

export const SEASON_COLORS: Record<string, string> = {
  '春': '#7CB342',
  '夏': '#EF6C00',
  '秋': '#D84315',
  '冬': '#1565C0',
};

export const SEASON_NAMES = ['春', '夏', '秋', '冬'];
