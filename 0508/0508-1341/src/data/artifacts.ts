import type { Artifact } from '@/types'

export const artifacts: Artifact[] = [
  {
    id: 'warring-states-ding',
    name: '战国铜鼎',
    dynasty: '战国',
    category: '青铜器',
    dimensions: [
      { label: '高', min: 25, max: 40, unit: 'cm' },
      { label: '口径', min: 20, max: 30, unit: 'cm' },
      { label: '腹径', min: 22, max: 35, unit: 'cm' },
    ],
  },
  {
    id: 'han-bronze-mirror',
    name: '汉代铜镜',
    dynasty: '汉',
    category: '青铜器',
    dimensions: [
      { label: '直径', min: 8, max: 20, unit: 'cm' },
      { label: '厚', min: 0.5, max: 1.2, unit: 'cm' },
    ],
  },
  {
    id: 'tang-sancai-horse',
    name: '唐代三彩马',
    dynasty: '唐',
    category: '陶器',
    dimensions: [
      { label: '高', min: 35, max: 55, unit: 'cm' },
      { label: '长', min: 30, max: 50, unit: 'cm' },
    ],
  },
  {
    id: 'song-porcelain-bowl',
    name: '宋代瓷碗',
    dynasty: '宋',
    category: '瓷器',
    dimensions: [
      { label: '高', min: 5, max: 10, unit: 'cm' },
      { label: '口径', min: 10, max: 18, unit: 'cm' },
      { label: '腹径', min: 8, max: 15, unit: 'cm' },
    ],
  },
  {
    id: 'ming-blue-white-vase',
    name: '明代青花瓶',
    dynasty: '明',
    category: '瓷器',
    dimensions: [
      { label: '高', min: 20, max: 45, unit: 'cm' },
      { label: '口径', min: 5, max: 12, unit: 'cm' },
      { label: '腹径', min: 12, max: 28, unit: 'cm' },
    ],
  },
  {
    id: 'shang-bronze-jue',
    name: '商代青铜爵',
    dynasty: '商',
    category: '青铜器',
    dimensions: [
      { label: '高', min: 18, max: 28, unit: 'cm' },
      { label: '流尾距', min: 8, max: 14, unit: 'cm' },
    ],
  },
]
