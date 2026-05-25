import request from 'supertest';
import { app, server } from '../src/index';
import { archiveStore } from '../src/store';
import { backgroundTaskService } from '../src/services/BackgroundTaskService';

describe('API 接口测试', () => {
  beforeAll(() => {
    backgroundTaskService.stop();
  });

  beforeEach(() => {
    archiveStore.clearAll();
  });

  afterAll((done) => {
    backgroundTaskService.stop();
    archiveStore.forcePersist();
    archiveStore.stopAutoPersist();
    server.close(() => {
      done();
    });
  });

  const entryData = {
    plateNumber: 'API001',
    driverName: '测试司机',
    driverPhone: '13900139000',
    cargoType: '丙酮',
    hazardLevel: '乙级',
    expectedWashType: '普通洗消',
    operator: 'API操作员A',
  };

  const washData = {
    plateNumber: 'API001',
    washType: '普通洗消',
    washDuration: 1200,
    detergent: '中性清洁剂',
    waterTemp: 50,
    pressure: 6,
    operator: 'API操作员B',
  };

  const samplingData = {
    plateNumber: 'API001',
    samplingPoints: ['车头', '车尾'],
    testItems: ['PH值', '残留物'],
    testResult: 'PASS',
    tester: 'API检测员',
    operator: 'API操作员C',
  };

  const exitData = {
    plateNumber: 'API001',
    gateNumber: '2号门',
    destination: '北京',
    operator: 'API操作员D',
  };

  test('GET /api/health - 健康检查', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('running');
  });

  test('POST /api/records/entry - 入场登记', async () => {
    const res = await request(app).post('/api/records/entry').send(entryData);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recordType).toBe('ENTRY_REGISTRATION');
    expect(res.body.data.plateNumber).toBe('API001');
    expect(res.body.data.chainId).toBeDefined();
  });

  test('POST /api/records/entry - 缺少必填字段', async () => {
    const res = await request(app)
      .post('/api/records/entry')
      .send({ plateNumber: 'API002', operator: 'test' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('缺少必填字段');
  });

  test('POST /api/records/wash - 洗消完成', async () => {
    await request(app).post('/api/records/entry').send(entryData);

    const res = await request(app).post('/api/records/wash').send(washData);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recordType).toBe('WASH_COMPLETION');
  });

  test('POST /api/records/sampling - 抽检复核通过', async () => {
    await request(app).post('/api/records/entry').send(entryData);
    await request(app).post('/api/records/wash').send(washData);

    const res = await request(app).post('/api/records/sampling').send(samplingData);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recordType).toBe('SAMPLING_REVIEW');
    expect(res.body.data.anomalyId).toBeUndefined();
  });

  test('POST /api/records/sampling - 抽检复核不通过', async () => {
    await request(app).post('/api/records/entry').send(entryData);
    await request(app).post('/api/records/wash').send(washData);

    const res = await request(app)
      .post('/api/records/sampling')
      .send({ ...samplingData, testResult: 'FAIL' });
    expect(res.status).toBe(200);
    expect(res.body.data.anomalyId).toBeDefined();
  });

  test('POST /api/records/exit - 出场放行', async () => {
    await request(app).post('/api/records/entry').send(entryData);
    await request(app).post('/api/records/wash').send(washData);
    await request(app).post('/api/records/sampling').send(samplingData);

    const res = await request(app).post('/api/records/exit').send(exitData);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recordType).toBe('EXIT_RELEASE');
  });

  test('POST /api/records/exit - 异常车辆无法出场', async () => {
    await request(app).post('/api/records/entry').send(entryData);
    await request(app).post('/api/records/wash').send(washData);
    await request(app)
      .post('/api/records/sampling')
      .send({ ...samplingData, testResult: 'FAIL' });

    const res = await request(app).post('/api/records/exit').send(exitData);
    expect(res.status).toBe(500);
    expect(res.body.error).toContain('未解决的异常');
  });

  test('GET /api/vehicles/:plateNumber/status - 获取车辆状态', async () => {
    await request(app).post('/api/records/entry').send(entryData);

    const res = await request(app).get('/api/vehicles/API001/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentStatus).toBe('WAITING_WASH');
    expect(res.body.data.currentChainId).toBeDefined();
  });

  test('GET /api/vehicles/:plateNumber/status - 车辆不存在', async () => {
    const res = await request(app).get('/api/vehicles/NOTEXIST/status');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/vehicles - 获取所有车辆状态', async () => {
    await request(app)
      .post('/api/records/entry')
      .send({ ...entryData, plateNumber: 'API001' });
    await request(app)
      .post('/api/records/entry')
      .send({ ...entryData, plateNumber: 'API002' });

    const res = await request(app).get('/api/vehicles');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(2);
    expect(res.body.data.length).toBe(2);
  });

  test('GET /api/vehicles - 按状态筛选', async () => {
    await request(app)
      .post('/api/records/entry')
      .send({ ...entryData, plateNumber: 'API001' });
    await request(app)
      .post('/api/records/entry')
      .send({ ...entryData, plateNumber: 'API002' });
    await request(app)
      .post('/api/records/wash')
      .send({ ...washData, plateNumber: 'API002' });

    const res = await request(app).get('/api/vehicles?status=WAITING_SAMPLING');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].plateNumber).toBe('API002');
  });

  test('GET /api/vehicles/:plateNumber/trace - 获取车辆追溯链', async () => {
    await request(app).post('/api/records/entry').send(entryData);
    await request(app).post('/api/records/wash').send(washData);
    await request(app).post('/api/records/sampling').send(samplingData);
    await request(app).post('/api/records/exit').send(exitData);

    const res = await request(app).get('/api/vehicles/API001/trace');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].records.length).toBe(4);
    expect(res.body.data[0].status).toBe('COMPLETED');
  });

  test('GET /api/trace/:chainId - 获取单个追溯链', async () => {
    const entryRes = await request(app).post('/api/records/entry').send(entryData);
    const chainId = entryRes.body.data.chainId;

    const res = await request(app).get(`/api/trace/${chainId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.chainId).toBe(chainId);
    expect(res.body.data.records.length).toBe(1);
  });

  test('GET /api/chains/active - 获取活跃流程', async () => {
    await request(app).post('/api/records/entry').send(entryData);

    const res = await request(app).get('/api/chains/active');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(1);
  });

  test('POST /api/anomalies - 添加异常', async () => {
    await request(app).post('/api/records/entry').send(entryData);

    const res = await request(app).post('/api/anomalies').send({
      plateNumber: 'API001',
      anomalyType: 'WASH_TIMEOUT',
      description: '洗消超时2小时',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.anomalyType).toBe('WASH_TIMEOUT');
    expect(res.body.data.resolved).toBe(false);
  });

  test('POST /api/anomalies - 无效异常类型', async () => {
    const res = await request(app).post('/api/anomalies').send({
      plateNumber: 'API001',
      anomalyType: 'INVALID_TYPE',
      description: '测试',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('PUT /api/anomalies/:anomalyId/resolve - 解决异常', async () => {
    await request(app).post('/api/records/entry').send(entryData);

    const anomalyRes = await request(app).post('/api/anomalies').send({
      plateNumber: 'API001',
      anomalyType: 'OTHER',
      description: '测试异常',
    });
    const anomalyId = anomalyRes.body.data.id;

    const res = await request(app).put(`/api/anomalies/${anomalyId}/resolve`).send({
      resolvedBy: '管理员',
      resolution: '已处理',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resolved).toBe(true);
    expect(res.body.data.resolvedBy).toBe('管理员');
  });

  test('GET /api/anomalies - 获取未解决异常', async () => {
    await request(app).post('/api/records/entry').send(entryData);
    await request(app).post('/api/anomalies').send({
      plateNumber: 'API001',
      anomalyType: 'OTHER',
      description: '测试异常',
    });

    const res = await request(app).get('/api/anomalies');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(1);
  });

  test('GET /api/anomalies - 按车牌号查询', async () => {
    await request(app).post('/api/records/entry').send(entryData);
    await request(app).post('/api/anomalies').send({
      plateNumber: 'API001',
      anomalyType: 'OTHER',
      description: '测试异常',
    });

    const res = await request(app).get('/api/anomalies?plateNumber=API001');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  test('POST /api/tasks/record-pull - 手动触发记录补拉', async () => {
    const res = await request(app).post('/api/tasks/record-pull');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.foundMissing).toBeDefined();
    expect(res.body.data.anomaliesCreated).toBeDefined();
  });

  test('POST /api/tasks/shift-summary - 手动生成交班摘要', async () => {
    const now = Date.now();
    const res = await request(app).post('/api/tasks/shift-summary').send({
      startTime: now - 8 * 60 * 60 * 1000,
      endTime: now,
      shiftName: '测试交班',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.shiftName).toBe('测试交班');
  });

  test('GET /api/shift-summaries - 获取交班摘要', async () => {
    const now = Date.now();
    const startTime = now - 8 * 60 * 60 * 1000;
    const endTime = now;

    await request(app).post('/api/tasks/shift-summary').send({
      startTime,
      endTime,
      shiftName: '查询测试',
    });

    const res = await request(app).get(
      `/api/shift-summaries?startTime=${startTime}&endTime=${endTime}`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/shift-summaries?latest=true - 获取最新交班摘要', async () => {
    const now = Date.now();
    await request(app).post('/api/tasks/shift-summary').send({
      startTime: now - 8 * 60 * 60 * 1000,
      endTime: now,
      shiftName: '最新测试',
    });

    const res = await request(app).get('/api/shift-summaries?latest=true');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.shiftName).toBe('最新测试');
  });

  test('GET /api/records - 获取所有记录', async () => {
    await request(app).post('/api/records/entry').send(entryData);
    await request(app).post('/api/records/wash').send(washData);

    const res = await request(app).get('/api/records');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(2);
  });

  test('GET /api/records - 按车牌号查询', async () => {
    await request(app)
      .post('/api/records/entry')
      .send({ ...entryData, plateNumber: 'API001' });
    await request(app)
      .post('/api/records/entry')
      .send({ ...entryData, plateNumber: 'API002' });

    const res = await request(app).get('/api/records?plateNumber=API001');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].plateNumber).toBe('API001');
  });

  test('DELETE /api/clear - 清空所有数据', async () => {
    await request(app).post('/api/records/entry').send(entryData);
    expect(archiveStore.getAllWashRecords().length).toBe(1);

    const res = await request(app).delete('/api/clear');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(archiveStore.getAllWashRecords().length).toBe(0);
  });

  test('POST /api/persist - 强制持久化', async () => {
    const res = await request(app).post('/api/persist');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('404 - 不存在的路由', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('完整流程 API 测试', async () => {
    const plate = 'FULLFLOW001';

    const entryRes = await request(app)
      .post('/api/records/entry')
      .send({ ...entryData, plateNumber: plate });
    expect(entryRes.status).toBe(200);
    const chainId = entryRes.body.data.chainId;

    const status1 = await request(app).get(`/api/vehicles/${plate}/status`);
    expect(status1.body.data.currentStatus).toBe('WAITING_WASH');

    await request(app).post('/api/records/wash').send({ ...washData, plateNumber: plate });
    const status2 = await request(app).get(`/api/vehicles/${plate}/status`);
    expect(status2.body.data.currentStatus).toBe('WAITING_SAMPLING');

    await request(app)
      .post('/api/records/sampling')
      .send({ ...samplingData, plateNumber: plate });
    const status3 = await request(app).get(`/api/vehicles/${plate}/status`);
    expect(status3.body.data.currentStatus).toBe('WAITING_EXIT');

    await request(app).post('/api/records/exit').send({ ...exitData, plateNumber: plate });
    const status4 = await request(app).get(`/api/vehicles/${plate}/status`);
    expect(status4.body.data.currentStatus).toBe('EXITED');
    expect(status4.body.data.currentChainId).toBeNull();

    const traceRes = await request(app).get(`/api/trace/${chainId}`);
    expect(traceRes.status).toBe(200);
    expect(traceRes.body.data.records.length).toBe(4);
    expect(traceRes.body.data.status).toBe('COMPLETED');
    expect(traceRes.body.data.durationMs).toBeGreaterThan(0);
  });
});
