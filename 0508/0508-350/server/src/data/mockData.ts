import { IceApplication, CabinAllocation, LoadingReceipt, SettlementPreview, CabinCorrectionRecord } from '../models/types'
import { dataStore } from '../data/store'

const shipNames = [
  '浙渔12345', '浙渔67890', '鲁渔11111', '鲁渔22222',
  '闽渔33333', '闽渔44444', '粤渔55555', '粤渔66666'
]

const cabinNames = ['前舱', '中舱', '后舱', '左舷舱', '右舷舱']
const tankNos = ['T-01', 'T-02', 'T-03', 'T-04', 'T-05']
const positions = ['A区', 'B区', 'C区', 'D区']
const operators = ['张调度', '李调度', '王调度']

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
}

function generateRandomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

export function generateMockData(): void {
  const today = new Date().toISOString().split('T')[0]

  for (let i = 0; i < 6; i++) {
    const shipName = shipNames[i]
    const cabinCount = Math.floor(Math.random() * 3) + 2
    
    const cabinRequests = Array.from({ length: cabinCount }, (_, idx) => ({
      cabinId: `CABIN-${i}-${idx}`,
      cabinName: cabinNames[idx % cabinNames.length],
      requestedAmount: generateRandomAmount(5, 20)
    }))

    const application: IceApplication = {
      id: generateId('APP'),
      applicationNo: `SQ${today.replace(/-/g, '')}${String(i + 1).padStart(3, '0')}`,
      shipId: `SHIP-${String(i + 1).padStart(4, '0')}`,
      shipName,
      applyTime: new Date(Date.now() - i * 3600000).toISOString(),
      plannedIceAmount: cabinRequests.reduce((sum, c) => sum + c.requestedAmount, 0),
      status: i < 4 ? 'completed' : 'allocated',
      cabinRequests
    }

    dataStore.addApplication(application)

    if (i < 5) {
      const allocatedCabins = cabinRequests.map((req, idx) => ({
        cabinId: req.cabinId,
        cabinName: req.cabinName,
        allocatedAmount: generateRandomAmount(req.requestedAmount * 0.9, req.requestedAmount * 1.1),
        tankNo: tankNos[idx % tankNos.length],
        position: positions[idx % positions.length]
      }))

      const allocation: CabinAllocation = {
        id: generateId('ALLOC'),
        applicationId: application.id,
        shipId: application.shipId,
        shipName: application.shipName,
        allocationTime: new Date(Date.now() - i * 3600000 + 1800000).toISOString(),
        operator: operators[i % operators.length],
        cabins: allocatedCabins,
        totalAllocatedAmount: allocatedCabins.reduce((sum, c) => sum + c.allocatedAmount, 0)
      }

      dataStore.addAllocation(allocation)

      if (i < 4) {
        const loadedCabins = allocatedCabins.map(cabin => {
          const loadedAmount = generateRandomAmount(cabin.allocatedAmount * 0.95, cabin.allocatedAmount * 1.02)
          return {
            cabinId: cabin.cabinId,
            cabinName: cabin.cabinName,
            allocatedAmount: cabin.allocatedAmount,
            loadedAmount,
            tankNo: cabin.tankNo,
            discrepancy: loadedAmount - cabin.allocatedAmount
          }
        })

        const receipt: LoadingReceipt = {
          id: generateId('REC'),
          applicationId: application.id,
          allocationId: allocation.id,
          receiptNo: `HZ${today.replace(/-/g, '')}${String(i + 1).padStart(3, '0')}`,
          shipId: application.shipId,
          shipName: application.shipName,
          loadingTime: new Date(Date.now() - i * 3600000 + 3600000).toISOString(),
          operator: operators[(i + 1) % operators.length],
          cabins: loadedCabins,
          totalLoadedAmount: loadedCabins.reduce((sum, c) => sum + c.loadedAmount, 0),
          status: 'confirmed'
        }

        dataStore.addReceipt(receipt)

        const unitPrice = 150
        const settlementCabins = loadedCabins.map(c => ({
          cabinId: c.cabinId,
          cabinName: c.cabinName,
          loadedAmount: c.loadedAmount,
          unitPrice,
          amount: c.loadedAmount * unitPrice
        }))

        const settlement: SettlementPreview = {
          id: generateId('SET'),
          applicationId: application.id,
          shipId: application.shipId,
          shipName: application.shipName,
          receiptId: receipt.id,
          settlementDate: today,
          cabins: settlementCabins,
          totalIceAmount: settlementCabins.reduce((sum, c) => sum + c.loadedAmount, 0),
          unitPrice,
          totalAmount: settlementCabins.reduce((sum, c) => sum + c.amount, 0)
        }

        dataStore.addSettlement(settlement)
      }
    }
  }

  addMultiBatchTestData(today)
}

function addMultiBatchTestData(today: string): void {
  const shipName = '浙渔12345'
  const shipId = 'SHIP-0001'
  const operator = operators[0]

  const cabinRequests1 = [
    { cabinId: 'CABIN-TEST-1-1', cabinName: '前舱', requestedAmount: 15 },
    { cabinId: 'CABIN-TEST-1-2', cabinName: '中舱', requestedAmount: 20 }
  ]

  const application1: IceApplication = {
    id: generateId('APP'),
    applicationNo: `SQ${today.replace(/-/g, '')}998`,
    shipId,
    shipName,
    applyTime: new Date(Date.now() - 86400000).toISOString(),
    plannedIceAmount: 35,
    status: 'completed',
    cabinRequests: cabinRequests1
  }
  dataStore.addApplication(application1)

  const allocation1: CabinAllocation = {
    id: generateId('ALLOC'),
    applicationId: application1.id,
    shipId,
    shipName,
    allocationTime: new Date(Date.now() - 82800000).toISOString(),
    operator,
    cabins: [
      { cabinId: 'CABIN-TEST-1-1', cabinName: '前舱', allocatedAmount: 14.5, tankNo: 'T-01', position: 'A区' },
      { cabinId: 'CABIN-TEST-1-2', cabinName: '中舱', allocatedAmount: 19.8, tankNo: 'T-02', position: 'B区' }
    ],
    totalAllocatedAmount: 34.3
  }
  dataStore.addAllocation(allocation1)

  const receipt1: LoadingReceipt = {
    id: generateId('REC'),
    applicationId: application1.id,
    allocationId: allocation1.id,
    receiptNo: `HZ${today.replace(/-/g, '')}998`,
    shipId,
    shipName,
    loadingTime: new Date(Date.now() - 79200000).toISOString(),
    operator,
    cabins: [
      { cabinId: 'CABIN-TEST-1-1', cabinName: '前舱', allocatedAmount: 14.5, loadedAmount: 14.3, tankNo: 'T-01', discrepancy: -0.2 },
      { cabinId: 'CABIN-TEST-1-2', cabinName: '中舱', allocatedAmount: 19.8, loadedAmount: 20.1, tankNo: 'T-02', discrepancy: 0.3 }
    ],
    totalLoadedAmount: 34.4,
    status: 'confirmed'
  }
  dataStore.addReceipt(receipt1)

  const unitPrice = 150
  const settlement1: SettlementPreview = {
    id: generateId('SET'),
    applicationId: application1.id,
    shipId,
    shipName,
    receiptId: receipt1.id,
    settlementDate: today,
    cabins: [
      { cabinId: 'CABIN-TEST-1-1', cabinName: '前舱', loadedAmount: 14.3, unitPrice, amount: 14.3 * unitPrice },
      { cabinId: 'CABIN-TEST-1-2', cabinName: '中舱', loadedAmount: 20.1, unitPrice, amount: 20.1 * unitPrice }
    ],
    totalIceAmount: 34.4,
    unitPrice,
    totalAmount: 34.4 * unitPrice
  }
  dataStore.addSettlement(settlement1)

  const cabinRequests2 = [
    { cabinId: 'CABIN-TEST-2-1', cabinName: '后舱', requestedAmount: 12 },
    { cabinId: 'CABIN-TEST-2-2', cabinName: '左舷舱', requestedAmount: 8 }
  ]

  const application2: IceApplication = {
    id: generateId('APP'),
    applicationNo: `SQ${today.replace(/-/g, '')}999`,
    shipId,
    shipName,
    applyTime: new Date(Date.now() - 43200000).toISOString(),
    plannedIceAmount: 20,
    status: 'completed',
    cabinRequests: cabinRequests2
  }
  dataStore.addApplication(application2)

  const allocation2: CabinAllocation = {
    id: generateId('ALLOC'),
    applicationId: application2.id,
    shipId,
    shipName,
    allocationTime: new Date(Date.now() - 39600000).toISOString(),
    operator,
    cabins: [
      { cabinId: 'CABIN-TEST-2-1', cabinName: '后舱', allocatedAmount: 11.8, tankNo: 'T-03', position: 'C区' },
      { cabinId: 'CABIN-TEST-2-2', cabinName: '左舷舱', allocatedAmount: 8.2, tankNo: 'T-04', position: 'D区' }
    ],
    totalAllocatedAmount: 20.0
  }
  dataStore.addAllocation(allocation2)

  const receipt2: LoadingReceipt = {
    id: generateId('REC'),
    applicationId: application2.id,
    allocationId: allocation2.id,
    receiptNo: `HZ${today.replace(/-/g, '')}999`,
    shipId,
    shipName,
    loadingTime: new Date(Date.now() - 36000000).toISOString(),
    operator,
    cabins: [
      { cabinId: 'CABIN-TEST-2-1', cabinName: '后舱', allocatedAmount: 11.8, loadedAmount: 12.0, tankNo: 'T-03', discrepancy: 0.2 },
      { cabinId: 'CABIN-TEST-2-2', cabinName: '左舷舱', allocatedAmount: 8.2, loadedAmount: 8.1, tankNo: 'T-04', discrepancy: -0.1 }
    ],
    totalLoadedAmount: 20.1,
    status: 'confirmed'
  }
  dataStore.addReceipt(receipt2)

  const settlement2: SettlementPreview = {
    id: generateId('SET'),
    applicationId: application2.id,
    shipId,
    shipName,
    receiptId: receipt2.id,
    settlementDate: today,
    cabins: [
      { cabinId: 'CABIN-TEST-2-1', cabinName: '后舱', loadedAmount: 12.0, unitPrice, amount: 12.0 * unitPrice },
      { cabinId: 'CABIN-TEST-2-2', cabinName: '左舷舱', loadedAmount: 8.1, unitPrice, amount: 8.1 * unitPrice }
    ],
    totalIceAmount: 20.1,
    unitPrice,
    totalAmount: 20.1 * unitPrice
  }
  dataStore.addSettlement(settlement2)

  addMockCorrectionRecords()
}

function addMockCorrectionRecords(): void {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const dayBefore = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  const mockRecords: CabinCorrectionRecord[] = [
    {
      id: `CORR-${yesterday.getTime()}-001`,
      correctionTime: new Date(yesterday.getTime() + 9 * 3600000 + 30 * 60000).toISOString(),
      allocationId: 'ALLOC-TEST-001',
      applicationId: 'APP-TEST-001',
      shipId: 'SHIP-0001',
      shipName: '浙渔12345',
      operator: '张调度',
      workGroup: '甲班',
      cabinId: 'CABIN-TEST-1-1',
      cabinName: '前舱',
      oldAmount: 12.5,
      newAmount: 14.5,
      oldTankNo: 'T-01',
      newTankNo: 'T-01',
      reason: '渔船实际需求增加，调整前舱分配量',
      affectedReceipts: ['REC-TEST-001'],
      affectedSettlements: ['SET-TEST-001'],
      warnings: ['舱位 前舱 分配量变更，差值从 0.20 变为 2.20']
    },
    {
      id: `CORR-${yesterday.getTime()}-002`,
      correctionTime: new Date(yesterday.getTime() + 11 * 3600000 + 15 * 60000).toISOString(),
      allocationId: 'ALLOC-TEST-002',
      applicationId: 'APP-TEST-002',
      shipId: 'SHIP-0002',
      shipName: '浙渔67890',
      operator: '李调度',
      workGroup: '乙班',
      cabinId: 'CABIN-TEST-2-1',
      cabinName: '中舱',
      oldAmount: 18.0,
      newAmount: 16.5,
      oldTankNo: 'T-02',
      newTankNo: 'T-03',
      reason: '储罐 T-02 检修，调整至 T-03 并减少分配量',
      affectedReceipts: ['REC-TEST-002', 'REC-TEST-003'],
      affectedSettlements: ['SET-TEST-002'],
      warnings: [
        '舱位 中舱 储罐从 T-02 变更为 T-03',
        '舱位 中舱 分配量变更，差值从 0.50 变为 1.00'
      ]
    },
    {
      id: `CORR-${yesterday.getTime()}-003`,
      correctionTime: new Date(yesterday.getTime() + 14 * 3600000 + 45 * 60000).toISOString(),
      allocationId: 'ALLOC-TEST-003',
      applicationId: 'APP-TEST-003',
      shipId: 'SHIP-0003',
      shipName: '鲁渔11111',
      operator: '王调度',
      workGroup: '丙班',
      cabinId: 'CABIN-TEST-3-1',
      cabinName: '后舱',
      oldAmount: 10.0,
      newAmount: 12.0,
      oldTankNo: 'T-04',
      newTankNo: 'T-04',
      reason: '渔船装载能力超出预期，增加后舱分配量',
      affectedReceipts: ['REC-TEST-004'],
      affectedSettlements: ['SET-TEST-003', 'SET-TEST-004'],
      warnings: [
        '舱位 后舱 分配量超过原计划的 20%',
        '舱位 后舱 分配量变更，差值从 0.30 变为 2.30'
      ]
    },
    {
      id: `CORR-${now.getTime()}-001`,
      correctionTime: new Date(now.getTime() - 8 * 3600000).toISOString(),
      allocationId: 'ALLOC-TEST-004',
      applicationId: 'APP-TEST-004',
      shipId: 'SHIP-0001',
      shipName: '浙渔12345',
      operator: '张调度',
      workGroup: '甲班',
      cabinId: 'CABIN-TEST-2-2',
      cabinName: '左舷舱',
      oldAmount: 7.5,
      newAmount: 8.2,
      oldTankNo: 'T-04',
      newTankNo: 'T-05',
      reason: '左舷舱实际装载量大于分配量，调整储罐和分配量',
      affectedReceipts: ['REC-TEST-005'],
      affectedSettlements: ['SET-TEST-005'],
      warnings: [
        '舱位 左舷舱 储罐从 T-04 变更为 T-05',
        '舱位 左舷舱 装载量 8.1 吨超过新分配量 8.2 吨'
      ]
    },
    {
      id: `CORR-${now.getTime()}-002`,
      correctionTime: new Date(now.getTime() - 5 * 3600000).toISOString(),
      allocationId: 'ALLOC-TEST-005',
      applicationId: 'APP-TEST-005',
      shipId: 'SHIP-0004',
      shipName: '鲁渔22222',
      operator: '李调度',
      workGroup: '乙班',
      cabinId: 'CABIN-TEST-5-1',
      cabinName: '前舱',
      oldAmount: 15.0,
      newAmount: 14.0,
      oldTankNo: 'T-01',
      newTankNo: 'T-01',
      reason: '前舱结冰严重，减少分配量',
      affectedReceipts: [],
      affectedSettlements: [],
      warnings: ['舱位 前舱 分配量变更，差值从 0.10 变为 0.90']
    },
    {
      id: `CORR-${now.getTime()}-003`,
      correctionTime: new Date(now.getTime() - 2 * 3600000).toISOString(),
      allocationId: 'ALLOC-TEST-006',
      applicationId: 'APP-TEST-006',
      shipId: 'SHIP-0005',
      shipName: '闽渔33333',
      operator: '张调度',
      workGroup: '甲班',
      cabinId: 'CABIN-TEST-6-1',
      cabinName: '中舱',
      oldAmount: 20.0,
      newAmount: 22.5,
      oldTankNo: 'T-02',
      newTankNo: 'T-02',
      reason: '应急加冰需求，临时增加中舱分配量',
      affectedReceipts: ['REC-TEST-006', 'REC-TEST-007'],
      affectedSettlements: ['SET-TEST-006'],
      warnings: [
        '舱位 中舱 分配量超过原计划的 20%',
        '舱位 中舱 分配量变更，差值从 0.00 变为 2.50'
      ]
    },
    {
      id: `CORR-${dayBefore.getTime()}-001`,
      correctionTime: new Date(dayBefore.getTime() + 10 * 3600000).toISOString(),
      allocationId: 'ALLOC-TEST-007',
      applicationId: 'APP-TEST-007',
      shipId: 'SHIP-0002',
      shipName: '浙渔67890',
      operator: '王调度',
      workGroup: '丙班',
      cabinId: 'CABIN-TEST-7-1',
      cabinName: '后舱',
      oldAmount: 8.0,
      newAmount: 9.5,
      oldTankNo: 'T-03',
      newTankNo: 'T-04',
      reason: '储罐调度优化，调整后舱储罐和分配量',
      affectedReceipts: ['REC-TEST-008'],
      affectedSettlements: ['SET-TEST-007'],
      warnings: [
        '舱位 后舱 储罐从 T-03 变更为 T-04',
        '舱位 后舱 分配量变更，差值从 0.20 变为 1.70'
      ]
    }
  ]

  mockRecords.forEach(record => {
    dataStore.addCorrectionRecord(record)
  })
}
