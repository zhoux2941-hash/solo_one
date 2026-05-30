import type { RicePrice } from '@/types'

export const ricePrices: RicePrice[] = [
  { dynastyId: 'han', pricePerShi: 100, currencyUnit: '钱/石', note: '西汉米价约100钱/石（正常年景）' },
  { dynastyId: 'tang', pricePerShi: 200, currencyUnit: '文/石', note: '唐代米价约200文/石（贞观至开元）' },
  { dynastyId: 'song', pricePerShi: 1000, currencyUnit: '文/石', note: '宋代米价约1000文/石（北宋中期）' },
  { dynastyId: 'yuan', pricePerShi: 25, currencyUnit: '两/石', note: '元代米价约25两/石' },
  { dynastyId: 'ming', pricePerShi: 0.5, currencyUnit: '两/石', note: '明代米价约0.5两/石（正常年景）' },
  { dynastyId: 'qing', pricePerShi: 1.5, currencyUnit: '两/石', note: '清代米价约1.5两/石（中期）' },
]

export const ricePriceMap = Object.fromEntries(ricePrices.map(r => [r.dynastyId, r]))

export const MODERN_RICE_PRICE = 6.5
export const SHI_TO_KG = 70
