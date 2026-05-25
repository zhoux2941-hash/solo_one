import { DailySettlement, SettlementPreview } from '../models/types'
import { dataStore } from '../data/store'

export class DailySettlementService {
  generateDailySettlement(date?: string): DailySettlement {
    const targetDate = date || new Date().toISOString().split('T')[0]
    
    const allSettlements = dataStore.getAllSettlements()
    const daySettlements = allSettlements.filter(s => s.settlementDate === targetDate)

    const uniqueShips = new Set(daySettlements.map(s => s.shipId))
    const uniqueApplications = new Set(daySettlements.map(s => s.applicationId))
    
    const totalIceAmount = daySettlements.reduce((sum, s) => sum + s.totalIceAmount, 0)
    const totalAmount = daySettlements.reduce((sum, s) => sum + s.totalAmount, 0)

    const dailySettlement: DailySettlement = {
      date: targetDate,
      totalApplications: uniqueApplications.size,
      totalShips: uniqueShips.size,
      totalIceAmount: Math.round(totalIceAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      settlements: daySettlements
    }

    dataStore.addDailySettlement(dailySettlement)
    return dailySettlement
  }

  getDailySettlement(date: string): DailySettlement | undefined {
    const existing = dataStore.getDailySettlement(date)
    if (existing) {
      return existing
    }
    return this.generateDailySettlement(date)
  }

  getDateRangeSettlements(startDate: string, endDate: string): DailySettlement[] {
    const results: DailySettlement[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const daily = this.getDailySettlement(dateStr)
      if (daily) {
        results.push(daily)
      }
    }

    return results
  }

  getSettlementSummary(date: string): {
    byShip: Array<{
      shipId: string
      shipName: string
      totalIceAmount: number
      totalAmount: number
      applicationCount: number
    }>
    totalIceAmount: number
    totalAmount: number
  } {
    const daily = this.getDailySettlement(date)
    if (!daily) {
      return { byShip: [], totalIceAmount: 0, totalAmount: 0 }
    }

    const shipMap = new Map<string, {
      shipId: string
      shipName: string
      totalIceAmount: number
      totalAmount: number
      applications: Set<string>
    }>()

    daily.settlements.forEach(s => {
      const existing = shipMap.get(s.shipId)
      if (existing) {
        existing.totalIceAmount += s.totalIceAmount
        existing.totalAmount += s.totalAmount
        existing.applications.add(s.applicationId)
      } else {
        shipMap.set(s.shipId, {
          shipId: s.shipId,
          shipName: s.shipName,
          totalIceAmount: s.totalIceAmount,
          totalAmount: s.totalAmount,
          applications: new Set([s.applicationId])
        })
      }
    })

    const byShip = Array.from(shipMap.values()).map(s => ({
      shipId: s.shipId,
      shipName: s.shipName,
      totalIceAmount: Math.round(s.totalIceAmount * 100) / 100,
      totalAmount: Math.round(s.totalAmount * 100) / 100,
      applicationCount: s.applications.size
    }))

    return {
      byShip,
      totalIceAmount: daily.totalIceAmount,
      totalAmount: daily.totalAmount
    }
  }

  regenerateDailySettlement(date: string): DailySettlement {
    return this.generateDailySettlement(date)
  }

  exportDailySettlement(date: string): {
    headers: string[]
    rows: string[][]
  } {
    const daily = this.getDailySettlement(date)
    if (!daily) {
      return { headers: [], rows: [] }
    }

    const headers = [
      '结算日期',
      '申请单号',
      '渔船名称',
      '舱位名称',
      '加冰量(吨)',
      '单价(元/吨)',
      '金额(元)'
    ]

    const rows: string[][] = []

    daily.settlements.forEach(settlement => {
      settlement.cabins.forEach(cabin => {
        rows.push([
          settlement.settlementDate,
          settlement.applicationId,
          settlement.shipName,
          cabin.cabinName,
          cabin.loadedAmount.toFixed(2),
          cabin.unitPrice.toFixed(2),
          cabin.amount.toFixed(2)
        ])
      })
    })

    return { headers, rows }
  }
}

export const dailySettlementService = new DailySettlementService()
