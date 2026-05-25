import { CronJob } from 'cron';
import {
  RecordType,
  VehicleStatus,
  AnomalyType,
  ShiftSummary,
  AnomalyRecord,
  WashRecord,
} from '../types';
import { archiveStore } from '../store';
import { washArchiveService } from './WashArchiveService';

const RECORD_TYPE_ORDER: RecordType[] = [
  RecordType.ENTRY_REGISTRATION,
  RecordType.WASH_COMPLETION,
  RecordType.SAMPLING_REVIEW,
  RecordType.EXIT_RELEASE,
];

const STAGE_TIMEOUTS: Partial<Record<RecordType, number>> = {
  [RecordType.ENTRY_REGISTRATION]: 2 * 60 * 60 * 1000,
  [RecordType.WASH_COMPLETION]: 1 * 60 * 60 * 1000,
  [RecordType.SAMPLING_REVIEW]: 30 * 60 * 1000,
};

interface MissingRecord {
  plateNumber: string;
  chainId: string;
  missingType: RecordType;
  lastRecordType: RecordType;
  lastRecordTime: number;
  timeoutMs: number;
}

export class BackgroundTaskService {
  private record补拉Job: CronJob | null = null;
  private shiftSummaryJob: CronJob | null = null;
  private isRunning: boolean = false;

  constructor() {}

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.record补拉Job = new CronJob(
      '*/5 * * * *',
      () => {
        this.runRecord补拉Task();
      },
      null,
      true,
      'Asia/Shanghai'
    );

    this.shiftSummaryJob = new CronJob(
      '0 0 8,16,0 * * *',
      () => {
        this.runShiftSummaryTask();
      },
      null,
      true,
      'Asia/Shanghai'
    );

    console.log('[BackgroundTaskService] 后台任务已启动');
    console.log('[BackgroundTaskService] 记录补拉任务：每5分钟执行一次');
    console.log('[BackgroundTaskService] 交班摘要任务：每天8:00、16:00、0:00执行');
  }

  public stop(): void {
    if (this.record补拉Job) {
      this.record补拉Job.stop();
      this.record补拉Job = null;
    }
    if (this.shiftSummaryJob) {
      this.shiftSummaryJob.stop();
      this.shiftSummaryJob = null;
    }
    this.isRunning = false;
    console.log('[BackgroundTaskService] 后台任务已停止');
  }

  public async runRecord补拉Task(): Promise<{
    foundMissing: number;
    anomaliesCreated: number;
  }> {
    console.log('[Record补拉Task] 开始执行记录补拉任务...');
    const now = Date.now();

    const allStatuses = archiveStore.getAllVehicleStatuses();
    const activeChains = allStatuses.filter(
      (s) =>
        s.currentChainId !== null &&
        s.currentStatus !== VehicleStatus.EXITED &&
        s.currentStatus !== VehicleStatus.ABNORMAL
    );

    const missingRecords: MissingRecord[] = [];

    for (const status of activeChains) {
      if (!status.currentChainId) continue;

      const records = archiveStore.getWashRecordsByChain(status.currentChainId);
      if (records.length === 0) continue;

      const lastRecord = records[records.length - 1];
      const lastRecordIdx = RECORD_TYPE_ORDER.indexOf(lastRecord.recordType);

      for (let i = lastRecordIdx + 1; i < RECORD_TYPE_ORDER.length; i++) {
        const expectedType = RECORD_TYPE_ORDER[i];
        const hasRecord = records.some((r) => r.recordType === expectedType);

        if (!hasRecord) {
          const timeoutMs = STAGE_TIMEOUTS[lastRecord.recordType] || 60 * 60 * 1000;
          const elapsed = now - lastRecord.timestamp;

          if (elapsed > timeoutMs) {
            missingRecords.push({
              plateNumber: status.plateNumber,
              chainId: status.currentChainId,
              missingType: expectedType,
              lastRecordType: lastRecord.recordType,
              lastRecordTime: lastRecord.timestamp,
              timeoutMs,
            });
          }
          break;
        }
      }
    }

    let anomaliesCreated = 0;
    for (const missing of missingRecords) {
      const existingAnomalies = archiveStore
        .getAnomalyRecordsByPlate(missing.plateNumber)
        .filter(
          (a) =>
            a.chainId === missing.chainId &&
            a.anomalyType === AnomalyType.RECORD_MISSING &&
            !a.resolved
        );

      if (existingAnomalies.length === 0) {
        washArchiveService.addAnomaly(
          missing.plateNumber,
          AnomalyType.RECORD_MISSING,
          `记录缺失：自 ${new Date(missing.lastRecordTime).toLocaleString()} 完成 ${missing.lastRecordType} 后，` +
            `超过 ${Math.floor(missing.timeoutMs / 60000)} 分钟未记录 ${missing.missingType}`,
          missing.chainId
        );
        anomaliesCreated++;
        console.log(
          `[Record补拉Task] 车辆 ${missing.plateNumber} 检测到缺失记录 ${missing.missingType}，已创建异常`
        );
      }
    }

    console.log(
      `[Record补拉Task] 任务完成：检测到 ${missingRecords.length} 个缺失记录，创建 ${anomaliesCreated} 个异常`
    );

    return {
      foundMissing: missingRecords.length,
      anomaliesCreated,
    };
  }

  public async runShiftSummaryTask(
    customTimeRange?: { startTime: number; endTime: number; shiftName: string }
  ): Promise<ShiftSummary | null> {
    console.log('[ShiftSummaryTask] 开始执行交班摘要任务...');
    const now = Date.now();

    let startTime: number;
    let endTime: number;
    let shiftName: string;
    let shiftId: string;

    if (customTimeRange) {
      startTime = customTimeRange.startTime;
      endTime = customTimeRange.endTime;
      shiftName = customTimeRange.shiftName;
      shiftId = `SHIFT_${startTime}_${endTime}`;
    } else {
      const shiftInfo = this.getCurrentShiftInfo(now);
      startTime = shiftInfo.startTime;
      endTime = shiftInfo.endTime;
      shiftName = shiftInfo.shiftName;
      shiftId = shiftInfo.shiftId;
    }

    const existingSummary = archiveStore.getShiftSummariesByTimeRange(startTime, endTime);
    if (existingSummary.length > 0 && !customTimeRange) {
      console.log('[ShiftSummaryTask] 该时段交班摘要已存在，跳过生成');
      return existingSummary[existingSummary.length - 1];
    }

    const recordsInShift = archiveStore.getWashRecordsByTimeRange(startTime, endTime);
    const anomaliesInShift = archiveStore.getAnomalyRecordsByTimeRange(startTime, endTime);

    const entryRecords = recordsInShift.filter(
      (r) => r.recordType === RecordType.ENTRY_REGISTRATION
    );
    const exitRecords = recordsInShift.filter(
      (r) => r.recordType === RecordType.EXIT_RELEASE
    );

    const uniqueChains = [...new Set(entryRecords.map((r) => r.chainId))];
    const completedChains = [...new Set(exitRecords.map((r) => r.chainId))];

    const abnormalChains = new Set(
      anomaliesInShift
        .filter((a) => a.timestamp >= startTime && a.timestamp <= endTime)
        .map((a) => a.chainId || `anomaly-${a.id}`)
    );

    const anomalyCounts = anomaliesInShift.reduce(
      (acc, a) => {
        acc[a.anomalyType] = (acc[a.anomalyType] || 0) + 1;
        return acc;
      },
      {} as Record<AnomalyType, number>
    );

    const operatorStats = recordsInShift.reduce(
      (acc, r) => {
        acc[r.operator] = (acc[r.operator] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const pendingRecords = this.countPendingRecords(startTime, endTime);

    const summary = archiveStore.addShiftSummary({
      shiftId,
      shiftName,
      startTime,
      endTime,
      totalVehicles: uniqueChains.length,
      completedVehicles: completedChains.length,
      abnormalVehicles: abnormalChains.size,
      anomalyCounts,
      pendingRecords,
      operatorStats,
      remarks: `自动生成于 ${new Date(now).toLocaleString()}`,
    });

    console.log(
      `[ShiftSummaryTask] 交班摘要生成完成：${shiftName}，共 ${uniqueChains.length} 条链路，完成 ${completedChains.length} 条，异常 ${abnormalChains.size} 条`
    );

    return summary;
  }

  private getCurrentShiftInfo(now: number): {
    shiftId: string;
    shiftName: string;
    startTime: number;
    endTime: number;
  } {
    const date = new Date(now);
    const hour = date.getHours();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    let shiftName: string;
    let startHour: number;
    let endHour: number;
    let dayOffset = 0;

    if (hour >= 8 && hour < 16) {
      shiftName = '白班';
      startHour = 8;
      endHour = 16;
    } else if (hour >= 16 && hour < 24) {
      shiftName = '中班';
      startHour = 16;
      endHour = 24;
    } else {
      shiftName = '夜班';
      startHour = 0;
      endHour = 8;
      dayOffset = hour < 8 ? -1 : 0;
    }

    const startDate = new Date(year, date.getMonth(), date.getDate() + dayOffset, startHour);
    const endDate = new Date(year, date.getMonth(), date.getDate() + dayOffset, endHour);

    return {
      shiftId: `SHIFT_${year}${month}${day}_${shiftName}`,
      shiftName,
      startTime: startDate.getTime(),
      endTime: endDate.getTime(),
    };
  }

  private countPendingRecords(startTime: number, endTime: number): number {
    const statuses = archiveStore.getAllVehicleStatuses();
    let pending = 0;

    for (const status of statuses) {
      if (!status.currentChainId) continue;

      const records = archiveStore.getWashRecordsByChain(status.currentChainId);
      if (records.length === 0) continue;

      const firstRecord = records[0];
      if (firstRecord.timestamp < startTime || firstRecord.timestamp > endTime) continue;

      const hasExit = records.some((r) => r.recordType === RecordType.EXIT_RELEASE);
      if (!hasExit && status.currentStatus !== VehicleStatus.ABNORMAL) {
        pending++;
      }
    }

    return pending;
  }

  public getActiveChains(): {
    plateNumber: string;
    chainId: string;
    currentStatus: VehicleStatus;
    lastUpdateTime: number;
    records: WashRecord[];
    anomalies: AnomalyRecord[];
  }[] {
    const statuses = archiveStore.getAllVehicleStatuses();
    return statuses
      .filter(
        (s) =>
          s.currentChainId !== null &&
          s.currentStatus !== VehicleStatus.EXITED
      )
      .map((s) => {
        const records = archiveStore.getWashRecordsByChain(s.currentChainId!);
        const anomalies = archiveStore
          .getAnomalyRecordsByPlate(s.plateNumber)
          .filter((a) => a.chainId === s.currentChainId);
        return {
          plateNumber: s.plateNumber,
          chainId: s.currentChainId!,
          currentStatus: s.currentStatus,
          lastUpdateTime: s.lastUpdateTime,
          records,
          anomalies,
        };
      });
  }
}

export const backgroundTaskService = new BackgroundTaskService();
