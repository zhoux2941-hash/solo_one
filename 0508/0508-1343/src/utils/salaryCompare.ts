import type { CompareResult, SalaryComposition } from '@/types'
import { salaryToRiceShi } from './purchasingPower'

export function compareSalary(
  dynastyA: string,
  dynastyB: string,
  officialId: string,
  officialName: string,
  salaryA: SalaryComposition,
  salaryB: SalaryComposition,
  ricePriceA: number,
  ricePriceB: number,
): CompareResult {
  const riceA = salaryToRiceShi(dynastyA, officialId, salaryA)
  const riceB = salaryToRiceShi(dynastyB, officialId, salaryB)

  const diffPercent = riceB > 0
    ? Math.round(((riceA - riceB) / riceB) * 100)
    : riceA > 0 ? 100 : 0

  return {
    dynastyA,
    dynastyB,
    officialId,
    officialName,
    salaryA,
    salaryB,
    ricePriceA,
    ricePriceB,
    riceQuantityA: Math.round(riceA * 10) / 10,
    riceQuantityB: Math.round(riceB * 10) / 10,
    diffPercent,
  }
}
