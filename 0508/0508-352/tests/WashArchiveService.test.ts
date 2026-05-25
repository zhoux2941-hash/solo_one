import { washArchiveService } from '../src/services/WashArchiveService';
import { archiveStore } from '../src/store';
import {
  RecordType,
  VehicleStatus,
  AnomalyType,
  EntryRegistrationData,
  WashCompletionData,
  SamplingReviewData,
  ExitReleaseData,
} from '../src/types';

describe('WashArchiveService - 核心流程测试', () => {
  beforeEach(() => {
    archiveStore.clearAll();
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

  test('完整流程：入场登记 -> 洗消完成 -> 抽检复核 -> 出场放行', () => {
    const plate = '京A12345';

    const entryRecord = washArchiveService.entryRegistration(createEntryData(plate));
    expect(entryRecord.recordType).toBe(RecordType.ENTRY_REGISTRATION);
    expect(entryRecord.plateNumber).toBe(plate);

    let status = archiveStore.getVehicleStatus(plate)!;
    expect(status.currentStatus).toBe(VehicleStatus.WAITING_WASH);
    expect(status.currentChainId).toBe(entryRecord.chainId);
    expect(status.stageTimestamps[RecordType.ENTRY_REGISTRATION]).toBeDefined();

    const washRecord = washArchiveService.washCompletion(createWashData(plate));
    expect(washRecord.recordType).toBe(RecordType.WASH_COMPLETION);
    expect(washRecord.chainId).toBe(entryRecord.chainId);

    status = archiveStore.getVehicleStatus(plate)!;
    expect(status.currentStatus).toBe(VehicleStatus.WAITING_SAMPLING);

    const samplingRecord = washArchiveService.samplingReview(createSamplingData(plate, 'PASS'));
    expect(samplingRecord.recordType).toBe(RecordType.SAMPLING_REVIEW);
    expect(samplingRecord.chainId).toBe(entryRecord.chainId);

    status = archiveStore.getVehicleStatus(plate)!;
    expect(status.currentStatus).toBe(VehicleStatus.WAITING_EXIT);

    const exitRecord = washArchiveService.exitRelease(createExitData(plate));
    expect(exitRecord.recordType).toBe(RecordType.EXIT_RELEASE);
    expect(exitRecord.chainId).toBe(entryRecord.chainId);

    status = archiveStore.getVehicleStatus(plate)!;
    expect(status.currentStatus).toBe(VehicleStatus.EXITED);
    expect(status.currentChainId).toBeNull();
  });

  test('追溯链生成测试', () => {
    const plate = '京B67890';
    const baseTime = Date.now();

    washArchiveService.entryRegistration({ ...createEntryData(plate), timestamp: baseTime });
    washArchiveService.washCompletion({ ...createWashData(plate), timestamp: baseTime + 1000 });
    washArchiveService.samplingReview({ ...createSamplingData(plate, 'PASS'), timestamp: baseTime + 2000 });
    washArchiveService.exitRelease({ ...createExitData(plate), timestamp: baseTime + 3000 });

    const chains = washArchiveService.getTraceChainsByPlate(plate);
    expect(chains.length).toBe(1);

    const chain = chains[0];
    expect(chain.records.length).toBe(4);
    expect(chain.status).toBe('COMPLETED');
    expect(chain.durationMs).toBeDefined();
    expect(chain.durationMs).toBeGreaterThan(0);
    expect(chain.durationMs).toBe(3000);

    const singleChain = washArchiveService.getTraceChain(chain.chainId);
    expect(singleChain).not.toBeNull();
    expect(singleChain!.plateNumber).toBe(plate);
  });

  test('抽检不合格自动创建异常', () => {
    const plate = '京C11111';

    washArchiveService.entryRegistration(createEntryData(plate));
    washArchiveService.washCompletion(createWashData(plate));

    const samplingRecord = washArchiveService.samplingReview(createSamplingData(plate, 'FAIL'));
    expect(samplingRecord.anomalyId).toBeDefined();

    const status = archiveStore.getVehicleStatus(plate)!;
    expect(status.currentStatus).toBe(VehicleStatus.ABNORMAL);
    expect(status.lastAnomaly).not.toBeNull();
    expect(status.lastAnomaly!.anomalyType).toBe(AnomalyType.SAMPLING_FAILED);
    expect(status.lastAnomaly!.resolved).toBe(false);

    const anomalies = archiveStore.getAnomalyRecordsByPlate(plate);
    expect(anomalies.length).toBe(1);
    expect(anomalies[0].anomalyType).toBe(AnomalyType.SAMPLING_FAILED);
  });

  test('异常车辆无法直接出场', () => {
    const plate = '京D22222';

    washArchiveService.entryRegistration(createEntryData(plate));
    washArchiveService.washCompletion(createWashData(plate));
    washArchiveService.samplingReview(createSamplingData(plate, 'FAIL'));

    expect(() => {
      washArchiveService.exitRelease(createExitData(plate));
    }).toThrow(/存在未解决的异常/);
  });

  test('异常解决后可以继续流程', () => {
    const plate = '京E33333';

    washArchiveService.entryRegistration(createEntryData(plate));
    washArchiveService.washCompletion(createWashData(plate));
    const samplingRecord = washArchiveService.samplingReview(createSamplingData(plate, 'FAIL'));

    const anomalyId = samplingRecord.anomalyId!;
    const resolved = washArchiveService.resolveAnomaly(
      anomalyId,
      '管理员',
      '重新洗消后检测合格'
    );

    expect(resolved).not.toBeNull();
    expect(resolved!.resolved).toBe(true);
    expect(resolved!.resolvedBy).toBe('管理员');

    const status = archiveStore.getVehicleStatus(plate)!;
    expect(status.currentStatus).toBe(VehicleStatus.WAITING_EXIT);

    washArchiveService.exitRelease(createExitData(plate));
    const finalStatus = archiveStore.getVehicleStatus(plate)!;
    expect(finalStatus.currentStatus).toBe(VehicleStatus.EXITED);
  });

  test('操作顺序验证：跳过入场直接洗消应报错', () => {
    const plate = '京F44444';

    expect(() => {
      washArchiveService.washCompletion(createWashData(plate));
    }).toThrow(/未进行入场登记/);
  });

  test('操作顺序验证：重复记录同一类型应报错', () => {
    const plate = '京G55555';

    washArchiveService.entryRegistration(createEntryData(plate));

    expect(() => {
      washArchiveService.entryRegistration(createEntryData(plate));
    }).toThrow(/存在未完成的洗消流程/);
  });

  test('操作顺序验证：跳过洗消直接抽检应报错', () => {
    const plate = '京H66666';

    washArchiveService.entryRegistration(createEntryData(plate));

    expect(() => {
      washArchiveService.samplingReview(createSamplingData(plate));
    }).toThrow(/操作顺序错误/);
  });

  test('同一辆车完成后可以再次入场', () => {
    const plate = '京I77777';

    washArchiveService.entryRegistration(createEntryData(plate));
    washArchiveService.washCompletion(createWashData(plate));
    washArchiveService.samplingReview(createSamplingData(plate, 'PASS'));
    washArchiveService.exitRelease(createExitData(plate));

    const chains1 = washArchiveService.getTraceChainsByPlate(plate);
    expect(chains1.length).toBe(1);

    washArchiveService.entryRegistration(createEntryData(plate));
    washArchiveService.washCompletion(createWashData(plate));
    washArchiveService.samplingReview(createSamplingData(plate, 'PASS'));
    washArchiveService.exitRelease(createExitData(plate));

    const chains2 = washArchiveService.getTraceChainsByPlate(plate);
    expect(chains2.length).toBe(2);
    expect(chains2[0].chainId).not.toBe(chains2[1].chainId);
  });

  test('手动添加异常', () => {
    const plate = '京J88888';

    washArchiveService.entryRegistration(createEntryData(plate));
    const anomaly = washArchiveService.addAnomaly(
      plate,
      AnomalyType.WASH_TIMEOUT,
      '洗消时间过长，超过2小时'
    );

    expect(anomaly).not.toBeNull();
    expect(anomaly.anomalyType).toBe(AnomalyType.WASH_TIMEOUT);

    const status = archiveStore.getVehicleStatus(plate)!;
    expect(status.currentStatus).toBe(VehicleStatus.ABNORMAL);
    expect(status.lastAnomaly!.id).toBe(anomaly.id);
  });

  test('追溯链中包含异常信息', () => {
    const plate = '京K99999';

    washArchiveService.entryRegistration(createEntryData(plate));
    washArchiveService.washCompletion(createWashData(plate));
    washArchiveService.samplingReview(createSamplingData(plate, 'FAIL'));

    const chains = washArchiveService.getTraceChainsByPlate(plate);
    expect(chains.length).toBe(1);
    expect(chains[0].status).toBe('ABNORMAL');
    expect(chains[0].anomalies.length).toBeGreaterThan(0);
  });

  test('多辆车并行处理', () => {
    const plates = ['京A00001', '京A00002', '京A00003'];

    plates.forEach((plate) => {
      washArchiveService.entryRegistration(createEntryData(plate));
    });

    plates.slice(0, 2).forEach((plate) => {
      washArchiveService.washCompletion(createWashData(plate));
    });

    washArchiveService.samplingReview(createSamplingData(plates[0], 'PASS'));
    washArchiveService.exitRelease(createExitData(plates[0]));

    const status0 = archiveStore.getVehicleStatus(plates[0])!;
    const status1 = archiveStore.getVehicleStatus(plates[1])!;
    const status2 = archiveStore.getVehicleStatus(plates[2])!;

    expect(status0.currentStatus).toBe(VehicleStatus.EXITED);
    expect(status1.currentStatus).toBe(VehicleStatus.WAITING_SAMPLING);
    expect(status2.currentStatus).toBe(VehicleStatus.WAITING_WASH);
  });

  test('二次入场时洗消记录应挂到新链路，不应污染旧链路', () => {
    const plate = '京L00001';

    // 第一次完整流程
    const entry1 = washArchiveService.entryRegistration(createEntryData(plate));
    const chainId1 = entry1.chainId;
    washArchiveService.washCompletion(createWashData(plate));
    washArchiveService.samplingReview(createSamplingData(plate, 'PASS'));
    washArchiveService.exitRelease(createExitData(plate));

    // 验证第一次流程的状态
    const status1 = archiveStore.getVehicleStatus(plate)!;
    expect(status1.currentChainId).toBeNull();
    expect(status1.currentStatus).toBe(VehicleStatus.EXITED);

    // 第二次入场
    const entry2 = washArchiveService.entryRegistration(createEntryData(plate));
    const chainId2 = entry2.chainId;

    // 关键验证：两次入场的 chainId 必须不同
    expect(chainId1).not.toBe(chainId2);

    // 第二次洗消
    const wash2 = washArchiveService.washCompletion(createWashData(plate));

    // 关键验证：第二次洗消记录必须挂到新链路 chainId2 上
    expect(wash2.chainId).toBe(chainId2);
    expect(wash2.chainId).not.toBe(chainId1);

    // 验证车辆当前状态的 currentChainId 是新链路
    const status2 = archiveStore.getVehicleStatus(plate)!;
    expect(status2.currentChainId).toBe(chainId2);
    expect(status2.currentStatus).toBe(VehicleStatus.WAITING_SAMPLING);

    // 验证旧链路 chainId1 的记录：应该只有4条，不包含第二次的洗消
    const chain1Records = archiveStore.getWashRecordsByChain(chainId1);
    expect(chain1Records.length).toBe(4);
    expect(chain1Records.map(r => r.recordType)).toEqual([
      RecordType.ENTRY_REGISTRATION,
      RecordType.WASH_COMPLETION,
      RecordType.SAMPLING_REVIEW,
      RecordType.EXIT_RELEASE,
    ]);

    // 验证新链路 chainId2 的记录：应该有入场和洗消两条
    const chain2Records = archiveStore.getWashRecordsByChain(chainId2);
    expect(chain2Records.length).toBe(2);
    expect(chain2Records.map(r => r.recordType)).toEqual([
      RecordType.ENTRY_REGISTRATION,
      RecordType.WASH_COMPLETION,
    ]);

    // 完成第二次流程并验证追溯链
    washArchiveService.samplingReview(createSamplingData(plate, 'PASS'));
    washArchiveService.exitRelease(createExitData(plate));

    const chains = washArchiveService.getTraceChainsByPlate(plate);
    expect(chains.length).toBe(2);
    expect(chains[0].chainId).toBe(chainId2);
    expect(chains[0].records.length).toBe(4);
    expect(chains[1].chainId).toBe(chainId1);
    expect(chains[1].records.length).toBe(4);
  });
});
