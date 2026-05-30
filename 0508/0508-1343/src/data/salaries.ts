import type { SalaryRecord } from '@/types'

export const salaryRecords: SalaryRecord[] = [
  // 汉朝 - 以石(谷物)为主，钱为辅
  { dynastyId: 'han', officialId: 'pm', rank: 1, rankName: '万石', salary: { money: 0, moneyUnit: '钱', grain: 420, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '汉代丞相万石，实领420石' },
  { dynastyId: 'han', officialId: 'shangshu', rank: 3, rankName: '中二千石', salary: { money: 0, moneyUnit: '钱', grain: 180, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '汉代九卿中二千石，实领180石' },
  { dynastyId: 'han', officialId: 'cishi', rank: 5, rankName: '六百石', salary: { money: 0, moneyUnit: '钱', grain: 70, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '汉代刺史六百石' },
  { dynastyId: 'han', officialId: 'xianling', rank: 7, rankName: '六百石至二百石', salary: { money: 0, moneyUnit: '钱', grain: 40, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '汉代县令四百石至二百石，取中值' },
  { dynastyId: 'han', officialId: 'shiyushi', rank: 6, rankName: '千石', salary: { money: 0, moneyUnit: '钱', grain: 90, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '汉代侍御史千石' },
  { dynastyId: 'han', officialId: 'taiwei', rank: 1, rankName: '万石', salary: { money: 0, moneyUnit: '钱', grain: 420, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '汉代太尉万石，与丞相同' },
  { dynastyId: 'han', officialId: 'langzhong', rank: 6, rankName: '比六百石', salary: { money: 0, moneyUnit: '钱', grain: 60, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '汉代郎中比六百石' },
  { dynastyId: 'han', officialId: 'zhoubu', rank: 8, rankName: '百石', salary: { money: 0, moneyUnit: '钱', grain: 16, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '汉代主簿百石' },

  // 唐朝 - 禄米+职分田+俸钱
  { dynastyId: 'tang', officialId: 'pm', rank: 1, rankName: '正一品', salary: { money: 9800, moneyUnit: '文/月', grain: 700, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 1200, officeLandUnit: '亩' }, note: '唐代正一品禄米700石，职分田1200亩' },
  { dynastyId: 'tang', officialId: 'shangshu', rank: 3, rankName: '正三品', salary: { money: 5300, moneyUnit: '文/月', grain: 400, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 600, officeLandUnit: '亩' }, note: '唐代正三品禄米400石，职分田600亩' },
  { dynastyId: 'tang', officialId: 'cishi', rank: 4, rankName: '正四品', salary: { money: 3600, moneyUnit: '文/月', grain: 300, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 400, officeLandUnit: '亩' }, note: '唐代正四品禄米300石，职分田400亩' },
  { dynastyId: 'tang', officialId: 'xianling', rank: 7, rankName: '正七品', salary: { money: 1750, moneyUnit: '文/月', grain: 80, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 350, officeLandUnit: '亩' }, note: '唐代正七品禄米80石，职分田350亩' },
  { dynastyId: 'tang', officialId: 'shiyushi', rank: 6, rankName: '从六品', salary: { money: 2300, moneyUnit: '文/月', grain: 100, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 400, officeLandUnit: '亩' }, note: '唐代从六品禄米100石' },
  { dynastyId: 'tang', officialId: 'taiwei', rank: 2, rankName: '正二品', salary: { money: 7100, moneyUnit: '文/月', grain: 600, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 800, officeLandUnit: '亩' }, note: '唐代正二品禄米600石，职分田800亩' },
  { dynastyId: 'tang', officialId: 'langzhong', rank: 5, rankName: '正五品', salary: { money: 2800, moneyUnit: '文/月', grain: 200, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 500, officeLandUnit: '亩' }, note: '唐代正五品禄米200石，职分田500亩' },
  { dynastyId: 'tang', officialId: 'zhoubu', rank: 9, rankName: '从九品', salary: { money: 950, moneyUnit: '文/月', grain: 52, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 200, officeLandUnit: '亩' }, note: '唐代从九品禄米52石，职分田200亩' },

  // 宋朝 - 俸钱+添支+职田，俸禄最丰厚
  { dynastyId: 'song', officialId: 'pm', rank: 1, rankName: '正一品', salary: { money: 400000, moneyUnit: '文/月', grain: 150, grainUnit: '石/月', land: 0, landUnit: '亩', officeLand: 3000, officeLandUnit: '亩' }, note: '宋代宰相月俸40万文，禄米150石/月' },
  { dynastyId: 'song', officialId: 'shangshu', rank: 3, rankName: '从二品', salary: { money: 200000, moneyUnit: '文/月', grain: 75, grainUnit: '石/月', land: 0, landUnit: '亩', officeLand: 2000, officeLandUnit: '亩' }, note: '宋代六部尚书月俸20万文' },
  { dynastyId: 'song', officialId: 'cishi', rank: 5, rankName: '正五品', salary: { money: 60000, moneyUnit: '文/月', grain: 25, grainUnit: '石/月', land: 0, landUnit: '亩', officeLand: 800, officeLandUnit: '亩' }, note: '宋代知州月俸6万文' },
  { dynastyId: 'song', officialId: 'xianling', rank: 8, rankName: '正八品', salary: { money: 15000, moneyUnit: '文/月', grain: 5, grainUnit: '石/月', land: 0, landUnit: '亩', officeLand: 300, officeLandUnit: '亩' }, note: '宋代知县月俸1.5万文' },
  { dynastyId: 'song', officialId: 'shiyushi', rank: 6, rankName: '从六品', salary: { money: 30000, moneyUnit: '文/月', grain: 12, grainUnit: '石/月', land: 0, landUnit: '亩', officeLand: 500, officeLandUnit: '亩' }, note: '宋代侍御史月俸3万文' },
  { dynastyId: 'song', officialId: 'taiwei', rank: 2, rankName: '正二品', salary: { money: 300000, moneyUnit: '文/月', grain: 100, grainUnit: '石/月', land: 0, landUnit: '亩', officeLand: 2500, officeLandUnit: '亩' }, note: '宋代枢密使月俸30万文' },
  { dynastyId: 'song', officialId: 'langzhong', rank: 6, rankName: '正六品', salary: { money: 35000, moneyUnit: '文/月', grain: 15, grainUnit: '石/月', land: 0, landUnit: '亩', officeLand: 500, officeLandUnit: '亩' }, note: '宋代郎中月俸3.5万文' },
  { dynastyId: 'song', officialId: 'zhoubu', rank: 9, rankName: '从九品', salary: { money: 7000, moneyUnit: '文/月', grain: 3, grainUnit: '石/月', land: 0, landUnit: '亩', officeLand: 150, officeLandUnit: '亩' }, note: '宋代主簿月俸7千文' },

  // 元朝 - 以锭/两计
  { dynastyId: 'yuan', officialId: 'pm', rank: 1, rankName: '正一品', salary: { money: 300, moneyUnit: '锭/月', grain: 0, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '元代丞相月俸300锭(1锭=50两)' },
  { dynastyId: 'yuan', officialId: 'shangshu', rank: 3, rankName: '正二品', salary: { money: 130, moneyUnit: '锭/月', grain: 0, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '元代尚书月俸130锭' },
  { dynastyId: 'yuan', officialId: 'cishi', rank: 4, rankName: '正四品', salary: { money: 40, moneyUnit: '锭/月', grain: 0, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '元代知州月俸40锭' },
  { dynastyId: 'yuan', officialId: 'xianling', rank: 7, rankName: '正七品', salary: { money: 12, moneyUnit: '锭/月', grain: 0, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '元代县尹月俸12锭' },
  { dynastyId: 'yuan', officialId: 'shiyushi', rank: 7, rankName: '从七品', salary: { money: 15, moneyUnit: '锭/月', grain: 0, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '元代监察御史月俸15锭' },
  { dynastyId: 'yuan', officialId: 'taiwei', rank: 2, rankName: '正二品', salary: { money: 180, moneyUnit: '锭/月', grain: 0, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '元代大将军月俸180锭' },
  { dynastyId: 'yuan', officialId: 'langzhong', rank: 5, rankName: '正五品', salary: { money: 26, moneyUnit: '锭/月', grain: 0, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '元代郎中月俸26锭' },
  { dynastyId: 'yuan', officialId: 'zhoubu', rank: 9, rankName: '从九品', salary: { money: 6, moneyUnit: '锭/月', grain: 0, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '元代主簿月俸6锭' },

  // 明朝 - 以石为本位，薄俸著名
  { dynastyId: 'ming', officialId: 'pm', rank: 1, rankName: '正一品', salary: { money: 0, moneyUnit: '两', grain: 1044, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '明代正一品岁禄1044石' },
  { dynastyId: 'ming', officialId: 'shangshu', rank: 2, rankName: '正二品', salary: { money: 0, moneyUnit: '两', grain: 732, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '明代正二品岁禄732石' },
  { dynastyId: 'ming', officialId: 'cishi', rank: 4, rankName: '正四品', salary: { money: 0, moneyUnit: '两', grain: 288, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '明代知府正四品岁禄288石' },
  { dynastyId: 'ming', officialId: 'xianling', rank: 7, rankName: '正七品', salary: { money: 0, moneyUnit: '两', grain: 90, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '明代知县正七品岁禄90石，薄俸著称' },
  { dynastyId: 'ming', officialId: 'shiyushi', rank: 7, rankName: '正七品', salary: { money: 0, moneyUnit: '两', grain: 90, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '明代监察御史正七品岁禄90石' },
  { dynastyId: 'ming', officialId: 'taiwei', rank: 2, rankName: '正二品', salary: { money: 0, moneyUnit: '两', grain: 732, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '明代正二品岁禄732石' },
  { dynastyId: 'ming', officialId: 'langzhong', rank: 5, rankName: '正五品', salary: { money: 0, moneyUnit: '两', grain: 192, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '明代正五品岁禄192石' },
  { dynastyId: 'ming', officialId: 'zhoubu', rank: 9, rankName: '正九品', salary: { money: 0, moneyUnit: '两', grain: 60, grainUnit: '石/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '明代正九品岁禄60石' },

  // 清朝 - 正俸+养廉银
  { dynastyId: 'qing', officialId: 'pm', rank: 1, rankName: '正一品', salary: { money: 180, moneyUnit: '两/年', grain: 180, grainUnit: '斛/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '清代正一品俸银180两，禄米180斛，养廉银另计' },
  { dynastyId: 'qing', officialId: 'shangshu', rank: 2, rankName: '从一品', salary: { money: 155, moneyUnit: '两/年', grain: 155, grainUnit: '斛/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '清代从一品俸银155两，养廉银约10000两' },
  { dynastyId: 'qing', officialId: 'cishi', rank: 4, rankName: '从四品', salary: { money: 105, moneyUnit: '两/年', grain: 105, grainUnit: '斛/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '清代知府俸银105两，养廉银约2000两' },
  { dynastyId: 'qing', officialId: 'xianling', rank: 7, rankName: '正七品', salary: { money: 45, moneyUnit: '两/年', grain: 45, grainUnit: '斛/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '清代知县俸银45两，养廉银约1000两' },
  { dynastyId: 'qing', officialId: 'shiyushi', rank: 5, rankName: '从五品', salary: { money: 80, moneyUnit: '两/年', grain: 80, grainUnit: '斛/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '清代从五品俸银80两' },
  { dynastyId: 'qing', officialId: 'taiwei', rank: 1, rankName: '正一品', salary: { money: 180, moneyUnit: '两/年', grain: 180, grainUnit: '斛/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '清代正一品俸银180两' },
  { dynastyId: 'qing', officialId: 'langzhong', rank: 5, rankName: '正五品', salary: { money: 80, moneyUnit: '两/年', grain: 80, grainUnit: '斛/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '清代正五品俸银80两' },
  { dynastyId: 'qing', officialId: 'zhoubu', rank: 9, rankName: '从九品', salary: { money: 19, moneyUnit: '两/年', grain: 19, grainUnit: '斛/年', land: 0, landUnit: '亩', officeLand: 0, officeLandUnit: '亩' }, note: '清代从九品俸银19两' },
]

export function getSalaryRecord(dynastyId: string, officialId: string): SalaryRecord | undefined {
  return salaryRecords.find(r => r.dynastyId === dynastyId && r.officialId === officialId)
}

export function getSalaryRecordsByDynasty(dynastyId: string): SalaryRecord[] {
  return salaryRecords.filter(r => r.dynastyId === dynastyId)
}

export function getSalaryRecordsByOfficial(officialId: string): SalaryRecord[] {
  return salaryRecords.filter(r => r.officialId === officialId)
}
