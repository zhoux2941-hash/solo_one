import { ricePriceMap, MODERN_RICE_PRICE, SHI_TO_KG } from '@/data/ricePrices'
import { salaryRecords, salaryRecords as rawSalaryRecords } from '@/data/salaries'
import { dynastyMap } from '@/data/dynasties'
import { officialMap } from '@/data/officials'
import type { SalaryComposition, PurchasingPowerResult } from '@/types'

const OFFICE_LAND_YIELD = 1.5

const QING_YANGLIAN: Record<string, number> = {
  pm: 16000,
  shangshu: 10000,
  cishi: 3000,
  xianling: 1200,
  shiyushi: 2000,
  taiwei: 15000,
  langzhong: 1500,
  zhoubu: 60,
}

function getQingYanglianNote(officialId: string): string {
  const notes: Record<string, string> = {
    pm: '大学士/军机大臣养廉银约16000两',
    shangshu: '六部尚书养廉银约10000两',
    cishi: '知府/道员养廉银约3000两',
    xianling: '知县养廉银约400-2000两，取中值1200两',
    shiyushi: '监察御史养廉银约2000两',
    taiwei: '提督/大将军养廉银约15000两',
    langzhong: '郎中养廉银约1500两',
    zhoubu: '主簿等杂官养廉银约60两',
  }
  return notes[officialId] || ''
}

export function salaryToRiceShi(dynastyId: string, officialId: string, salary: SalaryComposition): number {
  const rp = ricePriceMap[dynastyId]
  if (!rp) return 0

  let riceShi = 0

  if (dynastyId === 'han') {
    riceShi += salary.grain
    if (salary.money > 0) {
      riceShi += salary.money / rp.pricePerShi
    }
    if (salary.officeLand > 0) {
      riceShi += salary.officeLand * OFFICE_LAND_YIELD
    }
  } else if (dynastyId === 'tang') {
    riceShi += salary.grain
    if (salary.money > 0) {
      riceShi += (salary.money * 12) / rp.pricePerShi
    }
    if (salary.officeLand > 0) {
      riceShi += salary.officeLand * OFFICE_LAND_YIELD
    }
  } else if (dynastyId === 'song') {
    riceShi += salary.grain * 12
    if (salary.money > 0) {
      riceShi += (salary.money * 12) / rp.pricePerShi
    }
    if (salary.officeLand > 0) {
      riceShi += salary.officeLand * OFFICE_LAND_YIELD
    }
  } else if (dynastyId === 'yuan') {
    riceShi += salary.grain
    if (salary.money > 0) {
      const monthlyLiang = salary.money * 50
      riceShi += (monthlyLiang * 12) / rp.pricePerShi
    }
  } else if (dynastyId === 'ming') {
    riceShi += salary.grain
    if (salary.money > 0) {
      riceShi += salary.money / rp.pricePerShi
    }
  } else if (dynastyId === 'qing') {
    riceShi += salary.grain / 2
    let totalMoney = salary.money
    const yanglian = QING_YANGLIAN[officialId] || 0
    totalMoney += yanglian
    if (totalMoney > 0) {
      riceShi += totalMoney / rp.pricePerShi
    }
  }

  return riceShi
}

export function convertModernSalaryToPurchasingPower(monthlySalary: number): PurchasingPowerResult[] {
  const modernAnnualRiceKg = (monthlySalary * 12) / MODERN_RICE_PRICE
  const modernAnnualRiceShi = modernAnnualRiceKg / SHI_TO_KG

  const dynastyIds = ['han', 'tang', 'song', 'yuan', 'ming', 'qing']

  return dynastyIds.map(dynastyId => {
    const dynasty = dynastyMap[dynastyId]
    const rp = ricePriceMap[dynastyId]
    if (!dynasty || !rp) {
      return {
        dynastyId,
        dynastyName: dynasty?.name || '',
        equivalentRank: 0,
        equivalentRankName: '',
        equivalentTitle: '',
        riceShi: 0,
        modernRiceKg: 0,
        description: '',
      }
    }

    const dynastyRecords = rawSalaryRecords
      .filter(r => r.dynastyId === dynastyId)
      .map(r => ({
        ...r,
        riceShi: salaryToRiceShi(dynastyId, r.officialId, r.salary),
      }))
      .sort((a, b) => a.riceShi - b.riceShi)

    let matched = dynastyRecords[dynastyRecords.length - 1]
    for (let i = 0; i < dynastyRecords.length; i++) {
      if (dynastyRecords[i].riceShi >= modernAnnualRiceShi) {
        matched = dynastyRecords[i]
        break
      }
    }

    const official = officialMap[matched.officialId]
    const modernRiceKg = modernAnnualRiceShi * SHI_TO_KG

    return {
      dynastyId,
      dynastyName: dynasty.name,
      equivalentRank: matched.rank,
      equivalentRankName: matched.rankName,
      equivalentTitle: official?.name || matched.officialId,
      riceShi: Math.round(modernAnnualRiceShi * 10) / 10,
      modernRiceKg: Math.round(modernRiceKg),
      description: `月薪${monthlySalary}元，年购米${Math.round(modernRiceKg)}kg，相当于${dynasty.name}代${matched.rankName}（${official?.name || ''}）的购买力`,
    }
  })
}
