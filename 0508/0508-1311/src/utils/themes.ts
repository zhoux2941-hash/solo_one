import { Theme } from '../types';

export const THEMES: Theme[] = [
  {
    id: 'vermilion',
    name: '朱砂红',
    backgroundColor: '#FDF5E6',
    primaryColor: '#B22222',
    secondaryColor: '#8B0000',
    textColor: '#3D2914',
    accentColor: '#DAA520',
    borderColor: '#8B0000',
  },
  {
    id: 'blue-white',
    name: '青花蓝',
    backgroundColor: '#F5F5F0',
    primaryColor: '#1E4D7B',
    secondaryColor: '#0D2C54',
    textColor: '#2C3E50',
    accentColor: '#4A90A4',
    borderColor: '#1E4D7B',
  },
  {
    id: 'bamboo-green',
    name: '竹叶绿',
    backgroundColor: '#F0F7EA',
    primaryColor: '#2E5D3B',
    secondaryColor: '#1A3A25',
    textColor: '#2C3E2C',
    accentColor: '#7CB342',
    borderColor: '#2E5D3B',
  },
];

export const FONT_FAMILIES = [
  { id: 'ma-shan', name: '马善政楷', value: "'Ma Shan Zheng', cursive" },
  { id: 'noto-serif', name: '思源宋体', value: "'Noto Serif SC', serif" },
  { id: 'noto-sans', name: '思源黑体', value: "'Noto Sans SC', sans-serif" },
  { id: 'zcool', name: '站酷文艺', value: "'ZCOOL XiaoWei', serif" },
  { id: 'system', name: '系统默认', value: "system-ui, -apple-system, serif" },
];

export const EXPORT_SIZES = {
  A4: { width: 2480, height: 3508 },
  A3: { width: 3508, height: 4961 },
};

export function getThemeById(id: string): Theme {
  return THEMES.find(t => t.id === id) || THEMES[0];
}

export function getFontFamilyById(id: string): string {
  const font = FONT_FAMILIES.find(f => f.id === id);
  return font ? font.value : FONT_FAMILIES[0].value;
}
