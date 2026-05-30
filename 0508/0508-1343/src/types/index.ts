export interface Dynasty {
  id: string
  name: string
  period: string
  yearRange: [number, number]
  color: string
}

export interface SalaryComposition {
  money: number
  moneyUnit: string
  grain: number
  grainUnit: string
  land: number
  landUnit: string
  officeLand: number
  officeLandUnit: string
}

export interface SalaryRecord {
  dynastyId: string
  officialId: string
  rank: number
  rankName: string
  salary: SalaryComposition
  note: string
}

export interface OfficialTitle {
  id: string
  name: string
  category: string
  ranksByDynasty: Record<string, { rank: number; rankName: string }>
}

export interface RicePrice {
  dynastyId: string
  pricePerShi: number
  currencyUnit: string
  note: string
}

export interface PurchasingPowerResult {
  dynastyId: string
  dynastyName: string
  equivalentRank: number
  equivalentRankName: string
  equivalentTitle: string
  riceShi: number
  modernRiceKg: number
  description: string
}

export interface CompareResult {
  dynastyA: string
  dynastyB: string
  officialId: string
  officialName: string
  salaryA: SalaryComposition
  salaryB: SalaryComposition
  ricePriceA: number
  ricePriceB: number
  riceQuantityA: number
  riceQuantityB: number
  diffPercent: number
}

export type SelectorMode = 'official' | 'rank'
