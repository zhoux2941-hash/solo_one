import express from 'express'
import { dataStore } from '../data/store'
import { verificationService } from '../services/verificationService'
import { writebackService } from '../services/writebackService'
import { dailySettlementService } from '../services/dailySettlementService'
import { AllocatedCabin, CabinCorrectionRecord } from '../models/types'

const router = express.Router()

router.get('/applications', (req, res) => {
  const applications = dataStore.getAllApplications()
  res.json({ success: true, data: applications })
})

router.get('/applications/:id', (req, res) => {
  const application = dataStore.getApplication(req.params.id)
  if (!application) {
    return res.status(404).json({ success: false, message: '申请不存在' })
  }
  res.json({ success: true, data: application })
})

router.get('/allocations', (req, res) => {
  const allocations = dataStore.getAllAllocations()
  res.json({ success: true, data: allocations })
})

router.get('/allocations/:id', (req, res) => {
  const allocation = dataStore.getAllocation(req.params.id)
  if (!allocation) {
    return res.status(404).json({ success: false, message: '分配不存在' })
  }
  res.json({ success: true, data: allocation })
})

router.put('/allocations/:id', (req, res) => {
  const allocationId = req.params.id
  const { cabins } = req.body

  const oldAllocation = dataStore.getAllocation(allocationId)
  if (!oldAllocation) {
    return res.status(404).json({ success: false, message: '分配不存在' })
  }

  const verificationResult = verificationService.verifyCabinChange(
    allocationId,
    oldAllocation.cabins,
    cabins
  )

  const totalAllocatedAmount = cabins.reduce((sum: number, c: AllocatedCabin) => sum + c.allocatedAmount, 0)
  
  const updatedAllocation = dataStore.updateAllocation(allocationId, {
    cabins,
    totalAllocatedAmount
  })

  if (verificationResult.affectedReceipts.length > 0) {
    const cabinChanges = new Map<string, number>()
    cabins.forEach((c: AllocatedCabin) => {
      const oldCabin = oldAllocation.cabins.find(oc => oc.cabinId === c.cabinId)
      if (!oldCabin || oldCabin.allocatedAmount !== c.allocatedAmount || oldCabin.tankNo !== c.tankNo) {
        cabinChanges.set(c.cabinId, c.allocatedAmount)
        
        const oldCabinData = oldCabin || { cabinId: c.cabinId, cabinName: c.cabinName, allocatedAmount: 0, tankNo: '', position: '' }
        const correctionRecord: CabinCorrectionRecord = {
          id: `CORR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          correctionTime: new Date().toISOString(),
          allocationId: allocationId,
          applicationId: oldAllocation.applicationId,
          shipId: oldAllocation.shipId,
          shipName: oldAllocation.shipName,
          operator: oldAllocation.operator,
          workGroup: getWorkGroupByOperator(oldAllocation.operator),
          cabinId: c.cabinId,
          cabinName: c.cabinName,
          oldAmount: oldCabinData.allocatedAmount,
          newAmount: c.allocatedAmount,
          oldTankNo: oldCabinData.tankNo,
          newTankNo: c.tankNo,
          reason: verificationResult.warnings.find(w => w.cabinId === c.cabinId)?.message || '舱位调整',
          affectedReceipts: verificationResult.affectedReceipts,
          affectedSettlements: verificationResult.affectedSettlements,
          warnings: verificationResult.warnings.filter(w => w.cabinId === c.cabinId).map(w => w.message)
        }
        dataStore.addCorrectionRecord(correctionRecord)
      }
    })
    writebackService.updateAffectedReceipts(allocationId, cabinChanges)
    writebackService.updateAffectedSettlements(verificationResult.affectedReceipts)
  }

  writebackService.writebackAllocationToApplication(allocationId)

  res.json({
    success: true,
    data: updatedAllocation,
    verification: verificationResult
  })
})

function getWorkGroupByOperator(operator: string): string {
  const groupMap: Record<string, string> = {
    '张调度': '甲班',
    '李调度': '乙班',
    '王调度': '丙班'
  }
  return groupMap[operator] || '甲班'
}

router.get('/receipts', (req, res) => {
  const receipts = dataStore.getAllReceipts()
  res.json({ success: true, data: receipts })
})

router.get('/receipts/:id', (req, res) => {
  const receipt = dataStore.getReceipt(req.params.id)
  if (!receipt) {
    return res.status(404).json({ success: false, message: '回单不存在' })
  }
  res.json({ success: true, data: receipt })
})

router.get('/settlements', (req, res) => {
  const settlements = dataStore.getAllSettlements()
  res.json({ success: true, data: settlements })
})

router.get('/settlements/:id', (req, res) => {
  const settlement = dataStore.getSettlement(req.params.id)
  if (!settlement) {
    return res.status(404).json({ success: false, message: '结算不存在' })
  }
  res.json({ success: true, data: settlement })
})

router.post('/verify/cabin-change', (req, res) => {
  const { allocationId, oldCabins, newCabins } = req.body
  
  const verificationResult = verificationService.verifyCabinChange(
    allocationId,
    oldCabins,
    newCabins
  )

  res.json({ success: true, data: verificationResult })
})

router.get('/daily-settlement', (req, res) => {
  const date = req.query.date as string || new Date().toISOString().split('T')[0]
  const dailySettlement = dailySettlementService.getDailySettlement(date)
  res.json({ success: true, data: dailySettlement })
})

router.get('/daily-settlement/summary', (req, res) => {
  const date = req.query.date as string || new Date().toISOString().split('T')[0]
  const summary = dailySettlementService.getSettlementSummary(date)
  res.json({ success: true, data: summary })
})

router.get('/daily-settlement/export', (req, res) => {
  const date = req.query.date as string || new Date().toISOString().split('T')[0]
  const exportData = dailySettlementService.exportDailySettlement(date)
  res.json({ success: true, data: exportData })
})

router.get('/merged-data', (req, res) => {
  const applications = dataStore.getAllApplications()
  const allocations = dataStore.getAllAllocations()
  const receipts = dataStore.getAllReceipts()
  const settlements = dataStore.getAllSettlements()

  const mergedData = applications.map(app => {
    const appAllocations = allocations.filter(a => a.applicationId === app.id)
    
    const batches = appAllocations.map(allocation => {
      const batchReceipts = receipts.filter(r => r.allocationId === allocation.id)
      const batchSettlementIds = batchReceipts.flatMap(r => 
        settlements.filter(s => s.receiptId === r.id).map(s => s.id)
      )
      const batchSettlements = settlements.filter(s => batchSettlementIds.includes(s.id))
      
      return {
        batchId: allocation.id,
        batchNo: `批次${appAllocations.indexOf(allocation) + 1}`,
        allocation,
        receipts: batchReceipts,
        settlements: batchSettlements
      }
    })

    return {
      application: app,
      batches
    }
  })

  res.json({ success: true, data: mergedData })
})

router.get('/correction-records', (req, res) => {
  const { shipId, workGroup, days = '2' } = req.query
  
  let records: CabinCorrectionRecord[]
  
  if (shipId) {
    records = dataStore.getCorrectionRecordsByShip(shipId as string)
  } else if (workGroup) {
    records = dataStore.getCorrectionRecordsByWorkGroup(workGroup as string)
  } else {
    const endTime = new Date().toISOString()
    const startTime = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000).toISOString()
    records = dataStore.getCorrectionRecordsByTimeRange(startTime, endTime)
  }

  res.json({ success: true, data: records })
})

router.get('/correction-records/timeline', (req, res) => {
  const days = parseInt((req.query.days as string) || '2')
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000)
  
  const records = dataStore.getCorrectionRecordsByTimeRange(
    startTime.toISOString(),
    endTime.toISOString()
  )

  const groupedByDate: Record<string, CabinCorrectionRecord[]> = {}
  records.forEach(record => {
    const date = record.correctionTime.split('T')[0]
    if (!groupedByDate[date]) {
      groupedByDate[date] = []
    }
    groupedByDate[date].push(record)
  })

  const timeline = Object.entries(groupedByDate).map(([date, items]) => ({
    date,
    records: items,
    totalCorrections: items.length,
    affectedReceipts: new Set(items.flatMap(r => r.affectedReceipts)).size,
    affectedSettlements: new Set(items.flatMap(r => r.affectedSettlements)).size
  })).sort((a, b) => b.date.localeCompare(a.date))

  res.json({ success: true, data: timeline })
})

export default router
