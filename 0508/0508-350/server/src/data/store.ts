import { IceApplication, CabinAllocation, LoadingReceipt, SettlementPreview, DailySettlement, CabinCorrectionRecord } from '../models/types'

class DataStore {
  private applications: Map<string, IceApplication> = new Map()
  private allocations: Map<string, CabinAllocation> = new Map()
  private receipts: Map<string, LoadingReceipt> = new Map()
  private settlements: Map<string, SettlementPreview> = new Map()
  private dailySettlements: Map<string, DailySettlement> = new Map()
  private correctionRecords: Map<string, CabinCorrectionRecord> = new Map()

  addApplication(app: IceApplication): void {
    this.applications.set(app.id, app)
  }

  getApplication(id: string): IceApplication | undefined {
    return this.applications.get(id)
  }

  getAllApplications(): IceApplication[] {
    return Array.from(this.applications.values())
  }

  updateApplication(id: string, updates: Partial<IceApplication>): IceApplication | undefined {
    const app = this.applications.get(id)
    if (app) {
      const updated = { ...app, ...updates }
      this.applications.set(id, updated)
      return updated
    }
    return undefined
  }

  addAllocation(allocation: CabinAllocation): void {
    this.allocations.set(allocation.id, allocation)
  }

  getAllocation(id: string): CabinAllocation | undefined {
    return this.allocations.get(id)
  }

  getAllocationsByApplication(applicationId: string): CabinAllocation[] {
    return Array.from(this.allocations.values()).filter(a => a.applicationId === applicationId)
  }

  getAllAllocations(): CabinAllocation[] {
    return Array.from(this.allocations.values())
  }

  updateAllocation(id: string, updates: Partial<CabinAllocation>): CabinAllocation | undefined {
    const allocation = this.allocations.get(id)
    if (allocation) {
      const updated = { ...allocation, ...updates }
      this.allocations.set(id, updated)
      return updated
    }
    return undefined
  }

  addReceipt(receipt: LoadingReceipt): void {
    this.receipts.set(receipt.id, receipt)
  }

  getReceipt(id: string): LoadingReceipt | undefined {
    return this.receipts.get(id)
  }

  getReceiptsByAllocation(allocationId: string): LoadingReceipt[] {
    return Array.from(this.receipts.values()).filter(r => r.allocationId === allocationId)
  }

  getReceiptsByApplication(applicationId: string): LoadingReceipt[] {
    return Array.from(this.receipts.values()).filter(r => r.applicationId === applicationId)
  }

  getAllReceipts(): LoadingReceipt[] {
    return Array.from(this.receipts.values())
  }

  updateReceipt(id: string, updates: Partial<LoadingReceipt>): LoadingReceipt | undefined {
    const receipt = this.receipts.get(id)
    if (receipt) {
      const updated = { ...receipt, ...updates }
      this.receipts.set(id, updated)
      return updated
    }
    return undefined
  }

  addSettlement(settlement: SettlementPreview): void {
    this.settlements.set(settlement.id, settlement)
  }

  getSettlement(id: string): SettlementPreview | undefined {
    return this.settlements.get(id)
  }

  getSettlementsByReceipt(receiptId: string): SettlementPreview[] {
    return Array.from(this.settlements.values()).filter(s => s.receiptId === receiptId)
  }

  getSettlementsByApplication(applicationId: string): SettlementPreview[] {
    return Array.from(this.settlements.values()).filter(s => s.applicationId === applicationId)
  }

  getAllSettlements(): SettlementPreview[] {
    return Array.from(this.settlements.values())
  }

  updateSettlement(id: string, updates: Partial<SettlementPreview>): SettlementPreview | undefined {
    const settlement = this.settlements.get(id)
    if (settlement) {
      const updated = { ...settlement, ...updates }
      this.settlements.set(id, updated)
      return updated
    }
    return undefined
  }

  addDailySettlement(daily: DailySettlement): void {
    this.dailySettlements.set(daily.date, daily)
  }

  getDailySettlement(date: string): DailySettlement | undefined {
    return this.dailySettlements.get(date)
  }

  getAllDailySettlements(): DailySettlement[] {
    return Array.from(this.dailySettlements.values())
  }

  addCorrectionRecord(record: CabinCorrectionRecord): void {
    this.correctionRecords.set(record.id, record)
  }

  getCorrectionRecord(id: string): CabinCorrectionRecord | undefined {
    return this.correctionRecords.get(id)
  }

  getCorrectionRecordsByTimeRange(startTime: string, endTime: string): CabinCorrectionRecord[] {
    return Array.from(this.correctionRecords.values())
      .filter(r => r.correctionTime >= startTime && r.correctionTime <= endTime)
      .sort((a, b) => b.correctionTime.localeCompare(a.correctionTime))
  }

  getCorrectionRecordsByShip(shipId: string): CabinCorrectionRecord[] {
    return Array.from(this.correctionRecords.values())
      .filter(r => r.shipId === shipId)
      .sort((a, b) => b.correctionTime.localeCompare(a.correctionTime))
  }

  getCorrectionRecordsByWorkGroup(workGroup: string): CabinCorrectionRecord[] {
    return Array.from(this.correctionRecords.values())
      .filter(r => r.workGroup === workGroup)
      .sort((a, b) => b.correctionTime.localeCompare(a.correctionTime))
  }

  getAllCorrectionRecords(): CabinCorrectionRecord[] {
    return Array.from(this.correctionRecords.values())
      .sort((a, b) => b.correctionTime.localeCompare(a.correctionTime))
  }
}

export const dataStore = new DataStore()
