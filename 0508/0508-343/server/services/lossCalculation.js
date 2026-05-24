const moment = require('moment');
const db = require('../models');

class LossCalculationService {
  constructor() {
    this.PULP_DENSITY = 1.05;
    this.STANDARD_CONCENTRATION = 4.5;
    this.MIN_SEGMENT_DURATION = 60;
    this.FLOW_CHANGE_THRESHOLD = 0.15;
  }

  logTrace(batchId, step, message, data = null) {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    const logMsg = `[${timestamp}] [Batch-${batchId}] [${step}] ${message}`;
    if (data) {
      console.log(logMsg, JSON.stringify(data));
    } else {
      console.log(logMsg);
    }
  }

  async calculateBatchLoss(batchId) {
    this.logTrace(batchId, 'START', '开始批次损耗计算');

    const batch = await db.PulpBatch.findByPk(batchId);
    if (!batch) throw new Error('批次不存在');

    const readings = await db.FlowMeterReading.findAll({
      where: { batchId },
      order: [['readingTime', 'ASC']]
    });

    this.logTrace(batchId, 'READINGS', `获取流量计读数 ${readings.length} 条`);

    if (readings.length < 2) {
      this.logTrace(batchId, 'WARN', '流量计读数不足，无法计算');
      return { totalLoss: '0.00', totalLossRate: '0.00', stages: [] };
    }

    await db.StageCalculation.destroy({ where: { batchId } });
    this.logTrace(batchId, 'CLEANUP', '已清除旧的计算结果');

    const segments = await this.generateSegments(batch, readings);
    this.logTrace(batchId, 'SEGMENTS', `生成 ${segments.length} 个分段`);

    const stageResults = [];

    for (const segment of segments) {
      const stageLoss = await this.calculateSegmentLoss(batchId, segment, readings);
      stageResults.push(stageLoss);
      this.logTrace(batchId, 'CALC', `分段 ${segment.segmentName} 损耗: ${stageLoss.lossAmount}kg`);
    }

    const totalLoss = stageResults.reduce((sum, s) => sum + parseFloat(s.lossAmount || 0), 0);
    const totalFlow = readings[readings.length - 1].totalFlow - readings[0].totalFlow;
    const totalLossRate = totalFlow > 0 ? (totalLoss / (totalFlow * this.PULP_DENSITY * this.STANDARD_CONCENTRATION / 100)) * 100 : 0;

    await batch.update({
      totalLoss: totalLoss.toFixed(2),
      totalLossRate: totalLossRate.toFixed(2),
      status: 'completed'
    });

    this.logTrace(batchId, 'COMPLETE', `计算完成 - 总损耗: ${totalLoss.toFixed(2)}kg, 损耗率: ${totalLossRate.toFixed(2)}%`);

    return {
      batchId,
      totalLoss: totalLoss.toFixed(2),
      totalLossRate: totalLossRate.toFixed(2),
      stages: stageResults
    };
  }

  async generateSegments(batch, readings) {
    const batchId = batch.id;
    this.logTrace(batchId, 'SEG_GEN', '开始智能分段生成');

    const segments = [];
    const startTime = moment(batch.startTime);
    const endTime = batch.endTime ? moment(batch.endTime) : moment(readings[readings.length - 1].readingTime);

    const remarks = await db.DowntimeRemark.findAll({
      where: { batchId: batch.id },
      order: [['eventTime', 'ASC']]
    });

    this.logTrace(batchId, 'REMARKS', `获取人工备注 ${remarks.length} 条`);

    const pauseRemarks = remarks.filter(r => r.eventType === 'pause' && r.duration);
    this.logTrace(batchId, 'PAUSES', `停机事件 ${pauseRemarks.length} 个`);

    const phasePoints = await this.analyzeFlowPhase(batch, readings);
    this.logTrace(batchId, 'PHASE', `流量阶段分析完成`, phasePoints);

    const mainSegments = [];

    if (phasePoints.preparationEnd) {
      mainSegments.push({
        segmentName: '准备阶段',
        segmentType: 'preparation',
        startTime: startTime.toDate(),
        endTime: phasePoints.preparationEnd,
        sortOrder: 1
      });
    }

    if (phasePoints.switchStart && phasePoints.switchEnd) {
      mainSegments.push({
        segmentName: '切换阶段',
        segmentType: 'switching',
        startTime: phasePoints.switchStart,
        endTime: phasePoints.switchEnd,
        sortOrder: 2
      });
    }

    if (phasePoints.stabilizationStart) {
      mainSegments.push({
        segmentName: '稳定阶段',
        segmentType: 'stabilization',
        startTime: phasePoints.stabilizationStart,
        endTime: endTime.toDate(),
        sortOrder: 3
      });
    }

    if (mainSegments.length === 0) {
      this.logTrace(batchId, 'SEG_FALLBACK', '使用兜底分段策略');
      const totalDuration = endTime.diff(startTime, 'seconds');
      mainSegments.push({
        segmentName: '准备阶段',
        segmentType: 'preparation',
        startTime: startTime.toDate(),
        endTime: moment(startTime).add(Math.min(300, totalDuration * 0.2), 'seconds').toDate(),
        sortOrder: 1
      });
      mainSegments.push({
        segmentName: '切换阶段',
        segmentType: 'switching',
        startTime: moment(startTime).add(Math.min(300, totalDuration * 0.2), 'seconds').toDate(),
        endTime: moment(startTime).add(totalDuration * 0.6, 'seconds').toDate(),
        sortOrder: 2
      });
      mainSegments.push({
        segmentName: '稳定阶段',
        segmentType: 'stabilization',
        startTime: moment(startTime).add(totalDuration * 0.6, 'seconds').toDate(),
        endTime: endTime.toDate(),
        sortOrder: 3
      });
    }

    this.validateAndAdjustSegments(mainSegments, startTime.toDate(), endTime.toDate());
    segments.push(...mainSegments);

    const downtimeSegments = this.generateDowntimeSegments(pauseRemarks, mainSegments);
    segments.push(...downtimeSegments);

    for (const seg of segments) {
      seg.duration = Math.max(0, moment(seg.endTime).diff(moment(seg.startTime), 'seconds'));
    }

    await db.LossSegment.destroy({ where: { batchId: batch.id } });
    const savedSegments = await db.LossSegment.bulkCreate(
      segments.map(s => ({ ...s, batchId: batch.id }))
    );

    this.logTrace(batchId, 'SEG_DONE', `分段保存完成，共 ${savedSegments.length} 个`);
    return savedSegments;
  }

  async analyzeFlowPhase(batch, readings) {
    if (readings.length < 10) {
      return { preparationEnd: null, switchStart: null, switchEnd: null, stabilizationStart: null };
    }

    const flowRates = readings.map(r => parseFloat(r.flowRate));
    const avgFlow = flowRates.reduce((a, b) => a + b, 0) / flowRates.length;

    let stableFlow = null;
    let stableCount = 0;
    for (let i = Math.floor(readings.length * 0.8); i < readings.length; i++) {
      if (Math.abs(flowRates[i] - avgFlow) < avgFlow * 0.05) {
        stableCount++;
        if (stableCount >= 5) {
          stableFlow = flowRates[i];
          break;
        }
      }
    }

    if (!stableFlow) stableFlow = avgFlow;

    let switchStartIdx = null;
    let switchEndIdx = null;

    for (let i = 5; i < readings.length - 5; i++) {
      const prevAvg = flowRates.slice(i - 5, i).reduce((a, b) => a + b, 0) / 5;
      const currVal = flowRates[i];

      if (!switchStartIdx && Math.abs(currVal - prevAvg) > prevAvg * this.FLOW_CHANGE_THRESHOLD) {
        switchStartIdx = i;
      }

      if (switchStartIdx && !switchEndIdx) {
        const nextAvg = flowRates.slice(i + 1, i + 6).reduce((a, b) => a + b, 0) / 5;
        if (Math.abs(nextAvg - stableFlow) < stableFlow * 0.1) {
          switchEndIdx = i;
          break;
        }
      }
    }

    const preparationEndIdx = switchStartIdx ? Math.max(3, Math.floor(switchStartIdx * 0.5)) : Math.floor(readings.length * 0.15);
    const stabilizationStartIdx = switchEndIdx ? Math.min(readings.length - 1, switchEndIdx + 3) : Math.floor(readings.length * 0.6);

    return {
      preparationEnd: readings[preparationEndIdx].readingTime,
      switchStart: readings[Math.max(0, preparationEndIdx + 1)].readingTime,
      switchEnd: readings[Math.min(readings.length - 1, stabilizationStartIdx - 1)].readingTime,
      stabilizationStart: readings[stabilizationStartIdx].readingTime
    };
  }

  validateAndAdjustSegments(segments, batchStartTime, batchEndTime) {
    if (segments.length === 0) return;

    segments[0].startTime = batchStartTime;

    for (let i = 1; i < segments.length; i++) {
      const prevEnd = moment(segments[i - 1].endTime);
      const currStart = moment(segments[i].startTime);

      if (currStart.isBefore(prevEnd) || currStart.diff(prevEnd, 'seconds') < 1) {
        segments[i].startTime = prevEnd.add(1, 'seconds').toDate();
      }
    }

    segments[segments.length - 1].endTime = batchEndTime;

    for (const seg of segments) {
      const duration = moment(seg.endTime).diff(moment(seg.startTime), 'seconds');
      if (duration < this.MIN_SEGMENT_DURATION) {
        seg.startTime = moment(seg.endTime).subtract(this.MIN_SEGMENT_DURATION, 'seconds').toDate();
      }
    }
  }

  generateDowntimeSegments(pauseRemarks, mainSegments) {
    const downtimeSegments = [];

    for (let i = 0; i < pauseRemarks.length; i++) {
      const remark = pauseRemarks[i];
      const downtimeStart = moment(remark.eventTime);
      const downtimeEnd = moment(remark.eventTime).add(parseInt(remark.duration || 60), 'seconds');

      let overlapped = false;
      for (const mainSeg of mainSegments) {
        const segStart = moment(mainSeg.startTime);
        const segEnd = moment(mainSeg.endTime);

        if (downtimeStart.isBetween(segStart, segEnd, null, '[]') ||
            downtimeEnd.isBetween(segStart, segEnd, null, '[]')) {
          overlapped = true;
          break;
        }
      }

      downtimeSegments.push({
        segmentName: `停机-${remark.remark || i + 1}`,
        segmentType: 'downtime',
        startTime: downtimeStart.toDate(),
        endTime: downtimeEnd.toDate(),
        sortOrder: 100 + i,
        remark: remark.remark || '',
        linkedRemarkId: remark.id,
        isOverlapping: overlapped
      });
    }

    return downtimeSegments;
  }

  async calculateSegmentLoss(batchId, segment, allReadings) {
    const segStart = moment(segment.startTime);
    const segEnd = moment(segment.endTime);

    const segmentReadings = allReadings.filter(r => {
      const t = moment(r.readingTime);
      return t.isBetween(segStart, segEnd, null, '[]');
    });

    this.logTrace(batchId, 'CALC_SEG', `${segment.segmentName} 读数: ${segmentReadings.length} 条`);

    if (segmentReadings.length < 2) {
      const nearestStart = this.findNearestReading(allReadings, segStart, -1);
      const nearestEnd = this.findNearestReading(allReadings, segEnd, 1);

      if (nearestStart && nearestEnd && nearestStart.id !== nearestEnd.id) {
        return await this.doCalculate(batchId, segment, nearestStart, nearestEnd, 2);
      }

      return {
        segmentId: segment.id,
        stageName: segment.segmentName,
        lossAmount: '0.00',
        lossRate: '0.00'
      };
    }

    const startReading = segmentReadings[0];
    const endReading = segmentReadings[segmentReadings.length - 1];

    return await this.doCalculate(batchId, segment, startReading, endReading, segmentReadings.length);
  }

  findNearestReading(readings, targetTime, direction = 0) {
    let nearest = null;
    let minDiff = Infinity;

    for (const r of readings) {
      const diff = moment(r.readingTime).diff(targetTime);
      const absDiff = Math.abs(diff);

      if (direction < 0 && diff > 0) continue;
      if (direction > 0 && diff < 0) continue;

      if (absDiff < minDiff) {
        minDiff = absDiff;
        nearest = r;
      }
    }

    return nearest;
  }

  async doCalculate(batchId, segment, startReading, endReading, readingCount) {
    const flowDifference = Math.max(0, endReading.totalFlow - startReading.totalFlow);
    const avgConcentration = (parseFloat(startReading.concentration || this.STANDARD_CONCENTRATION) +
                              parseFloat(endReading.concentration || this.STANDARD_CONCENTRATION)) / 2;

    const theoreticalOutput = flowDifference * this.PULP_DENSITY * (avgConcentration / 100);
    const actualOutput = theoreticalOutput * 0.92;
    const lossAmount = Math.max(0, theoreticalOutput - actualOutput);
    const lossRate = theoreticalOutput > 0 ? (lossAmount / theoreticalOutput) * 100 : 0;

    const remarks = await db.DowntimeRemark.findAll({
      where: { batchId },
      order: [['eventTime', 'ASC']]
    });

    const { linkedRemarkId, remarkText, remarkCount } = this.findRemarksInSegment(
      remarks,
      segment.startTime,
      segment.endTime
    );

    const calculation = await db.StageCalculation.create({
      batchId,
      segmentId: segment.id,
      stageName: segment.segmentName,
      startTime: segment.startTime,
      endTime: segment.endTime,
      duration: moment(segment.endTime).diff(moment(segment.startTime), 'seconds'),
      startFlow: startReading.totalFlow,
      endFlow: endReading.totalFlow,
      flowDifference: flowDifference.toFixed(2),
      avgConcentration: avgConcentration.toFixed(2),
      lossAmount: lossAmount.toFixed(2),
      lossRate: lossRate.toFixed(2),
      theoreticalOutput: theoreticalOutput.toFixed(2),
      actualOutput: actualOutput.toFixed(2),
      remark: remarkText,
      linkedRemarkId,
      readingCount
    });

    return calculation;
  }

  findRemarksInSegment(remarks, segStartTime, segEndTime) {
    const segStart = moment(segStartTime);
    const segEnd = moment(segEndTime);

    const matchedRemarks = [];
    for (const remark of remarks) {
      const remarkTime = moment(remark.eventTime);
      if (remarkTime.isBetween(segStart, segEnd, null, '[]')) {
        matchedRemarks.push(remark);
      }
    }

    if (matchedRemarks.length === 0) {
      return { linkedRemarkId: null, remarkText: '', remarkCount: 0 };
    }

    const mainRemark = matchedRemarks.reduce((best, curr) => {
      if (curr.eventType === 'pause') return curr;
      if (!best || best.eventType === 'note') return curr;
      return best;
    }, null);

    const remarkText = matchedRemarks.map(r => r.remark || '').filter(Boolean).join('; ');

    return {
      linkedRemarkId: mainRemark ? mainRemark.id : matchedRemarks[0].id,
      remarkText: remarkText || `关联${matchedRemarks.length}条备注`,
      remarkCount: matchedRemarks.length
    };
  }

  async getLossReviewData(batchId) {
    this.logTrace(batchId, 'REVIEW', '获取复盘数据');

    const batch = await db.PulpBatch.findByPk(batchId);
    if (!batch) throw new Error('批次不存在');

    const segments = await db.LossSegment.findAll({
      where: { batchId },
      order: [['sortOrder', 'ASC'], ['startTime', 'ASC']]
    });

    const calculations = await db.StageCalculation.findAll({
      where: { batchId },
      order: [['startTime', 'ASC']]
    });

    const remarks = await db.DowntimeRemark.findAll({
      where: { batchId },
      order: [['eventTime', 'ASC']]
    });

    const totalLoss = calculations.reduce((sum, s) => sum + parseFloat(s.lossAmount || 0), 0);
    this.logTrace(batchId, 'REVIEW_SUM', `计算总损耗: ${totalLoss.toFixed(2)}kg, 批次表存储: ${batch.totalLoss}kg`);

    if (Math.abs(totalLoss - parseFloat(batch.totalLoss || 0)) > 0.01) {
      this.logTrace(batchId, 'WARN', '批次表数据与计算结果不一致，已同步');
      await batch.update({
        totalLoss: totalLoss.toFixed(2)
      });
    }

    const reviewStages = calculations.map(calc => {
      const linkedRemarks = remarks.filter(r => {
        const remarkTime = moment(r.eventTime);
        return remarkTime.isBetween(moment(calc.startTime), moment(calc.endTime), null, '[]');
      });

      return {
        ...calc.toJSON(),
        remarkDetails: linkedRemarks.map(r => ({
          id: r.id,
          eventType: r.eventType,
          remark: r.remark,
          operator: r.operator,
          eventTime: r.eventTime
        }))
      };
    });

    const peakLoss = calculations.length > 0
      ? Math.max(...calculations.map(c => parseFloat(c.lossAmount || 0)))
      : 0;

    return {
      batch: {
        ...batch.toJSON(),
        totalLoss: totalLoss.toFixed(2),
        peakLoss: peakLoss.toFixed(2)
      },
      segments: segments.map(s => s.toJSON()),
      stages: reviewStages,
      remarks: remarks.map(r => r.toJSON()),
      peakLoss: peakLoss.toFixed(2)
    };
  }

  async getPeakLoss(batchId) {
    const reviewData = await this.getLossReviewData(batchId);
    return reviewData.peakLoss;
  }
}

module.exports = new LossCalculationService();
