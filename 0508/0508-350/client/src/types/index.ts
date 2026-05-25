export interface IceApplication {
  id: string
  applicationNo: string
  shipId: string
  shipName: string
  applyTime: string
  plannedIceAmount: number
  status: 'pending' | 'allocated' | 'loading' | 'completed'
  cabinRequests: CabinRequest[]
}

export interface CabinRequest {
  cabinId: string
  cabinName: string
  requestedAmount: number
}

export interface CabinAllocation {
  id: string
  applicationId: string
  shipId: string
  shipName: string
  allocationTime: string
  operator: string
  cabins: AllocatedCabin[]
  totalAllocatedAmount: number
}

export interface AllocatedCabin {
  cabinId: string
  cabinName: string
  allocatedAmount: number
  tankNo: string
  position: string
}

export interface LoadingReceipt {
  id: string
  applicationId: string
  allocationId: string
  receiptNo: string
  shipId: string
  shipName: string
  loadingTime: string
  operator: string
  cabins: LoadedCabin[]
  totalLoadedAmount: number
  status: 'confirmed' | 'pending'
}

export interface LoadedCabin {
  cabinId: string
  cabinName: string
  allocatedAmount: number
  loadedAmount: number
  tankNo: string
  discrepancy: number
  isAffected?: boolean
}

export interface SettlementPreview {
  id: string
  applicationId: string
  shipId: string
  shipName: string
  receiptId: string
  settlementDate: string
  cabins: SettlementCabin[]
  totalIceAmount: number
  unitPrice: number
  totalAmount: number
  isAffected?: boolean
}

export interface SettlementCabin {
  cabinId: string
  cabinName: string
  loadedAmount: number
  unitPrice: number
  amount: number
  isAffected?: boolean
}

export interface VerificationResult {
  affectedReceipts: string[]
  affectedSettlements: string[]
  warnings: VerificationWarning[]
  hasDiscrepancy: boolean
}

export interface VerificationWarning {
  type: 'cabin_mismatch' | 'amount_discrepancy' | 'over_allocation'
  cabinId: string
  cabinName: string
  message: string
  severity: 'error' | 'warning'
}

export interface DailySettlement {
  date: string
  totalApplications: number
  totalShips: number
  totalIceAmount: number
  totalAmount: number
  settlements: SettlementPreview[]
}

export interface MergedData {
  application: IceApplication
  batches: BatchData[]
}

export interface BatchData {
  batchId: string
  batchNo: string
  allocation: CabinAllocation
  receipts: LoadingReceipt[]
  settlements: SettlementPreview[]
}

export interface CabinCorrectionRecord {
  id: string
  correctionTime: string
  allocationId: string
  applicationId: string
  shipId: string
  shipName: string
  operator: string
  workGroup: string
  cabinId: string
  cabinName: string
  oldAmount: number
  newAmount: number
  oldTankNo: string
  newTankNo: string
  reason: string
  affectedReceipts: string[]
  affectedSettlements: string[]
  warnings: string[]
}

export interface CorrectionTimelineDay {
  date: string
  records: CabinCorrectionRecord[]
  totalCorrections: number
  affectedReceipts: number
  affectedSettlements: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  verification?: VerificationResult
}
