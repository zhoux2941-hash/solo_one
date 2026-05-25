import { v4 as uuidv4 } from 'uuid';
import {
  WashRecord,
  VehicleStatusInfo,
  AnomalyRecord,
  TraceChain,
  RecordType,
  VehicleStatus,
  AnomalyType,
  EntryRegistrationData,
  WashCompletionData,
  SamplingReviewData,
  ExitReleaseData,
} from '../types';
import { archiveStore } from '../store';

const RECORD_TYPE_ORDER: RecordType[] = [
  RecordType.ENTRY_REGISTRATION,
  RecordType.WASH_COMPLETION,
  RecordType.SAMPLING_REVIEW,
  RecordType.EXIT_RELEASE,
];

const STATUS_TRANSITION_MAP: Partial<Record<RecordType, VehicleStatus>> = {
  [RecordType.ENTRY_REGISTRATION]: VehicleStatus.WAITING_WASH,
  [RecordType.WASH_COMPLETION]: VehicleStatus.WAITING_SAMPLING,
  [RecordType.SAMPLING_REVIEW]: VehicleStatus.WAITING_EXIT,
  [RecordType.EXIT_RELEASE]: VehicleStatus.EXITED,
};

export class WashArchiveService {
  public entryRegistration(data: EntryRegistrationData): WashRecord {
    const { plateNumber, operator, remarks, timestamp } = data;
    const status = archiveStore.getOrCreateVehicleStatus(plateNumber);

    if (status.currentChainId) {
      const existingRecords = archiveStore.getWashRecordsByChain(status.currentChainId);
      const hasExitRecord = existingRecords.some(
        (r) => r.recordType === RecordType.EXIT_RELEASE
      );
      if (!hasExitRecord) {
        throw new Error(
          `车辆 ${plateNumber} 存在未完成的洗消流程，请先完成当前流程或处理异常`
        );
      }
    }

    const chainId = uuidv4();
    const record = archiveStore.addWashRecord({
      chainId,
      plateNumber,
      recordType: RecordType.ENTRY_REGISTRATION,
      operator,
      timestamp: timestamp || Date.now(),
      remarks,
      data: {
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        cargoType: data.cargoType,
        hazardLevel: data.hazardLevel,
        expectedWashType: data.expectedWashType,
      },
    });

    status.stageTimestamps = {};
    this.updateVehicleStatus(status, record, chainId);
    return record;
  }

  public washCompletion(data: WashCompletionData): WashRecord {
    const { plateNumber, operator, remarks, timestamp } = data;
    const status = archiveStore.getVehicleStatus(plateNumber);

    if (!status || !status.currentChainId) {
      throw new Error(`车辆 ${plateNumber} 未进行入场登记，请先完成入场登记`);
    }

    this.validateRecordOrder(status, RecordType.WASH_COMPLETION);

    const record = archiveStore.addWashRecord({
      chainId: status.currentChainId,
      plateNumber,
      recordType: RecordType.WASH_COMPLETION,
      operator,
      timestamp: timestamp || Date.now(),
      remarks,
      data: {
        washType: data.washType,
        washDuration: data.washDuration,
        detergent: data.detergent,
        waterTemp: data.waterTemp,
        pressure: data.pressure,
      },
    });

    this.updateVehicleStatus(status, record, status.currentChainId);
    return record;
  }

  public samplingReview(data: SamplingReviewData): WashRecord {
    const { plateNumber, operator, remarks, timestamp, testResult } = data;
    const status = archiveStore.getVehicleStatus(plateNumber);

    if (!status || !status.currentChainId) {
      throw new Error(`车辆 ${plateNumber} 未进行入场登记，请先完成入场登记`);
    }

    this.validateRecordOrder(status, RecordType.SAMPLING_REVIEW);

    let anomalyId: string | undefined;
    if (testResult === 'FAIL') {
      const anomaly = archiveStore.addAnomalyRecord({
        plateNumber,
        chainId: status.currentChainId,
        anomalyType: AnomalyType.SAMPLING_FAILED,
        description: `抽检不合格，检测项目: ${data.testItems.join(', ')}`,
      });
      anomalyId = anomaly.id;
      status.currentStatus = VehicleStatus.ABNORMAL;
    }

    const record = archiveStore.addWashRecord({
      chainId: status.currentChainId,
      plateNumber,
      recordType: RecordType.SAMPLING_REVIEW,
      operator,
      timestamp: timestamp || Date.now(),
      remarks,
      anomalyId,
      data: {
        samplingPoints: data.samplingPoints,
        testItems: data.testItems,
        testResult: data.testResult,
        tester: data.tester,
      },
    });

    if (testResult !== 'FAIL') {
      this.updateVehicleStatus(status, record, status.currentChainId);
    } else {
      status.lastUpdateTime = Date.now();
      archiveStore.upsertVehicleStatus(status);
    }

    return record;
  }

  public exitRelease(data: ExitReleaseData): WashRecord {
    const { plateNumber, operator, remarks, timestamp } = data;
    const status = archiveStore.getVehicleStatus(plateNumber);

    if (!status || !status.currentChainId) {
      throw new Error(`车辆 ${plateNumber} 未进行入场登记，请先完成入场登记`);
    }

    if (status.currentStatus === VehicleStatus.ABNORMAL) {
      throw new Error(`车辆 ${plateNumber} 存在未解决的异常，请先处理异常后再放行`);
    }

    this.validateRecordOrder(status, RecordType.EXIT_RELEASE);

    const record = archiveStore.addWashRecord({
      chainId: status.currentChainId,
      plateNumber,
      recordType: RecordType.EXIT_RELEASE,
      operator,
      timestamp: timestamp || Date.now(),
      remarks,
      data: {
        gateNumber: data.gateNumber,
        destination: data.destination,
      },
    });

    this.updateVehicleStatus(status, record, null);
    return record;
  }

  private validateRecordOrder(status: VehicleStatusInfo, nextRecordType: RecordType): void {
    const existingRecords = status.currentChainId
      ? archiveStore.getWashRecordsByChain(status.currentChainId)
      : [];

    const existingTypes = existingRecords.map((r) => r.recordType);
    const currentIdx = RECORD_TYPE_ORDER.indexOf(nextRecordType);

    for (let i = 0; i < currentIdx; i++) {
      if (!existingTypes.includes(RECORD_TYPE_ORDER[i])) {
        throw new Error(
          `操作顺序错误：在记录 ${nextRecordType} 之前，必须先记录 ${RECORD_TYPE_ORDER[i]}`
        );
      }
    }

    if (existingTypes.includes(nextRecordType)) {
      throw new Error(`该类型记录 ${nextRecordType} 已存在，请勿重复记录`);
    }
  }

  private updateVehicleStatus(
    status: VehicleStatusInfo,
    record: WashRecord,
    newChainId: string | null
  ): void {
    const nextStatus = STATUS_TRANSITION_MAP[record.recordType];
    if (nextStatus) {
      status.currentStatus = nextStatus;
    }
    status.currentChainId = newChainId;
    status.lastUpdateTime = record.timestamp;
    status.stageTimestamps[record.recordType] = record.timestamp;
    archiveStore.upsertVehicleStatus(status);
  }

  public getTraceChain(chainId: string): TraceChain | null {
    const records = archiveStore.getWashRecordsByChain(chainId);
    if (records.length === 0) return null;

    const plateNumber = records[0].plateNumber;
    const anomalies = archiveStore
      .getAnomalyRecordsByPlate(plateNumber)
      .filter((a) => a.chainId === chainId);

    const hasAbnormal = anomalies.some((a) => !a.resolved);
    const hasExit = records.some((r) => r.recordType === RecordType.EXIT_RELEASE);

    const startTime = records[0].timestamp;
    const endTime = hasExit ? records[records.length - 1].timestamp : undefined;

    let status: TraceChain['status'] = 'IN_PROGRESS';
    if (hasAbnormal) {
      status = 'ABNORMAL';
    } else if (hasExit) {
      status = 'COMPLETED';
    }

    return {
      chainId,
      plateNumber,
      records,
      startTime,
      endTime,
      status,
      anomalies,
      durationMs: endTime ? endTime - startTime : undefined,
    };
  }

  public getTraceChainsByPlate(plateNumber: string): TraceChain[] {
    const records = archiveStore.getWashRecordsByPlate(plateNumber);
    const chainIds = [...new Set(records.map((r) => r.chainId))];
    return chainIds
      .map((id) => this.getTraceChain(id))
      .filter((c): c is TraceChain => c !== null)
      .sort((a, b) => b.startTime - a.startTime);
  }

  public addAnomaly(
    plateNumber: string,
    anomalyType: AnomalyType,
    description: string,
    chainId?: string
  ): AnomalyRecord {
    const status = archiveStore.getOrCreateVehicleStatus(plateNumber);
    const actualChainId = chainId || status.currentChainId || undefined;

    const anomaly = archiveStore.addAnomalyRecord({
      plateNumber,
      chainId: actualChainId,
      anomalyType,
      description,
    });

    status.currentStatus = VehicleStatus.ABNORMAL;
    status.lastUpdateTime = Date.now();
    archiveStore.upsertVehicleStatus(status);

    return anomaly;
  }

  public resolveAnomaly(
    anomalyId: string,
    resolvedBy: string,
    resolution: string
  ): AnomalyRecord | null {
    const anomaly = archiveStore.resolveAnomaly(anomalyId, resolvedBy, resolution);
    if (anomaly) {
      const status = archiveStore.getVehicleStatus(anomaly.plateNumber);
      if (status) {
        const unresolvedAnomalies = archiveStore
          .getAnomalyRecordsByPlate(anomaly.plateNumber)
          .filter((a) => !a.resolved);

        if (unresolvedAnomalies.length === 0) {
          const currentChainRecords = status.currentChainId
            ? archiveStore.getWashRecordsByChain(status.currentChainId)
            : [];
          const lastRecord =
            currentChainRecords.length > 0
              ? currentChainRecords[currentChainRecords.length - 1]
              : null;

          if (lastRecord) {
            const nextStatus = STATUS_TRANSITION_MAP[lastRecord.recordType];
            if (nextStatus) {
              status.currentStatus = nextStatus;
            }
          } else {
            status.currentStatus = VehicleStatus.WAITING_ENTRY;
          }
        }

        status.lastUpdateTime = Date.now();
        archiveStore.upsertVehicleStatus(status);
      }
    }
    return anomaly;
  }
}

export const washArchiveService = new WashArchiveService();
