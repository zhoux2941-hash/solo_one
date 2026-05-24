const moment = require('moment');
const db = require('./models');

async function initSampleData() {
  const count = await db.PulpBatch.count();
  if (count > 0) {
    console.log('已有数据，跳过初始化');
    return;
  }

  console.log('开始初始化示例数据...');

  const batches = [
    {
      batchNo: 'P20240501001',
      machineId: 'PM-01',
      oldPulpType: '针叶浆',
      newPulpType: '阔叶浆',
      startTime: moment().subtract(7, 'days').toDate(),
      endTime: moment().subtract(7, 'days').add(2, 'hours').toDate(),
      operator: '张三',
      status: 'completed',
      totalLoss: 156.80,
      totalLossRate: 3.25
    },
    {
      batchNo: 'P20240502001',
      machineId: 'PM-02',
      oldPulpType: '阔叶浆',
      newPulpType: '竹浆',
      startTime: moment().subtract(5, 'days').toDate(),
      endTime: moment().subtract(5, 'days').add(2.5, 'hours').toDate(),
      operator: '李四',
      status: 'completed',
      totalLoss: 189.50,
      totalLossRate: 3.85
    },
    {
      batchNo: 'P20240503001',
      machineId: 'PM-01',
      oldPulpType: '竹浆',
      newPulpType: '针叶浆',
      startTime: moment().subtract(3, 'days').toDate(),
      endTime: moment().subtract(3, 'days').add(1.8, 'hours').toDate(),
      operator: '王五',
      status: 'completed',
      totalLoss: 132.40,
      totalLossRate: 2.98
    },
    {
      batchNo: 'P20240504001',
      machineId: 'PM-03',
      oldPulpType: '针叶浆',
      newPulpType: '混合浆',
      startTime: moment().subtract(1, 'day').toDate(),
      endTime: null,
      operator: '赵六',
      status: 'processing',
      totalLoss: null,
      totalLossRate: null
    },
    {
      batchNo: 'P20240505001',
      machineId: 'PM-02',
      oldPulpType: '混合浆',
      newPulpType: '阔叶浆',
      startTime: moment().subtract(2, 'hours').toDate(),
      endTime: null,
      operator: '张三',
      status: 'pending',
      totalLoss: null,
      totalLossRate: null
    }
  ];

  for (const batchData of batches) {
    const batch = await db.PulpBatch.create(batchData);
    await generateFlowReadings(batch);
    await generateDowntimeRemarks(batch);

    if (batch.status === 'completed') {
      await generateSegmentsAndCalculations(batch);
    }
  }

  console.log('示例数据初始化完成');
}

async function generateFlowReadings(batch) {
  const readings = [];
  const startTime = moment(batch.startTime);
  const endTime = batch.endTime ? moment(batch.endTime) : moment(startTime).add(2, 'hours');
  const duration = endTime.diff(startTime, 'minutes');

  let totalFlow = Math.random() * 1000 + 5000;

  for (let i = 0; i <= duration; i += 5) {
    const readingTime = moment(startTime).add(i, 'minutes').toDate();
    const flowRate = Math.random() * 50 + 150;
    totalFlow += flowRate * 5 / 60;
    const concentration = Math.random() * 2 + 3.5;
    const temperature = Math.random() * 10 + 45;

    readings.push({
      batchId: batch.id,
      readingTime,
      flowRate: flowRate.toFixed(2),
      totalFlow: totalFlow.toFixed(2),
      concentration: concentration.toFixed(2),
      temperature: temperature.toFixed(1),
      meterId: 'FM-' + batch.machineId
    });
  }

  await db.FlowMeterReading.bulkCreate(readings);
}

async function generateDowntimeRemarks(batch) {
  const remarks = [
    {
      eventType: 'start',
      remark: '换浆开始，准备切换阀门',
      operator: batch.operator
    },
    {
      eventType: 'note',
      remark: '检查管道压力正常',
      operator: batch.operator
    }
  ];

  if (batch.status === 'completed') {
    remarks.push({
      eventType: 'stop',
      remark: '换浆完成，系统稳定',
      operator: batch.operator
    });
  }

  for (let i = 0; i < remarks.length; i++) {
    await db.DowntimeRemark.create({
      batchId: batch.id,
      eventTime: moment(batch.startTime).add(i * 20, 'minutes').toDate(),
      ...remarks[i]
    });
  }
}

async function generateSegmentsAndCalculations(batch) {
  const segments = [
    { segmentName: '准备阶段', segmentType: 'preparation', sortOrder: 1, duration: 300 },
    { segmentName: '切换阶段', segmentType: 'switching', sortOrder: 2, duration: 2400 },
    { segmentName: '稳定阶段', segmentType: 'stabilization', sortOrder: 3, duration: 1800 }
  ];

  let currentTime = moment(batch.startTime);

  for (const segData of segments) {
    const segment = await db.LossSegment.create({
      batchId: batch.id,
      ...segData,
      startTime: currentTime.toDate(),
      endTime: moment(currentTime).add(segData.duration, 'seconds').toDate()
    });

    const lossAmount = (Math.random() * 80 + 30).toFixed(2);
    const lossRate = (Math.random() * 3 + 1.5).toFixed(2);

    await db.StageCalculation.create({
      batchId: batch.id,
      segmentId: segment.id,
      stageName: segData.segmentName,
      startTime: segment.startTime,
      endTime: segment.endTime,
      duration: segData.duration,
      startFlow: (Math.random() * 1000 + 5000).toFixed(2),
      endFlow: (Math.random() * 1000 + 6000).toFixed(2),
      flowDifference: (Math.random() * 500 + 800).toFixed(2),
      avgConcentration: (Math.random() * 2 + 3.5).toFixed(2),
      lossAmount,
      lossRate,
      theoreticalOutput: (Math.random() * 2000 + 3000).toFixed(2),
      actualOutput: (Math.random() * 2000 + 2800).toFixed(2)
    });

    currentTime.add(segData.duration, 'seconds');
  }
}

module.exports = { initSampleData };