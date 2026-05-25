import { backgroundTaskService } from '../src/services/BackgroundTaskService';
import { washArchiveService } from '../src/services/WashArchiveService';
import { archiveStore } from '../src/store';
import {
  RecordType,
  AnomalyType,
  EntryRegistrationData,
  WashCompletionData,
  SamplingReviewData,
  ExitReleaseData,
} from '../src/types';

describe('BackgroundTaskService - 后台任务测试', () => {
  beforeEach(() => {
    archiveStore.clearAll();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createEntryData = (plate: string): EntryRegistrationData => ({
    plateNumber: plate,
    driverName: '张三',
    driverPhone: '13800138000',
    cargoType: '硫酸',
    hazardLevel: '甲级',
    expectedWashType: '化学洗消',
    operator: '操作员A',
  });

  const createWashData = (plate: string): WashCompletionData => ({
    plateNumber: plate,
    washType: '化学洗消',
    washDuration: 1800,
    detergent: '碱性清洁剂',
    waterTemp: 60,
    pressure: 8,
    operator: '操作员B',
  });

  const createSamplingData = (
    plate: string,
    testResult: 'PASS' | 'FAIL' | 'PENDING' = 'PASS'
  ): SamplingReviewData => ({
    plateNumber: plate,
    samplingPoints: ['罐体前', '罐体中', '罐体后'],
    testItems: ['PH值', '残留浓度', '外观检查'],
    testResult,
    tester: '检测员C',
    operator: '操作员C',
  });

  const createExitData = (plate: string): ExitReleaseData => ({
    plateNumber: plate,
    gateNumber: '1号门',
    destination: '上海化工区',
    operator: '操作员D',
  });

  test('记录补拉任务：检测超时未记录的洗消完成', async () => {
    const plate = '超时车001';
    const now = Date.now();

    const twoHoursAgo = now - 2 * 60 * 60 * 1000 - 1000;
    washArchiveService.entryRegistration({
      ...createEntryData(plate),
      timestamp: twoHoursAgo,
    });

    const beforeStatus = archiveStore.getVehicleStatus(plate)!;
    expect(beforeStatus.currentStatus).not.toBe('ABNORMAL');

    const result = await backgroundTaskService.runRecord补拉Task();
    expect(result.foundMissing).toBe(1);
    expect(result.anomaliesCreated).toBe(1);

    const afterStatus = archiveStore.getVehicleStatus(plate)!;
    expect(afterStatus.currentStatus).toBe('ABNORMAL');
    expect(afterStatus.lastAnomaly).not.toBeNull();
    expect(afterStatus.lastAnomaly!.anomalyType).toBe(AnomalyType.RECORD_MISSING);
  });

  test('记录补拉任务：检测超时未记录的抽检复核', async () => {
    const plate = '超时车002';
    const now = Date.now();

    const entryTime = now - 2 * 60 * 60 * 1000;
    const washTime = now - 1 * 60 * 60 * 1000 - 1000;

    washArchiveService.entryRegistration({
      ...createEntryData(plate),
      timestamp: entryTime,
    });
    washArchiveService.washCompletion({
      ...createWashData(plate),
      timestamp: washTime,
    });

    const result = await backgroundTaskService.runRecord补拉Task();
    expect(result.foundMissing).toBe(1);
    expect(result.anomaliesCreated).toBe(1);

    const anomalies = archiveStore.getAnomalyRecordsByPlate(plate);
    expect(anomalies.length).toBe(1);
    expect(anomalies[0].anomalyType).toBe(AnomalyType.RECORD_MISSING);
    expect(anomalies[0].description).toContain(RecordType.SAMPLING_REVIEW);
  });

  test('记录补拉任务：检测超时未记录的出场放行', async () => {
    const plate = '超时车003';
    const now = Date.now();

    const entryTime = now - 3 * 60 * 60 * 1000;
    const washTime = now - 2 * 60 * 60 * 1000;
    const samplingTime = now - 30 * 60 * 1000 - 1000;

    washArchiveService.entryRegistration({
      ...createEntryData(plate),
      timestamp: entryTime,
    });
    washArchiveService.washCompletion({
      ...createWashData(plate),
      timestamp: washTime,
    });
    washArchiveService.samplingReview({
      ...createSamplingData(plate, 'PASS'),
      timestamp: samplingTime,
    });

    const result = await backgroundTaskService.runRecord补拉Task();
    expect(result.foundMissing).toBe(1);
    expect(result.anomaliesCreated).toBe(1);

    const anomalies = archiveStore.getAnomalyRecordsByPlate(plate);
    expect(anomalies[0].description).toContain(RecordType.EXIT_RELEASE);
  });

  test('记录补拉任务：未超时的记录不触发异常', async () => {
    const plate = '正常车001';
    const now = Date.now();

    const entryTime = now - 30 * 60 * 1000;
    washArchiveService.entryRegistration({
      ...createEntryData(plate),
      timestamp: entryTime,
    });

    const result = await backgroundTaskService.runRecord补拉Task();
    expect(result.foundMissing).toBe(0);
    expect(result.anomaliesCreated).toBe(0);

    const anomalies = archiveStore.getAnomalyRecordsByPlate(plate);
    expect(anomalies.length).toBe(0);
  });

  test('记录补拉任务：已完成流程的车辆不触发异常', async () => {
    const plate = '完成车001';
    const now = Date.now();

    const entryTime = now - 4 * 60 * 60 * 1000;
    const washTime = now - 3 * 60 * 60 * 1000;
    const samplingTime = now - 2 * 60 * 60 * 1000;
    const exitTime = now - 1 * 60 * 60 * 1000;

    washArchiveService.entryRegistration({
      ...createEntryData(plate),
      timestamp: entryTime,
    });
    washArchiveService.washCompletion({
      ...createWashData(plate),
      timestamp: washTime,
    });
    washArchiveService.samplingReview({
      ...createSamplingData(plate, 'PASS'),
      timestamp: samplingTime,
    });
    washArchiveService.exitRelease({
      ...createExitData(plate),
      timestamp: exitTime,
    });

    const result = await backgroundTaskService.runRecord补拉Task();
    expect(result.foundMissing).toBe(0);
    expect(result.anomaliesCreated).toBe(0);
  });

  test('记录补拉任务：已存在异常的不重复创建', async () => {
    const plate = '已异常车001';
    const now = Date.now();

    const twoHoursAgo = now - 2 * 60 * 60 * 1000 - 1000;
    washArchiveService.entryRegistration({
      ...createEntryData(plate),
      timestamp: twoHoursAgo,
    });

    const result1 = await backgroundTaskService.runRecord补拉Task();
    expect(result1.foundMissing).toBe(1);
    expect(result1.anomaliesCreated).toBe(1);

    const status = archiveStore.getVehicleStatus(plate)!;
    expect(status.currentStatus).toBe('ABNORMAL');

    const result2 = await backgroundTaskService.runRecord补拉Task();
    expect(result2.foundMissing).toBe(0);
    expect(result2.anomaliesCreated).toBe(0);

    const anomalies = archiveStore.getAnomalyRecordsByPlate(plate);
    expect(anomalies.filter((a) => !a.resolved).length).toBe(1);
  });

  test('交班摘要生成：统计正确', async () => {
    const now = Date.now();
    const shiftStart = now - 4 * 60 * 60 * 1000;
    const shiftEnd = now;

    for (let i = 0; i < 5; i++) {
      const t = shiftStart + i * 30 * 60 * 1000;
      const plate = `统计车${String(i + 1).padStart(3, '0')}`;

      washArchiveService.entryRegistration({
        ...createEntryData(plate),
        operator: i % 2 === 0 ? '操作员A' : '操作员B',
        timestamp: t,
      });

      if (i < 3) {
        washArchiveService.washCompletion({
          ...createWashData(plate),
          operator: i % 2 === 0 ? '操作员B' : '操作员A',
          timestamp: t + 15 * 60 * 1000,
        });
        washArchiveService.samplingReview({
          ...createSamplingData(plate, i === 1 ? 'FAIL' : 'PASS'),
          operator: '操作员C',
          timestamp: t + 30 * 60 * 1000,
        });
        if (i !== 1) {
          washArchiveService.exitRelease({
            ...createExitData(plate),
            operator: '操作员D',
            timestamp: t + 45 * 60 * 1000,
          });
        }
      }
    }

    const summary = await backgroundTaskService.runShiftSummaryTask({
      startTime: shiftStart,
      endTime: shiftEnd,
      shiftName: '测试班次',
    });

    expect(summary).not.toBeNull();
    expect(summary!.totalVehicles).toBe(5);
    expect(summary!.completedVehicles).toBe(2);
    expect(summary!.abnormalVehicles).toBe(1);
    expect(summary!.pendingRecords).toBe(2);
    expect(summary!.anomalyCounts[AnomalyType.SAMPLING_FAILED]).toBe(1);

    expect(summary!.operatorStats['操作员A']).toBe(4);
    expect(summary!.operatorStats['操作员B']).toBe(4);
    expect(summary!.operatorStats['操作员C']).toBe(3);
    expect(summary!.operatorStats['操作员D']).toBe(2);
  });

  test('交班摘要生成：空数据', async () => {
    const now = Date.now();
    const shiftStart = now - 8 * 60 * 60 * 1000;
    const shiftEnd = now;

    const summary = await backgroundTaskService.runShiftSummaryTask({
      startTime: shiftStart,
      endTime: shiftEnd,
      shiftName: '空班次',
    });

    expect(summary).not.toBeNull();
    expect(summary!.totalVehicles).toBe(0);
    expect(summary!.completedVehicles).toBe(0);
    expect(summary!.abnormalVehicles).toBe(0);
    expect(summary!.pendingRecords).toBe(0);
  });

  test('获取活跃流程列表', () => {
    const plate1 = '活跃车001';
    const plate2 = '活跃车002';
    const plate3 = '完成车002';

    washArchiveService.entryRegistration(createEntryData(plate1));
    washArchiveService.entryRegistration(createEntryData(plate2));
    washArchiveService.washCompletion(createWashData(plate2));

    washArchiveService.entryRegistration(createEntryData(plate3));
    washArchiveService.washCompletion(createWashData(plate3));
    washArchiveService.samplingReview(createSamplingData(plate3, 'PASS'));
    washArchiveService.exitRelease(createExitData(plate3));

    const activeChains = backgroundTaskService.getActiveChains();
    expect(activeChains.length).toBe(2);

    const plates = activeChains.map((c) => c.plateNumber);
    expect(plates).toContain(plate1);
    expect(plates).toContain(plate2);
    expect(plates).not.toContain(plate3);
  });

  test('多异常统计', async () => {
    const now = Date.now();
    const shiftStart = now - 8 * 60 * 60 * 1000;
    const shiftEnd = now;

    const plate1 = '多异常车001';
    const plate2 = '多异常车002';
    const plate3 = '多异常车003';

    washArchiveService.entryRegistration({
      ...createEntryData(plate1),
      timestamp: shiftStart + 30 * 60 * 1000,
    });
    washArchiveService.washCompletion({
      ...createWashData(plate1),
      timestamp: shiftStart + 60 * 60 * 1000,
    });
    washArchiveService.samplingReview({
      ...createSamplingData(plate1, 'FAIL'),
      timestamp: shiftStart + 90 * 60 * 1000,
    });

    washArchiveService.addAnomaly(
      plate2,
      AnomalyType.WASH_TIMEOUT,
      '洗消超时',
      undefined
    );

    washArchiveService.addAnomaly(
      plate3,
      AnomalyType.OTHER,
      '其他异常',
      undefined
    );

    const summary = await backgroundTaskService.runShiftSummaryTask({
      startTime: shiftStart,
      endTime: shiftEnd,
      shiftName: '多异常班次',
    });

    expect(summary!.abnormalVehicles).toBe(3);
    expect(summary!.anomalyCounts[AnomalyType.SAMPLING_FAILED]).toBe(1);
    expect(summary!.anomalyCounts[AnomalyType.WASH_TIMEOUT]).toBe(1);
    expect(summary!.anomalyCounts[AnomalyType.OTHER]).toBe(1);
  });

  test('交班摘要：同一辆车当天两次入场，应统计为两条链路', async () => {
    const now = Date.now();
    const shiftStart = now - 8 * 60 * 60 * 1000;
    const shiftEnd = now;

    const plate = '重复车001';

    // 第一次完整流程
    washArchiveService.entryRegistration({
      ...createEntryData(plate),
      timestamp: shiftStart + 60 * 60 * 1000,
    });
    washArchiveService.washCompletion({
      ...createWashData(plate),
      timestamp: shiftStart + 75 * 60 * 1000,
    });
    washArchiveService.samplingReview({
      ...createSamplingData(plate, 'PASS'),
      timestamp: shiftStart + 90 * 60 * 1000,
    });
    washArchiveService.exitRelease({
      ...createExitData(plate),
      timestamp: shiftStart + 105 * 60 * 1000,
    });

    // 第二次完整流程（同一辆车）
    washArchiveService.entryRegistration({
      ...createEntryData(plate),
      timestamp: shiftStart + 180 * 60 * 1000,
    });
    washArchiveService.washCompletion({
      ...createWashData(plate),
      timestamp: shiftStart + 195 * 60 * 1000,
    });
    washArchiveService.samplingReview({
      ...createSamplingData(plate, 'PASS'),
      timestamp: shiftStart + 210 * 60 * 1000,
    });
    washArchiveService.exitRelease({
      ...createExitData(plate),
      timestamp: shiftStart + 225 * 60 * 1000,
    });

    // 验证追溯链
    const chains = washArchiveService.getTraceChainsByPlate(plate);
    expect(chains.length).toBe(2);

    const summary = await backgroundTaskService.runShiftSummaryTask({
      startTime: shiftStart,
      endTime: shiftEnd,
      shiftName: '重复车辆班次',
    });

    // 关键断言：同一辆车两次入场应统计为2条链路，而不是1辆车
    expect(summary).not.toBeNull();
    expect(summary!.totalVehicles).toBe(2);
    expect(summary!.completedVehicles).toBe(2);
    expect(summary!.abnormalVehicles).toBe(0);
    expect(summary!.pendingRecords).toBe(0);

    // 验证操作员统计：每条链路有4条记录，2条链路共8条记录
    expect(summary!.operatorStats['操作员A']).toBe(2);
    expect(summary!.operatorStats['操作员B']).toBe(2);
    expect(summary!.operatorStats['操作员C']).toBe(2);
    expect(summary!.operatorStats['操作员D']).toBe(2);
  });

  test('二次入场时stageTimestamps应重置为新流程', () => {
    const plate = '重置车001';

    // 第一次流程
    washArchiveService.entryRegistration(createEntryData(plate));
    washArchiveService.washCompletion(createWashData(plate));
    washArchiveService.samplingReview(createSamplingData(plate, 'PASS'));
    washArchiveService.exitRelease(createExitData(plate));

    // 验证第一次流程后的状态
    const status1 = archiveStore.getVehicleStatus(plate)!;
    expect(status1.stageTimestamps[RecordType.ENTRY_REGISTRATION]).toBeDefined();
    expect(status1.stageTimestamps[RecordType.WASH_COMPLETION]).toBeDefined();
    expect(status1.stageTimestamps[RecordType.SAMPLING_REVIEW]).toBeDefined();
    expect(status1.stageTimestamps[RecordType.EXIT_RELEASE]).toBeDefined();

    // 第二次入场
    const entry2 = washArchiveService.entryRegistration({
      ...createEntryData(plate),
      timestamp: Date.now() + 10000,
    });

    // 验证stageTimestamps已重置，只包含新的入场记录
    const status2 = archiveStore.getVehicleStatus(plate)!;
    expect(Object.keys(status2.stageTimestamps).length).toBe(1);
    expect(status2.stageTimestamps[RecordType.ENTRY_REGISTRATION]).toBeDefined();
    expect(status2.stageTimestamps[RecordType.WASH_COMPLETION]).toBeUndefined();
    expect(status2.stageTimestamps[RecordType.SAMPLING_REVIEW]).toBeUndefined();
    expect(status2.stageTimestamps[RecordType.EXIT_RELEASE]).toBeUndefined();
  });
});
