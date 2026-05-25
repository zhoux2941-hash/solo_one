import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  WashRecord,
  VehicleStatusInfo,
  AnomalyRecord,
  ShiftSummary,
  VehicleStatus,
  AnomalyType,
} from '../types';

interface StoreData {
  washRecords: WashRecord[];
  vehicleStatusMap: Record<string, VehicleStatusInfo>;
  anomalyRecords: AnomalyRecord[];
  shiftSummaries: ShiftSummary[];
  lastPersistTime: number;
}

const STORAGE_FILE = path.join(process.cwd(), 'data', 'archive-store.json');

class ArchiveStore {
  private data: StoreData;
  private persistTimer: NodeJS.Timeout | null = null;
  private persistInterval: number = 5000;

  constructor() {
    this.data = this.loadFromStorage();
    this.startAutoPersist();
  }

  private loadFromStorage(): StoreData {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load storage, using empty store:', e);
    }
    return {
      washRecords: [],
      vehicleStatusMap: {},
      anomalyRecords: [],
      shiftSummaries: [],
      lastPersistTime: Date.now(),
    };
  }

  private persistToStorage(): void {
    try {
      const dir = path.dirname(STORAGE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.data.lastPersistTime = Date.now();
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist storage:', e);
    }
  }

  private startAutoPersist(): void {
    this.persistTimer = setInterval(() => {
      this.persistToStorage();
    }, this.persistInterval);
  }

  public stopAutoPersist(): void {
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
      this.persistTimer = null;
    }
  }

  public forcePersist(): void {
    this.persistToStorage();
  }

  public addWashRecord(record: Omit<WashRecord, 'id'>): WashRecord {
    const newRecord: WashRecord = {
      ...record,
      id: uuidv4(),
    };
    this.data.washRecords.push(newRecord);
    return newRecord;
  }

  public getWashRecordsByPlate(plateNumber: string): WashRecord[] {
    return this.data.washRecords
      .filter((r) => r.plateNumber === plateNumber)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  public getWashRecordsByChain(chainId: string): WashRecord[] {
    return this.data.washRecords
      .filter((r) => r.chainId === chainId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  public getWashRecordsByTimeRange(startTime: number, endTime: number): WashRecord[] {
    return this.data.washRecords.filter(
      (r) => r.timestamp >= startTime && r.timestamp <= endTime
    );
  }

  public getAllWashRecords(): WashRecord[] {
    return [...this.data.washRecords];
  }

  public getVehicleStatus(plateNumber: string): VehicleStatusInfo | null {
    return this.data.vehicleStatusMap[plateNumber] || null;
  }

  public getAllVehicleStatuses(): VehicleStatusInfo[] {
    return Object.values(this.data.vehicleStatusMap);
  }

  public upsertVehicleStatus(status: VehicleStatusInfo): void {
    this.data.vehicleStatusMap[status.plateNumber] = status;
  }

  public getOrCreateVehicleStatus(plateNumber: string): VehicleStatusInfo {
    if (!this.data.vehicleStatusMap[plateNumber]) {
      this.data.vehicleStatusMap[plateNumber] = {
        plateNumber,
        currentStatus: VehicleStatus.WAITING_ENTRY,
        currentChainId: null,
        lastUpdateTime: Date.now(),
        lastAnomaly: null,
        stageTimestamps: {},
      };
    }
    return this.data.vehicleStatusMap[plateNumber];
  }

  public addAnomalyRecord(
    anomaly: Omit<AnomalyRecord, 'id' | 'resolved' | 'timestamp'> & { timestamp?: number }
  ): AnomalyRecord {
    const newAnomaly: AnomalyRecord = {
      ...anomaly,
      id: uuidv4(),
      resolved: false,
      timestamp: anomaly.timestamp || Date.now(),
    };
    this.data.anomalyRecords.push(newAnomaly);

    const status = this.getOrCreateVehicleStatus(anomaly.plateNumber);
    status.lastAnomaly = newAnomaly;
    status.lastUpdateTime = Date.now();
    this.upsertVehicleStatus(status);

    return newAnomaly;
  }

  public getAnomalyRecordsByPlate(plateNumber: string): AnomalyRecord[] {
    return this.data.anomalyRecords
      .filter((a) => a.plateNumber === plateNumber)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  public getAnomalyRecordsByTimeRange(startTime: number, endTime: number): AnomalyRecord[] {
    return this.data.anomalyRecords.filter(
      (a) => a.timestamp >= startTime && a.timestamp <= endTime
    );
  }

  public getUnresolvedAnomalies(): AnomalyRecord[] {
    return this.data.anomalyRecords.filter((a) => !a.resolved);
  }

  public resolveAnomaly(
    anomalyId: string,
    resolvedBy: string,
    resolution: string
  ): AnomalyRecord | null {
    const anomaly = this.data.anomalyRecords.find((a) => a.id === anomalyId);
    if (anomaly) {
      anomaly.resolved = true;
      anomaly.resolvedTime = Date.now();
      anomaly.resolvedBy = resolvedBy;
      anomaly.resolution = resolution;
      return anomaly;
    }
    return null;
  }

  public addShiftSummary(
    summary: Omit<ShiftSummary, 'id' | 'generatedAt' | 'anomalyCounts'> & {
      anomalyCounts?: Partial<Record<AnomalyType, number>>;
    }
  ): ShiftSummary {
    const defaultAnomalyCounts: Record<AnomalyType, number> = {
      [AnomalyType.WASH_TIMEOUT]: 0,
      [AnomalyType.SAMPLING_FAILED]: 0,
      [AnomalyType.RECORD_MISSING]: 0,
      [AnomalyType.ABNORMAL_CHECK]: 0,
      [AnomalyType.OTHER]: 0,
    };

    const newSummary: ShiftSummary = {
      ...summary,
      id: uuidv4(),
      generatedAt: Date.now(),
      anomalyCounts: {
        ...defaultAnomalyCounts,
        ...(summary.anomalyCounts || {}),
      },
    };
    this.data.shiftSummaries.push(newSummary);
    return newSummary;
  }

  public getShiftSummariesByTimeRange(startTime: number, endTime: number): ShiftSummary[] {
    return this.data.shiftSummaries
      .filter((s) => s.startTime >= startTime && s.endTime <= endTime)
      .sort((a, b) => a.startTime - b.startTime);
  }

  public getLatestShiftSummary(): ShiftSummary | null {
    if (this.data.shiftSummaries.length === 0) return null;
    return this.data.shiftSummaries.reduce((latest, current) =>
      current.generatedAt > latest.generatedAt ? current : latest
    );
  }

  public clearAll(): void {
    this.data = {
      washRecords: [],
      vehicleStatusMap: {},
      anomalyRecords: [],
      shiftSummaries: [],
      lastPersistTime: Date.now(),
    };
    this.persistToStorage();
  }
}

export const archiveStore = new ArchiveStore();
