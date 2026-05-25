import { CabinAllocation, LoadingReceipt, SettlementPreview } from '../models/types'
import { dataStore } from '../data/store'

export class AmountWritebackService {
  writebackAllocationToApplication(allocationId: string): void {
    const allocation = dataStore.getAllocation(allocationId)
    if (!allocation) return

    const application = dataStore.getApplication(allocation.applicationId)
    if (!application) return

    const totalAllocated = allocation.cabins.reduce((sum, c) => sum + c.allocatedAmount, 0)
    
    dataStore.updateApplication(allocation.applicationId, {
      status: 'allocated',
      cabinRequests: application.cabinRequests.map(req => {
        const allocated = allocation.cabins.find(c => c.cabinId === req.cabinId)
        return {
          ...req,
          requestedAmount: allocated ? allocated.allocatedAmount : req.requestedAmount
        }
      })
    })
  }

  writebackReceiptToAllocation(receiptId: string): void {
    const receipt = dataStore.getReceipt(receiptId)
    if (!receipt) return

    const allocation = dataStore.getAllocation(receipt.allocationId)
    if (!allocation) return

    const updatedCabins = allocation.cabins.map(cabin => {
      const loaded = receipt.cabins.find(c => c.cabinId === cabin.cabinId)
      return cabin
    })

    dataStore.updateAllocation(receipt.allocationId, {
      cabins: updatedCabins
    })
  }

  writebackReceiptToApplication(receiptId: string): void {
    const receipt = dataStore.getReceipt(receiptId)
    if (!receipt) return

    const application = dataStore.getApplication(receipt.applicationId)
    if (!application) return

    dataStore.updateApplication(receipt.applicationId, {
      status: 'completed'
    })
  }

  recalculateSettlement(receiptId: string, unitPrice: number = 150): SettlementPreview | null {
    const receipt = dataStore.getReceipt(receiptId)
    if (!receipt) return null

    const existingSettlements = dataStore.getSettlementsByReceipt(receiptId)
    const totalIceAmount = receipt.cabins.reduce((sum, c) => sum + c.loadedAmount, 0)
    const totalAmount = totalIceAmount * unitPrice

    const settlementCabins = receipt.cabins.map(c => ({
      cabinId: c.cabinId,
      cabinName: c.cabinName,
      loadedAmount: c.loadedAmount,
      unitPrice,
      amount: c.loadedAmount * unitPrice
    }))

    if (existingSettlements.length > 0) {
      const settlement = existingSettlements[0]
      return dataStore.updateSettlement(settlement.id, {
        cabins: settlementCabins,
        totalIceAmount,
        totalAmount,
        unitPrice
      }) || null
    }

    const newSettlement: SettlementPreview = {
      id: `SET-${Date.now()}`,
      applicationId: receipt.applicationId,
      shipId: receipt.shipId,
      shipName: receipt.shipName,
      receiptId: receipt.id,
      settlementDate: new Date().toISOString().split('T')[0],
      cabins: settlementCabins,
      totalIceAmount,
      unitPrice,
      totalAmount
    }

    dataStore.addSettlement(newSettlement)
    return newSettlement
  }

  updateAffectedReceipts(allocationId: string, cabinChanges: Map<string, number>): string[] {
    const receipts = dataStore.getReceiptsByAllocation(allocationId)
    const updatedReceiptIds: string[] = []

    receipts.forEach(receipt => {
      const updatedCabins = receipt.cabins.map(cabin => {
        const newAmount = cabinChanges.get(cabin.cabinId)
        if (newAmount !== undefined) {
          return {
            ...cabin,
            allocatedAmount: newAmount,
            discrepancy: cabin.loadedAmount - newAmount,
            isAffected: true
          }
        }
        return cabin
      })

      dataStore.updateReceipt(receipt.id, {
        cabins: updatedCabins,
        totalLoadedAmount: updatedCabins.reduce((sum, c) => sum + c.loadedAmount, 0)
      })
      
      updatedReceiptIds.push(receipt.id)
    })

    return updatedReceiptIds
  }

  updateAffectedSettlements(receiptIds: string[]): string[] {
    const updatedSettlementIds: string[] = []

    receiptIds.forEach(receiptId => {
      const settlements = dataStore.getSettlementsByReceipt(receiptId)
      settlements.forEach(settlement => {
        dataStore.updateSettlement(settlement.id, {
          isAffected: true
        })
        updatedSettlementIds.push(settlement.id)
      })
    })

    return updatedSettlementIds
  }
}

export const writebackService = new AmountWritebackService()
