import { CabinAllocation, LoadingReceipt, VerificationResult, VerificationWarning, AllocatedCabin } from '../models/types'
import { dataStore } from '../data/store'

export class CabinVerificationService {
  verifyCabinChange(allocationId: string, oldCabins: AllocatedCabin[], newCabins: AllocatedCabin[]): VerificationResult {
    const warnings: VerificationWarning[] = []
    const affectedReceipts: string[] = []
    const affectedSettlements: string[] = []
    let hasDiscrepancy = false

    const receipts = dataStore.getReceiptsByAllocation(allocationId)
    
    receipts.forEach(receipt => {
      const receiptAffected = this.checkReceiptImpact(receipt, oldCabins, newCabins, warnings)
      if (receiptAffected) {
        affectedReceipts.push(receipt.id)
        hasDiscrepancy = true
      }
    })

    affectedReceipts.forEach(receiptId => {
      const settlements = dataStore.getSettlementsByReceipt(receiptId)
      settlements.forEach(s => {
        affectedSettlements.push(s.id)
      })
    })

    newCabins.forEach(newCabin => {
      const oldCabin = oldCabins.find(c => c.cabinId === newCabin.cabinId)
      if (oldCabin && newCabin.allocatedAmount > oldCabin.allocatedAmount * 1.2) {
        warnings.push({
          type: 'over_allocation',
          cabinId: newCabin.cabinId,
          cabinName: newCabin.cabinName,
          message: `舱位 ${newCabin.cabinName} 分配量超过原计划的 20%`,
          severity: 'warning'
        })
      }
    })

    return {
      affectedReceipts,
      affectedSettlements,
      warnings,
      hasDiscrepancy
    }
  }

  private checkReceiptImpact(
    receipt: LoadingReceipt,
    oldCabins: AllocatedCabin[],
    newCabins: AllocatedCabin[],
    warnings: VerificationWarning[]
  ): boolean {
    let affected = false

    receipt.cabins.forEach(loadedCabin => {
      const oldAllocation = oldCabins.find(c => c.cabinId === loadedCabin.cabinId)
      const newAllocation = newCabins.find(c => c.cabinId === loadedCabin.cabinId)

      if (!newAllocation && oldAllocation) {
        warnings.push({
          type: 'cabin_mismatch',
          cabinId: loadedCabin.cabinId,
          cabinName: loadedCabin.cabinName,
          message: `舱位 ${loadedCabin.cabinName} 已从分配中移除，但存在装载记录`,
          severity: 'error'
        })
        affected = true
      }

      if (newAllocation && oldAllocation && 
          Math.abs(newAllocation.allocatedAmount - oldAllocation.allocatedAmount) > 0.01) {
        if (loadedCabin.loadedAmount > newAllocation.allocatedAmount) {
          warnings.push({
            type: 'amount_discrepancy',
            cabinId: loadedCabin.cabinId,
            cabinName: loadedCabin.cabinName,
            message: `舱位 ${loadedCabin.cabinName} 装载量 ${loadedCabin.loadedAmount} 吨超过新分配量 ${newAllocation.allocatedAmount} 吨`,
            severity: 'error'
          })
          affected = true
        } else if (Math.abs(newAllocation.allocatedAmount - loadedCabin.loadedAmount) > 
                   Math.abs(oldAllocation.allocatedAmount - loadedCabin.loadedAmount)) {
          warnings.push({
            type: 'amount_discrepancy',
            cabinId: loadedCabin.cabinId,
            cabinName: loadedCabin.cabinName,
            message: `舱位 ${loadedCabin.cabinName} 分配量变更，差值从 ${
              Math.abs(oldAllocation.allocatedAmount - loadedCabin.loadedAmount).toFixed(2)
            } 变为 ${Math.abs(newAllocation.allocatedAmount - loadedCabin.loadedAmount).toFixed(2)}`,
            severity: 'warning'
          })
          affected = true
        }
      }

      if (newAllocation && oldAllocation && newAllocation.tankNo !== oldAllocation.tankNo) {
        warnings.push({
          type: 'cabin_mismatch',
          cabinId: loadedCabin.cabinId,
          cabinName: loadedCabin.cabinName,
          message: `舱位 ${loadedCabin.cabinName} 储罐从 ${oldAllocation.tankNo} 变更为 ${newAllocation.tankNo}`,
          severity: 'warning'
        })
        affected = true
      }
    })

    newCabins.forEach(newCabin => {
      const hasReceipt = receipt.cabins.some(c => c.cabinId === newCabin.cabinId)
      if (!hasReceipt) {
        warnings.push({
          type: 'cabin_mismatch',
          cabinId: newCabin.cabinId,
          cabinName: newCabin.cabinName,
          message: `新增舱位 ${newCabin.cabinName}，无对应装载记录`,
          severity: 'warning'
        })
        affected = true
      }
    })

    return affected
  }

  checkCabinConsistency(allocation: CabinAllocation, receipt: LoadingReceipt): VerificationWarning[] {
    const warnings: VerificationWarning[] = []

    receipt.cabins.forEach(loadedCabin => {
      const allocatedCabin = allocation.cabins.find(c => c.cabinId === loadedCabin.cabinId)
      
      if (!allocatedCabin) {
        warnings.push({
          type: 'cabin_mismatch',
          cabinId: loadedCabin.cabinId,
          cabinName: loadedCabin.cabinName,
          message: `装载舱位 ${loadedCabin.cabinName} 在分配记录中不存在`,
          severity: 'error'
        })
      } else if (loadedCabin.loadedAmount > allocatedCabin.allocatedAmount * 1.05) {
        warnings.push({
          type: 'amount_discrepancy',
          cabinId: loadedCabin.cabinId,
          cabinName: loadedCabin.cabinName,
          message: `舱位 ${loadedCabin.cabinName} 超装 ${
            ((loadedCabin.loadedAmount - allocatedCabin.allocatedAmount) / allocatedCabin.allocatedAmount * 100).toFixed(1)
          }%`,
          severity: 'error'
        })
      }
    })

    allocation.cabins.forEach(allocatedCabin => {
      const loadedCabin = receipt.cabins.find(c => c.cabinId === allocatedCabin.cabinId)
      if (!loadedCabin) {
        warnings.push({
          type: 'cabin_mismatch',
          cabinId: allocatedCabin.cabinId,
          cabinName: allocatedCabin.cabinName,
          message: `分配舱位 ${allocatedCabin.cabinName} 无装载记录`,
          severity: 'warning'
        })
      }
    })

    return warnings
  }
}

export const verificationService = new CabinVerificationService()
