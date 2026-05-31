import type { OrderRecord, AnomalyRecord, AnomalyAction } from '@/types';
import { DATA_CLEANING_CONFIG } from '@/config';

export class DataCleaner {
  private maxQuantity: number;

  constructor(maxQuantity?: number) {
    this.maxQuantity = maxQuantity ?? DATA_CLEANING_CONFIG.maxQuantityPerOrder;
  }

  detectAnomalies(records: OrderRecord[]): AnomalyRecord[] {
    const anomalies: AnomalyRecord[] = [];
    const dishQuantities = this.calculateDishAverageQuantities(records);

    records.forEach((record, index) => {
      const anomaly = this.checkRecord(record, index, dishQuantities);
      if (anomaly) {
        anomalies.push(anomaly);
      }
    });

    return anomalies;
  }

  private calculateDishAverageQuantities(records: OrderRecord[]): Map<string, number> {
    const dishStats = new Map<string, { total: number; count: number }>();

    records.forEach((record) => {
      if (record.quantity > 0 && record.quantity <= this.maxQuantity) {
        const stat = dishStats.get(record.dishName) || { total: 0, count: 0 };
        stat.total += record.quantity;
        stat.count += 1;
        dishStats.set(record.dishName, stat);
      }
    });

    const averages = new Map<string, number>();
    dishStats.forEach((stat, dishName) => {
      averages.set(dishName, stat.count > 0 ? Math.round(stat.total / stat.count) : 1);
    });

    return averages;
  }

  private checkRecord(
    record: OrderRecord,
    index: number,
    dishAverages: Map<string, number>
  ): AnomalyRecord | null {
    const avgQuantity = dishAverages.get(record.dishName) || 1;

    if (record.quantity < 0) {
      return {
        id: `anomaly-${index}`,
        rowIndex: index + 2,
        type: 'quantity_negative',
        dishName: record.dishName,
        originalValue: record.quantity,
        expectedValue: avgQuantity,
        message: `份数为负数 (${record.quantity})`,
        record: { ...record, originalQuantity: record.quantity },
        action: 'pending',
      };
    }

    if (record.quantity > this.maxQuantity) {
      return {
        id: `anomaly-${index}`,
        rowIndex: index + 2,
        type: 'quantity_too_high',
        dishName: record.dishName,
        originalValue: record.quantity,
        expectedValue: avgQuantity,
        message: `份数异常高 (${record.quantity} > ${this.maxQuantity})`,
        record: { ...record, originalQuantity: record.quantity },
        action: 'pending',
      };
    }

    return null;
  }

  applyAction(
    anomalies: AnomalyRecord[],
    actions: Map<string, AnomalyAction>,
    allRecords: OrderRecord[]
  ): {
    cleanedRecords: OrderRecord[];
    fixedCount: number;
    deletedCount: number;
  } {
    const anomalyMap = new Map(anomalies.map((a) => [a.id, a]));
    const cleanedRecords: OrderRecord[] = [];
    let fixedCount = 0;
    let deletedCount = 0;

    allRecords.forEach((record, originalIndex) => {
      const anomalyId = `anomaly-${originalIndex}`;
      const anomaly = anomalyMap.get(anomalyId);
      const action = actions.get(anomalyId);

      if (!anomaly || !action) {
        cleanedRecords.push(record);
        return;
      }

      switch (action) {
        case 'fix':
          const fixedRecord = {
            ...record,
            quantity: anomaly.expectedValue,
            originalQuantity: anomaly.originalValue,
          };
          cleanedRecords.push(fixedRecord);
          fixedCount++;
          break;
        case 'delete':
          deletedCount++;
          break;
        case 'keep':
          cleanedRecords.push(record);
          break;
      }
    });

    return { cleanedRecords, fixedCount, deletedCount };
  }

  getDishAverage(records: OrderRecord[], dishName: string): number {
    const dishRecords = records.filter(
      (r) => r.dishName === dishName && r.quantity > 0 && r.quantity <= this.maxQuantity
    );
    if (dishRecords.length === 0) return 1;
    const total = dishRecords.reduce((sum, r) => sum + r.quantity, 0);
    return Math.round(total / dishRecords.length);
  }
}

export const dataCleaner = new DataCleaner();

export function applyBatchAction(
  anomalies: AnomalyRecord[],
  action: AnomalyAction
): Map<string, AnomalyAction> {
  const actions = new Map<string, AnomalyAction>();
  anomalies.forEach((anomaly) => {
    actions.set(anomaly.id, action);
  });
  return actions;
}
