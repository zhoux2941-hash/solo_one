const cron = require('node-cron');
const moment = require('moment');
const db = require('../server/models');
const lossCalculationService = require('../server/services/lossCalculation');

class WorkerService {
  constructor() {
    this.isRunning = false;
    this.taskQueue = [];
  }

  start() {
    console.log('Worker 服务启动...');
    this.isRunning = true;

    cron.schedule('*/1 * * * *', () => {
      this.processPendingBatches();
    });

    cron.schedule('*/5 * * * *', () => {
      this.generateLossSnapshots();
    });

    this.processQueue();
  }

  stop() {
    this.isRunning = false;
    console.log('Worker 服务停止');
  }

  async processPendingBatches() {
    if (!this.isRunning) return;

    try {
      const pendingBatches = await db.PulpBatch.findAll({
        where: { status: 'processing' },
        order: [['startTime', 'ASC']],
        limit: 5
      });

      for (const batch of pendingBatches) {
        this.addTask('calculate', batch.id);
      }
    } catch (error) {
      console.error('处理待处理批次失败:', error);
    }
  }

  addTask(type, batchId) {
    this.taskQueue.push({ type, batchId, createdAt: new Date() });
  }

  async processQueue() {
    while (this.isRunning) {
      if (this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        try {
          await this.executeTask(task);
        } catch (error) {
          console.error(`执行任务失败 [${task.type}:${task.batchId}]:`, error);
        }
      } else {
        await this.sleep(1000);
      }
    }
  }

  async executeTask(task) {
    switch (task.type) {
      case 'calculate':
        await this.calculateBatchLoss(task.batchId);
        break;
      case 'snapshot':
        await this.generateBatchSnapshots(task.batchId);
        break;
      case 'segment':
        await this.generateBatchSegments(task.batchId);
        break;
      default:
        console.warn('未知任务类型:', task.type);
    }
  }

  async calculateBatchLoss(batchId) {
    console.log(`开始计算批次损耗: ${batchId}`);
    try {
      const result = await lossCalculationService.calculateBatchLoss(batchId);
      console.log(`批次 ${batchId} 损耗计算完成: 总损耗 ${result.totalLoss}kg, 损耗率 ${result.totalLossRate}%`);
      return result;
    } catch (error) {
      console.error(`计算批次 ${batchId} 损耗失败:`, error);
      throw error;
    }
  }

  async generateBatchSegments(batchId) {
    console.log(`生成分段数据: ${batchId}`);
    try {
      const batch = await db.PulpBatch.findByPk(batchId);
      const readings = await db.FlowMeterReading.findAll({
        where: { batchId },
        order: [['readingTime', 'ASC']]
      });

      if (readings.length < 2) {
        console.log(`批次 ${batchId} 流量计读数不足，无法生成分段`);
        return;
      }

      const segments = await lossCalculationService.generateSegments(batch, readings);
      console.log(`批次 ${batchId} 生成分段完成，共 ${segments.length} 个分段`);
      return segments;
    } catch (error) {
      console.error(`生成分段失败 ${batchId}:`, error);
      throw error;
    }
  }

  async generateBatchSnapshots(batchId) {
    console.log(`生成损耗快照: ${batchId}`);
    try {
      const batch = await db.PulpBatch.findByPk(batchId);
      if (!batch) return;

      const segments = await db.LossSegment.findAll({
        where: { batchId },
        order: [['sortOrder', 'ASC']]
      });

      const snapshots = [];

      for (const segment of segments) {
        const segmentReadings = await db.FlowMeterReading.findAll({
          where: {
            batchId,
            readingTime: {
              [db.Sequelize.Op.between]: [segment.startTime, segment.endTime]
            }
          },
          order: [['readingTime', 'ASC']]
        });

        if (segmentReadings.length === 0) continue;

        snapshots.push({
          batchId,
          segmentId: segment.id,
          snapshotTime: segmentReadings[0].readingTime,
          snapshotType: 'start',
          flowRate: segmentReadings[0].flowRate,
          totalFlow: segmentReadings[0].totalFlow,
          concentration: segmentReadings[0].concentration,
          accumulatedLoss: 0,
          pulpComposition: { oldPulp: 100, newPulp: 0 }
        });

        if (segmentReadings.length >= 2) {
          const midIndex = Math.floor(segmentReadings.length / 2);
          snapshots.push({
            batchId,
            segmentId: segment.id,
            snapshotTime: segmentReadings[midIndex].readingTime,
            snapshotType: 'interval',
            flowRate: segmentReadings[midIndex].flowRate,
            totalFlow: segmentReadings[midIndex].totalFlow,
            concentration: segmentReadings[midIndex].concentration,
            accumulatedLoss: 0,
            pulpComposition: { oldPulp: 50, newPulp: 50 }
          });
        }

        const lastReading = segmentReadings[segmentReadings.length - 1];
        snapshots.push({
          batchId,
          segmentId: segment.id,
          snapshotTime: lastReading.readingTime,
          snapshotType: 'end',
          flowRate: lastReading.flowRate,
          totalFlow: lastReading.totalFlow,
          concentration: lastReading.concentration,
          accumulatedLoss: 0,
          pulpComposition: { oldPulp: 0, newPulp: 100 }
        });
      }

      await db.LossSnapshot.destroy({ where: { batchId } });
      if (snapshots.length > 0) {
        await db.LossSnapshot.bulkCreate(snapshots);
      }

      console.log(`批次 ${batchId} 生成快照完成，共 ${snapshots.length} 个快照`);
      return snapshots;
    } catch (error) {
      console.error(`生成快照失败 ${batchId}:`, error);
      throw error;
    }
  }

  async generateLossSnapshots() {
    if (!this.isRunning) return;

    try {
      const processingBatches = await db.PulpBatch.findAll({
        where: { status: 'processing' },
        attributes: ['id']
      });

      for (const batch of processingBatches) {
        this.addTask('snapshot', batch.id);
      }
    } catch (error) {
      console.error('生成快照任务失败:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const worker = new WorkerService();

if (require.main === module) {
  worker.start();
  console.log('Worker 运行中，按 Ctrl+C 停止');

  process.on('SIGINT', () => {
    worker.stop();
    process.exit(0);
  });
}

module.exports = worker;