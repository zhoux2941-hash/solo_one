const ExcelJS = require('exceljs');
const moment = require('moment');
const db = require('../models');
const lossCalculationService = require('./lossCalculation');

class ReportExportService {
  logTrace(batchId, step, message) {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    console.log(`[${timestamp}] [Report-${batchId}] [${step}] ${message}`);
  }

  async exportBatchReport(batchId, res) {
    this.logTrace(batchId, 'START', '开始导出完整报告');

    const reviewData = await lossCalculationService.getLossReviewData(batchId);
    const { batch, segments, stages, remarks } = reviewData;

    this.logTrace(batchId, 'DATA', `数据加载完成 - 分段:${segments.length}, 阶段:${stages.length}, 备注:${remarks.length}`);

    const totalLoss = stages.reduce((sum, s) => sum + parseFloat(s.lossAmount || 0), 0);
    const peakLoss = stages.length > 0
      ? Math.max(...stages.map(s => parseFloat(s.lossAmount || 0)))
      : 0;

    this.logTrace(batchId, 'CALC', `总损耗:${totalLoss.toFixed(2)}kg, 峰值:${peakLoss.toFixed(2)}kg`);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = '换浆损耗复盘系统';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('批次概要');
    this.buildSummarySheet(summarySheet, batch, stages, totalLoss, peakLoss);

    const lossSheet = workbook.addWorksheet('损耗明细');
    this.buildLossDetailSheet(lossSheet, segments, stages);

    const timelineSheet = workbook.addWorksheet('时间线');
    this.buildTimelineSheet(timelineSheet, batch, remarks);

    const snapshotSheet = workbook.addWorksheet('数据快照');
    await this.buildSnapshotSheet(snapshotSheet, batchId);

    const traceSheet = workbook.addWorksheet('计算追踪');
    this.buildTraceSheet(traceSheet, batch, segments, stages, totalLoss, peakLoss);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=loss-report-${batch.batchNo}-${moment().format('YYYYMMDD')}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

    this.logTrace(batchId, 'COMPLETE', '完整报告导出完成');
  }

  buildSummarySheet(sheet, batch, stages, totalLoss, peakLoss) {
    sheet.columns = [
      { header: '项目', key: 'item', width: 25 },
      { header: '内容', key: 'value', width: 40 }
    ];

    const summaryData = [
      { item: '批次号', value: batch.batchNo },
      { item: '机台编号', value: batch.machineId },
      { item: '原浆类型', value: batch.oldPulpType },
      { item: '新浆类型', value: batch.newPulpType },
      { item: '换浆开始时间', value: moment(batch.startTime).format('YYYY-MM-DD HH:mm:ss') },
      { item: '换浆结束时间', value: batch.endTime ? moment(batch.endTime).format('YYYY-MM-DD HH:mm:ss') : '-' },
      { item: '操作员', value: batch.operator || '-' },
      { item: '总损耗量(kg)', value: totalLoss.toFixed(2) },
      { item: '总损耗率(%)', value: batch.totalLossRate || '0.00' },
      { item: '单段损耗峰值(kg)', value: peakLoss.toFixed(2) },
      { item: '分段数', value: stages.length },
      { item: '复盘备注', value: batch.reviewRemark || '-' },
      { item: '复盘人', value: batch.reviewedBy || '-' },
      { item: '复盘时间', value: batch.reviewedAt ? moment(batch.reviewedAt).format('YYYY-MM-DD HH:mm:ss') : '-' },
      { item: '导出时间', value: moment().format('YYYY-MM-DD HH:mm:ss') }
    ];

    summaryData.forEach((row, idx) => {
      const excelRow = sheet.addRow(row);
      if (row.item.includes('损耗') || row.item.includes('峰值')) {
        excelRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0B2' } };
      }
    });

    sheet.getRow(1).font = { bold: true, size: 12 };
    sheet.getColumn('A').font = { bold: true };
  }

  buildLossDetailSheet(sheet, segments, stages) {
    sheet.columns = [
      { header: '分段类型', key: 'segmentType', width: 12 },
      { header: '分段名称', key: 'segmentName', width: 18 },
      { header: '阶段名称', key: 'stageName', width: 18 },
      { header: '开始时间', key: 'startTime', width: 20 },
      { header: '结束时间', key: 'endTime', width: 20 },
      { header: '时长(秒)', key: 'duration', width: 12 },
      { header: '流量差(L)', key: 'flowDifference', width: 14 },
      { header: '平均浓度(%)', key: 'avgConcentration', width: 14 },
      { header: '理论产出(kg)', key: 'theoreticalOutput', width: 15 },
      { header: '实际产出(kg)', key: 'actualOutput', width: 15 },
      { header: '损耗量(kg)', key: 'lossAmount', width: 14 },
      { header: '损耗率(%)', key: 'lossRate', width: 12 },
      { header: '关联备注数', key: 'remarkCount', width: 12 },
      { header: '备注', key: 'remark', width: 40 }
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EAED' } };

    segments.forEach(segment => {
      const segmentStages = stages.filter(s => s.segmentId === segment.id);
      segmentStages.forEach(stage => {
        const remarkCount = stage.remarkDetails ? stage.remarkDetails.length : 0;
        const row = sheet.addRow({
          segmentType: this.getSegmentTypeText(segment.segmentType),
          segmentName: segment.segmentName,
          stageName: stage.stageName,
          startTime: moment(stage.startTime).format('YYYY-MM-DD HH:mm:ss'),
          endTime: moment(stage.endTime).format('YYYY-MM-DD HH:mm:ss'),
          duration: stage.duration,
          flowDifference: stage.flowDifference,
          avgConcentration: stage.avgConcentration,
          theoreticalOutput: stage.theoreticalOutput,
          actualOutput: stage.actualOutput,
          lossAmount: stage.lossAmount,
          lossRate: stage.lossRate,
          remarkCount: remarkCount,
          remark: stage.remark || ''
        });

        if (parseFloat(stage.lossAmount || 0) > 50) {
          row.getCell('lossAmount').font = { bold: true, color: { argb: 'FFFF0000' } };
        }
      });
    });
  }

  buildTimelineSheet(sheet, batch, remarks) {
    sheet.columns = [
      { header: '序号', key: 'seq', width: 8 },
      { header: '时间', key: 'time', width: 22 },
      { header: '事件类型', key: 'eventType', width: 12 },
      { header: '内容', key: 'content', width: 50 },
      { header: '记录人', key: 'operator', width: 15 },
      { header: '持续(秒)', key: 'duration', width: 12 }
    ];

    sheet.getRow(1).font = { bold: true };

    let seq = 1;

    sheet.addRow({
      seq: seq++,
      time: moment(batch.startTime).format('YYYY-MM-DD HH:mm:ss'),
      eventType: '系统',
      content: '【换浆开始】',
      operator: batch.operator || '系统',
      duration: ''
    });

    remarks.forEach(remark => {
      sheet.addRow({
        seq: seq++,
        time: moment(remark.eventTime).format('YYYY-MM-DD HH:mm:ss'),
        eventType: this.getEventTypeText(remark.eventType),
        content: remark.remark || '',
        operator: remark.operator || '',
        duration: remark.duration || ''
      });
    });

    if (batch.endTime) {
      sheet.addRow({
        seq: seq++,
        time: moment(batch.endTime).format('YYYY-MM-DD HH:mm:ss'),
        eventType: '系统',
        content: '【换浆结束】',
        operator: '系统',
        duration: ''
      });
    }
  }

  async buildSnapshotSheet(sheet, batchId) {
    const snapshots = await db.LossSnapshot.findAll({
      where: { batchId },
      order: [['snapshotTime', 'ASC']]
    });

    sheet.columns = [
      { header: '快照时间', key: 'snapshotTime', width: 22 },
      { header: '快照类型', key: 'snapshotType', width: 12 },
      { header: '瞬时流量(L/min)', key: 'flowRate', width: 18 },
      { header: '累计流量(L)', key: 'totalFlow', width: 16 },
      { header: '浓度(%)', key: 'concentration', width: 12 },
      { header: '累计损耗(kg)', key: 'accumulatedLoss', width: 16 }
    ];

    sheet.getRow(1).font = { bold: true };

    snapshots.forEach(snapshot => {
      sheet.addRow({
        snapshotTime: moment(snapshot.snapshotTime).format('YYYY-MM-DD HH:mm:ss'),
        snapshotType: this.getSnapshotTypeText(snapshot.snapshotType),
        flowRate: snapshot.flowRate,
        totalFlow: snapshot.totalFlow,
        concentration: snapshot.concentration,
        accumulatedLoss: snapshot.accumulatedLoss
      });
    });
  }

  buildTraceSheet(sheet, batch, segments, stages, totalLoss, peakLoss) {
    sheet.columns = [
      { header: '项目', key: 'item', width: 30 },
      { header: '数值', key: 'value', width: 50 }
    ];

    sheet.getRow(1).font = { bold: true, size: 12 };

    const traceData = [
      { item: '【数据一致性校验】', value: '' },
      { item: '', value: '' },
      { item: '计算总损耗(kg)', value: totalLoss.toFixed(2) },
      { item: '批次表存储(kg)', value: batch.totalLoss || '0.00' },
      { item: '差值(kg)', value: Math.abs(totalLoss - parseFloat(batch.totalLoss || 0)).toFixed(4) },
      { item: '一致性状态', value: Math.abs(totalLoss - parseFloat(batch.totalLoss || 0)) < 0.01 ? '✓ 一致' : '⚠ 不一致' },
      { item: '', value: '' },
      { item: '【分段详情】', value: '' },
      { item: '主分段数', value: segments.filter(s => s.segmentType !== 'downtime').length },
      { item: '停机分段数', value: segments.filter(s => s.segmentType === 'downtime').length },
      { item: '', value: '' },
      { item: '【阶段损耗明细】', value: '' }
    ];

    stages.forEach((stage, idx) => {
      traceData.push({
        item: `  ${idx + 1}. ${stage.stageName}`,
        value: `损耗: ${stage.lossAmount}kg, 时长: ${stage.duration}秒`
      });
    });

    traceData.push({ item: '', value: '' });
    traceData.push({ item: '导出时间', value: moment().format('YYYY-MM-DD HH:mm:ss') });

    traceData.forEach(row => {
      sheet.addRow(row);
    });

    sheet.getColumn('A').font = { bold: true };
  }

  async exportBatchBrief(batchId, res) {
    this.logTrace(batchId, 'BRIEF_START', '开始导出简报');

    const reviewData = await lossCalculationService.getLossReviewData(batchId);
    const { batch, stages } = reviewData;

    const totalLoss = stages.reduce((sum, s) => sum + parseFloat(s.lossAmount || 0), 0);
    const peakLoss = stages.length > 0
      ? Math.max(...stages.map(s => parseFloat(s.lossAmount || 0)))
      : 0;

    this.logTrace(batchId, 'BRIEF_CALC', `总损耗:${totalLoss.toFixed(2)}, 峰值:${peakLoss.toFixed(2)}`);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('损耗简报');

    sheet.columns = [
      { header: '项目', key: 'item', width: 35 },
      { header: '数值', key: 'value', width: 35 }
    ];

    const data = [
      { item: '【换浆损耗简报】', value: '' },
      { item: '', value: '' },
      { item: '批次号', value: batch.batchNo },
      { item: '机台', value: batch.machineId },
      { item: '换浆类型', value: `${batch.oldPulpType} → ${batch.newPulpType}` },
      { item: '日期', value: moment(batch.startTime).format('YYYY-MM-DD') },
      { item: '开始时间', value: moment(batch.startTime).format('HH:mm:ss') },
      { item: '结束时间', value: batch.endTime ? moment(batch.endTime).format('HH:mm:ss') : '-' },
      { item: '', value: '' },
      { item: '总损耗量(kg)', value: totalLoss.toFixed(2) },
      { item: '总损耗率(%)', value: batch.totalLossRate || '0.00' },
      { item: '单段损耗峰值(kg)', value: peakLoss.toFixed(2) },
      { item: '', value: '' },
      { item: '【阶段损耗明细】', value: '' }
    ];

    data.forEach(row => {
      const excelRow = sheet.addRow(row);
      if (row.item.includes('【')) {
        excelRow.font = { bold: true, size: 14 };
      } else if (row.item.includes('损耗') || row.item.includes('峰值')) {
        excelRow.font = { bold: true };
        excelRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0B2' } };
      }
    });

    const peakStage = stages.reduce((max, s) =>
      parseFloat(s.lossAmount || 0) > parseFloat(max.lossAmount || 0) ? s : max, stages[0] || {});

    if (peakStage && peakStage.lossAmount) {
      sheet.addRow({
        item: '  损耗最高阶段',
        value: `${peakStage.stageName} (${peakStage.lossAmount}kg)`
      });
    }

    stages.forEach(stage => {
      const row = sheet.addRow({
        item: `  ${stage.stageName}`,
        value: `${stage.lossAmount}kg (${stage.lossRate}%)`
      });
      if (parseFloat(stage.lossAmount || 0) === parseFloat(peakLoss)) {
        row.font = { bold: true, color: { argb: 'FFFF0000' } };
      }
    });

    sheet.addRow({ item: '', value: '' });
    sheet.addRow({
      item: '导出时间',
      value: moment().format('YYYY-MM-DD HH:mm:ss')
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=brief-${batch.batchNo}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

    this.logTrace(batchId, 'BRIEF_COMPLETE', '简报导出完成');
  }

  getSegmentTypeText(type) {
    const typeMap = {
      preparation: '准备',
      switching: '切换',
      stabilization: '稳定',
      completion: '完成',
      downtime: '停机'
    };
    return typeMap[type] || type;
  }

  getEventTypeText(type) {
    const typeMap = {
      start: '开始',
      pause: '暂停',
      resume: '恢复',
      stop: '停止',
      note: '备注'
    };
    return typeMap[type] || type;
  }

  getSnapshotTypeText(type) {
    const typeMap = {
      start: '开始',
      interval: '中间',
      end: '结束'
    };
    return typeMap[type] || type;
  }

  async exportBatchBriefList(batchIds, res) {
    console.log(`[批量导出] 开始导出 ${batchIds.length} 个批次的简报`);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = '换浆损耗复盘系统';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('汇总');
    const summaryData = [];

    for (let i = 0; i < batchIds.length; i++) {
      const batchId = batchIds[i];
      try {
        const reviewData = await lossCalculationService.getLossReviewData(batchId);
        const { batch, stages } = reviewData;

        const totalLoss = stages.reduce((sum, s) => sum + parseFloat(s.lossAmount || 0), 0);
        const peakLoss = stages.length > 0
          ? Math.max(...stages.map(s => parseFloat(s.lossAmount || 0)))
          : 0;

        summaryData.push({
          no: i + 1,
          batchNo: batch.batchNo,
          machineId: batch.machineId,
          pulpType: `${batch.oldPulpType}→${batch.newPulpType}`,
          date: moment(batch.startTime).format('YYYY-MM-DD'),
          totalLoss: totalLoss.toFixed(2),
          totalLossRate: batch.totalLossRate || '0.00',
          peakLoss: peakLoss.toFixed(2),
          status: this.getStatusText(batch.status)
        });

        const sheetName = `简报${i + 1}-${batch.batchNo.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '')}`.slice(0, 31);
        await this.buildBriefSheet(workbook, sheetName, batch, stages, totalLoss, peakLoss);

        console.log(`[批量导出] ${i + 1}/${batchIds.length} - ${batch.batchNo} 完成`);
      } catch (error) {
        console.error(`[批量导出] 批次 ${batchId} 导出失败:`, error);
      }
    }

    this.buildBatchSummarySheet(summarySheet, summaryData);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=batch-briefs-${moment().format('YYYYMMDD-HHmmss')}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

    console.log(`[批量导出] 完成，共 ${summaryData.length}/${batchIds.length} 个成功`);
  }

  async buildBriefSheet(workbook, sheetName, batch, stages, totalLoss, peakLoss) {
    const sheet = workbook.addWorksheet(sheetName);

    sheet.columns = [
      { header: '项目', key: 'item', width: 30 },
      { header: '数值', key: 'value', width: 35 }
    ];

    const data = [
      { item: '【换浆损耗简报】', value: '' },
      { item: '', value: '' },
      { item: '批次号', value: batch.batchNo },
      { item: '机台', value: batch.machineId },
      { item: '换浆类型', value: `${batch.oldPulpType} → ${batch.newPulpType}` },
      { item: '日期', value: moment(batch.startTime).format('YYYY-MM-DD') },
      { item: '开始时间', value: moment(batch.startTime).format('HH:mm:ss') },
      { item: '结束时间', value: batch.endTime ? moment(batch.endTime).format('HH:mm:ss') : '-' },
      { item: '', value: '' },
      { item: '总损耗量(kg)', value: totalLoss.toFixed(2) },
      { item: '总损耗率(%)', value: batch.totalLossRate || '0.00' },
      { item: '单段损耗峰值(kg)', value: peakLoss.toFixed(2) },
      { item: '', value: '' },
      { item: '【阶段损耗明细】', value: '' }
    ];

    data.forEach(row => {
      const excelRow = sheet.addRow(row);
      if (row.item.includes('【')) {
        excelRow.font = { bold: true, size: 14 };
      } else if (row.item.includes('损耗') || row.item.includes('峰值')) {
        excelRow.font = { bold: true };
        excelRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0B2' } };
      }
    });

    stages.forEach(stage => {
      const row = sheet.addRow({
        item: `  ${stage.stageName}`,
        value: `${stage.lossAmount}kg (${stage.lossRate}%)`
      });
      if (parseFloat(stage.lossAmount || 0) === parseFloat(peakLoss)) {
        row.font = { bold: true, color: { argb: 'FFFF0000' } };
      }
    });

    sheet.addRow({ item: '', value: '' });
    sheet.addRow({
      item: '导出时间',
      value: moment().format('YYYY-MM-DD HH:mm:ss')
    });

    sheet.getColumn('A').font = { bold: true };
  }

  buildBatchSummarySheet(sheet, summaryData) {
    sheet.columns = [
      { header: '序号', key: 'no', width: 8 },
      { header: '批次号', key: 'batchNo', width: 18 },
      { header: '机台', key: 'machineId', width: 10 },
      { header: '换浆类型', key: 'pulpType', width: 20 },
      { header: '日期', key: 'date', width: 12 },
      { header: '总损耗(kg)', key: 'totalLoss', width: 14 },
      { header: '损耗率(%)', key: 'totalLossRate', width: 12 },
      { header: '峰值损耗(kg)', key: 'peakLoss', width: 14 },
      { header: '状态', key: 'status', width: 10 }
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EAED' } };

    summaryData.forEach((row, idx) => {
      const excelRow = sheet.addRow(row);
      if (parseFloat(row.totalLoss) > 150) {
        excelRow.getCell('totalLoss').font = { bold: true, color: { argb: 'FFFF0000' } };
      }
    });

    if (summaryData.length > 0) {
      const avgLoss = summaryData.reduce((sum, r) => sum + parseFloat(r.totalLoss), 0) / summaryData.length;
      sheet.addRow([]);
      sheet.addRow({
        no: '',
        batchNo: '合计/平均',
        totalLoss: avgLoss.toFixed(2),
        peakLoss: Math.max(...summaryData.map(r => parseFloat(r.peakLoss))).toFixed(2)
      });
    }
  }

  getStatusText(status) {
    const statusMap = {
      pending: '待处理',
      processing: '计算中',
      completed: '已完成',
      reviewed: '已复盘'
    };
    return statusMap[status] || status;
  }
}

module.exports = new ReportExportService();
