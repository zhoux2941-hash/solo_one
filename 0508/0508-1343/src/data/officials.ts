import type { OfficialTitle } from '@/types'

export const officials: OfficialTitle[] = [
  {
    id: 'pm',
    name: '丞相',
    category: '中枢',
    ranksByDynasty: {
      han: { rank: 1, rankName: '万石' },
      tang: { rank: 1, rankName: '正一品' },
      song: { rank: 1, rankName: '正一品' },
      yuan: { rank: 1, rankName: '正一品' },
      ming: { rank: 1, rankName: '正一品' },
      qing: { rank: 1, rankName: '正一品' },
    },
  },
  {
    id: 'shangshu',
    name: '尚书',
    category: '中枢',
    ranksByDynasty: {
      han: { rank: 3, rankName: '中二千石' },
      tang: { rank: 3, rankName: '正三品' },
      song: { rank: 3, rankName: '从二品' },
      yuan: { rank: 3, rankName: '正二品' },
      ming: { rank: 2, rankName: '正二品' },
      qing: { rank: 2, rankName: '从一品' },
    },
  },
  {
    id: 'cishi',
    name: '刺史/知州',
    category: '地方',
    ranksByDynasty: {
      han: { rank: 5, rankName: '六百石' },
      tang: { rank: 4, rankName: '正四品' },
      song: { rank: 5, rankName: '正五品' },
      yuan: { rank: 4, rankName: '正四品' },
      ming: { rank: 4, rankName: '正四品' },
      qing: { rank: 4, rankName: '从四品' },
    },
  },
  {
    id: 'xianling',
    name: '县令/知县',
    category: '地方',
    ranksByDynasty: {
      han: { rank: 7, rankName: '六百石至二百石' },
      tang: { rank: 7, rankName: '正七品' },
      song: { rank: 8, rankName: '正八品' },
      yuan: { rank: 7, rankName: '正七品' },
      ming: { rank: 7, rankName: '正七品' },
      qing: { rank: 7, rankName: '正七品' },
    },
  },
  {
    id: 'shiyushi',
    name: '侍御史',
    category: '监察',
    ranksByDynasty: {
      han: { rank: 6, rankName: '千石' },
      tang: { rank: 6, rankName: '从六品' },
      song: { rank: 6, rankName: '从六品' },
      yuan: { rank: 7, rankName: '从七品' },
      ming: { rank: 7, rankName: '正七品' },
      qing: { rank: 5, rankName: '从五品' },
    },
  },
  {
    id: 'taiwei',
    name: '太尉/大将军',
    category: '军事',
    ranksByDynasty: {
      han: { rank: 1, rankName: '万石' },
      tang: { rank: 2, rankName: '正二品' },
      song: { rank: 2, rankName: '正二品' },
      yuan: { rank: 2, rankName: '正二品' },
      ming: { rank: 2, rankName: '正二品' },
      qing: { rank: 1, rankName: '正一品' },
    },
  },
  {
    id: 'langzhong',
    name: '郎中',
    category: '中枢',
    ranksByDynasty: {
      han: { rank: 6, rankName: '比六百石' },
      tang: { rank: 5, rankName: '正五品' },
      song: { rank: 6, rankName: '正六品' },
      yuan: { rank: 5, rankName: '正五品' },
      ming: { rank: 5, rankName: '正五品' },
      qing: { rank: 5, rankName: '正五品' },
    },
  },
  {
    id: 'zhoubu',
    name: '主簿',
    category: '地方',
    ranksByDynasty: {
      han: { rank: 8, rankName: '百石' },
      tang: { rank: 9, rankName: '从九品' },
      song: { rank: 9, rankName: '从九品' },
      yuan: { rank: 9, rankName: '从九品' },
      ming: { rank: 9, rankName: '正九品' },
      qing: { rank: 9, rankName: '从九品' },
    },
  },
]

export const officialMap = Object.fromEntries(officials.map(o => [o.id, o]))

export const categories = [...new Set(officials.map(o => o.category))]
