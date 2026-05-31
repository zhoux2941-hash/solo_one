import { GarbageRecord, GarbageType, TypeStats, BuildingStats, GARBAGE_TYPE_CONFIG, DateRange } from '../types';
import { isDateInRange } from './dateUtils';

export function filterRecordsByDateRange(
  records: GarbageRecord[],
  dateRange: DateRange
): GarbageRecord[] {
  return records.filter((record) =>
    isDateInRange(record.投放时间, dateRange.start, dateRange.end)
  );
}

export function calculateTypeStats(records: GarbageRecord[]): TypeStats[] {
  const typeMap = new Map<GarbageType, { total: number; correct: number }>();

  const garbageTypes: GarbageType[] = ['recyclable', 'kitchen', 'harmful', 'other'];
  garbageTypes.forEach((type) => {
    typeMap.set(type, { total: 0, correct: 0 });
  });

  records.forEach((record) => {
    const stats = typeMap.get(record.garbageType);
    if (stats) {
      stats.total++;
      if (record.isCorrect) {
        stats.correct++;
      }
    }
  });

  return garbageTypes.map((type) => {
    const stats = typeMap.get(type)!;
    const config = GARBAGE_TYPE_CONFIG[type];
    return {
      type,
      typeName: config.name,
      total: stats.total,
      correct: stats.correct,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      color: config.color,
    };
  });
}

export function calculateBuildingStats(records: GarbageRecord[]): BuildingStats[] {
  const buildingMap = new Map<string, { total: number; correct: number }>();

  records.forEach((record) => {
    const stats = buildingMap.get(record.buildingNumber);
    if (stats) {
      stats.total++;
      if (record.isCorrect) {
        stats.correct++;
      }
    } else {
      buildingMap.set(record.buildingNumber, {
        total: 1,
        correct: record.isCorrect ? 1 : 0,
      });
    }
  });

  const result: BuildingStats[] = [];
  buildingMap.forEach((stats, buildingNumber) => {
    result.push({
      buildingNumber,
      total: stats.total,
      correct: stats.correct,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    });
  });

  return result;
}

export const MIN_SAMPLE_THRESHOLD = 10;

export function getLowestAccuracyBuildings(
  buildingStats: BuildingStats[],
  topN: number = 5,
  minSample: number = MIN_SAMPLE_THRESHOLD
): BuildingStats[] {
  return [...buildingStats]
    .filter((s) => s.total >= minSample)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, topN);
}

export function getInsufficientSampleBuildings(
  buildingStats: BuildingStats[],
  minSample: number = MIN_SAMPLE_THRESHOLD
): BuildingStats[] {
  return [...buildingStats]
    .filter((s) => s.total < minSample)
    .sort((a, b) => a.total - b.total);
}

export function getTotalStats(records: GarbageRecord[]): {
  total: number;
  correct: number;
  accuracy: number;
} {
  const total = records.length;
  const correct = records.filter((r) => r.isCorrect).length;
  return {
    total,
    correct,
    accuracy: total > 0 ? (correct / total) * 100 : 0,
  };
}
