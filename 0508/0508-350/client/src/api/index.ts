import axios from 'axios'
import type {
  IceApplication,
  CabinAllocation,
  LoadingReceipt,
  SettlementPreview,
  VerificationResult,
  DailySettlement,
  MergedData,
  ApiResponse,
  AllocatedCabin
} from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const applicationApi = {
  getAll: () => api.get<ApiResponse<IceApplication[]>>('/applications'),
  getById: (id: string) => api.get<ApiResponse<IceApplication>>(`/applications/${id}`)
}

export const allocationApi = {
  getAll: () => api.get<ApiResponse<CabinAllocation[]>>('/allocations'),
  getById: (id: string) => api.get<ApiResponse<CabinAllocation>>(`/allocations/${id}`),
  update: (id: string, cabins: AllocatedCabin[]) => 
    api.put<ApiResponse<CabinAllocation>>(`/allocations/${id}`, { cabins })
}

export const receiptApi = {
  getAll: () => api.get<ApiResponse<LoadingReceipt[]>>('/receipts'),
  getById: (id: string) => api.get<ApiResponse<LoadingReceipt>>(`/receipts/${id}`)
}

export const settlementApi = {
  getAll: () => api.get<ApiResponse<SettlementPreview[]>>('/settlements'),
  getById: (id: string) => api.get<ApiResponse<SettlementPreview>>(`/settlements/${id}`)
}

export const verificationApi = {
  verifyCabinChange: (allocationId: string, oldCabins: AllocatedCabin[], newCabins: AllocatedCabin[]) =>
    api.post<ApiResponse<VerificationResult>>('/verify/cabin-change', {
      allocationId,
      oldCabins,
      newCabins
    })
}

export const dailySettlementApi = {
  getDaily: (date?: string) => 
    api.get<ApiResponse<DailySettlement>>('/daily-settlement', { params: { date } }),
  getSummary: (date?: string) =>
    api.get<ApiResponse<{
      byShip: Array<{
        shipId: string
        shipName: string
        totalIceAmount: number
        totalAmount: number
        applicationCount: number
      }>
      totalIceAmount: number
      totalAmount: number
    }>>('/daily-settlement/summary', { params: { date } }),
  export: (date?: string) =>
    api.get<ApiResponse<{ headers: string[], rows: string[][] }>>('/daily-settlement/export', { params: { date } })
}

export const mergedDataApi = {
  getAll: () => api.get<ApiResponse<MergedData[]>>('/merged-data')
}

export const correctionApi = {
  getRecords: (params?: { shipId?: string; workGroup?: string; days?: number }) =>
    api.get<ApiResponse<CabinCorrectionRecord[]>>('/correction-records', { params }),
  getTimeline: (days?: number) =>
    api.get<ApiResponse<CorrectionTimelineDay[]>>('/correction-records/timeline', { params: { days } })
}

export default api
