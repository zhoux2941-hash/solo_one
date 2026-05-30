import { SHI_TO_KG, MODERN_RICE_PRICE } from '@/data/ricePrices'

export function shiToKg(shi: number): number {
  return Math.round(shi * SHI_TO_KG)
}

export function kgToShi(kg: number): number {
  return Math.round((kg / SHI_TO_KG) * 10) / 10
}

export function modernSalaryToRiceKg(monthlySalary: number): number {
  return Math.round((monthlySalary * 12) / MODERN_RICE_PRICE)
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString('zh-CN')
}

export function formatRiceKg(kg: number): string {
  if (kg >= 1000) {
    return (kg / 1000).toFixed(1) + '吨'
  }
  return kg + 'kg'
}
