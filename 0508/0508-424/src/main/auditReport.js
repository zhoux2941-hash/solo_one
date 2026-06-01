const { AuditDB, CardDB, LogDB } = require('./database');
const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class AuditReportGenerator {
  constructor() {
    this.chartCanvas = new ChartJSNodeCanvas({
      width: 800,
      height: 400,
      type: 'svg',
      chartCallback: (ChartJS) => {
        ChartJS.defaults.color = '#333333';
        ChartJS.defaults.font.family = 'Arial';
      }
    });
  }

  async generateHeatmap(uid, startDate, endDate) {
    const data = AuditDB.getHeatmapData(uid, startDate, endDate);
    
    const heatmapData = Array(7).fill(null).map(() => Array(24).fill(0));
    
    data.forEach(item => {
      const day = parseInt(item.day_of_week);
      const hour = parseInt(item.hour);
      heatmapData[day][hour] = item.count;
    });

    const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

    const configuration = {
      type: 'bar',
      data: {
        labels: hourLabels,
        datasets: labels.map((day, dayIdx) => ({
          label: day,
          data: heatmapData[dayIdx],
          backgroundColor: this.getHeatmapColor(heatmapData[dayIdx]),
          stack: 'Stack ' + dayIdx
        }))
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '使用频率热力图 (周日-周六 / 0-23时)',
            font: { size: 16 }
          },
          legend: { position: 'bottom' }
        },
        scales: {
          x: {
            stacked: true,
            title: { display: true, text: '小时' }
          },
          y: {
            stacked: true,
            title: { display: true, text: '使用次数' }
          }
        }
      }
    };

    return await this.chartCanvas.renderToBuffer(configuration, 'image/png');
  }

  getHeatmapColor(data) {
    const max = Math.max(...data, 1);
    return data.map(v => {
      const intensity = v / max;
      const r = Math.floor(255 * (1 - intensity));
      const g = Math.floor(255 * (1 - intensity * 0.5));
      const b = 255;
      return `rgba(${r}, ${g}, ${b}, 0.8)`;
    });
  }

  async generateTimeDistributionChart(uid, startDate, endDate) {
    const data = AuditDB.getTimeDistribution(uid, startDate, endDate);
    
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const counts = Array(24).fill(0);
    
    data.forEach(item => {
      const hour = parseInt(item.hour);
      counts[hour] = item.count;
    });

    const configuration = {
      type: 'line',
      data: {
        labels: hours,
        datasets: [{
          label: '使用次数',
          data: counts,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '24小时时间分布',
            font: { size: 16 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            title: { display: true, text: '使用次数' }
          },
          x: {
            title: { display: true, text: '时间' }
          }
        }
      }
    };

    return await this.chartCanvas.renderToBuffer(configuration, 'image/png');
  }

  async generateUsageByLocationChart(uid, startDate, endDate) {
    const data = AuditDB.getUsageByLocation(uid, startDate, endDate);
    
    const labels = data.map(d => d.location || d.reader_id || '未知');
    const counts = data.map(d => d.count);

    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)'
    ];

    const configuration = {
      type: 'pie',
      data: {
        labels: labels.length > 0 ? labels : ['无数据'],
        datasets: [{
          data: counts.length > 0 ? counts : [1],
          backgroundColor: colors.slice(0, Math.max(labels.length, 1))
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '按地点使用分布',
            font: { size: 16 }
          },
          legend: { position: 'right' }
        }
      }
    };

    return await this.chartCanvas.renderToBuffer(configuration, 'image/png');
  }

  async generatePDFReport(uid, startDate, endDate, outputPath) {
    const card = CardDB.getCardByUid(uid);
    if (!card) {
      throw new Error('卡片不存在');
    }

    const records = AuditDB.getRecordsByUid(uid, startDate, endDate);
    const stats = AuditDB.getStatistics(uid, startDate, endDate);
    const locationData = AuditDB.getUsageByLocation(uid, startDate, endDate);

    const totalEmulates = records.filter(r => r.action === 'emulate').length;
    const uniqueLocations = new Set(records.filter(r => r.location).map(r => r.location)).size;

    const [heatmapBuffer, timeChartBuffer, locationChartBuffer] = await Promise.all([
      this.generateHeatmap(uid, startDate, endDate),
      this.generateTimeDistributionChart(uid, startDate, endDate),
      this.generateUsageByLocationChart(uid, startDate, endDate)
    ]);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      doc.fontSize(24).text('NFC门禁卡审计报告', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`生成时间: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(18).text('一、卡片基本信息', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`卡片名称: ${card.name}`);
      doc.text(`UID: ${card.uid}`);
      doc.text(`SAK: ${card.sak}`);
      doc.text(`ATQA: ${card.atqa}`);
      doc.text(`卡片类型: ${card.card_type}`);
      doc.text(`统计时间: ${startDate || '开始'} 至 ${endDate || '现在'}`);
      doc.moveDown();

      doc.fontSize(18).text('二、使用统计概览', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`总模拟次数: ${totalEmulates} 次`);
      doc.text(`涉及门禁数量: ${uniqueLocations} 个`);
      doc.text(`总记录条数: ${records.length} 条`);
      doc.moveDown();

      if (locationData.length > 0) {
        doc.text('各地点使用情况:');
        locationData.forEach((item, idx) => {
          doc.text(`  ${idx + 1}. ${item.location || item.reader_id || '未知'}: ${item.count} 次`);
        });
      }
      doc.moveDown();

      doc.fontSize(18).text('三、使用频率热力图', { underline: true });
      doc.moveDown();
      doc.image(heatmapBuffer, { fit: [500, 250], align: 'center' });
      doc.moveDown(2);

      doc.addPage();
      doc.fontSize(18).text('四、时间分布折线图', { underline: true });
      doc.moveDown();
      doc.image(timeChartBuffer, { fit: [500, 250], align: 'center' });
      doc.moveDown(2);

      doc.fontSize(18).text('五、地点分布饼图', { underline: true });
      doc.moveDown();
      doc.image(locationChartBuffer, { fit: [400, 300], align: 'center' });
      doc.moveDown(2);

      doc.addPage();
      doc.fontSize(18).text('六、详细记录', { underline: true });
      doc.moveDown();
      doc.fontSize(10);

      const tableHeaders = ['序号', '时间', '操作', '读头ID', '地点'];
      const colWidths = [40, 140, 60, 120, 150];
      let yPosition = doc.y;

      tableHeaders.forEach((header, i) => {
        const xPosition = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(header, xPosition, yPosition, { width: colWidths[i], bold: true });
      });
      yPosition += 20;

      records.slice(0, 100).forEach((record, idx) => {
        if (yPosition > 780) {
          doc.addPage();
          yPosition = 50;
          tableHeaders.forEach((header, i) => {
            const xPosition = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.text(header, xPosition, yPosition, { width: colWidths[i], bold: true });
          });
          yPosition += 20;
        }

        const actionText = record.action === 'emulate' ? '模拟' : 
                          record.action === 'emulate_start' ? '启动' : '停止';
        
        doc.text((idx + 1).toString(), 50, yPosition, { width: colWidths[0] });
        doc.text(record.timestamp, 90, yPosition, { width: colWidths[1] });
        doc.text(actionText, 230, yPosition, { width: colWidths[2] });
        doc.text(record.reader_id || '-', 290, yPosition, { width: colWidths[3] });
        doc.text(record.location || '-', 410, yPosition, { width: colWidths[4] });
        
        yPosition += 15;
      });

      if (records.length > 100) {
        doc.moveDown();
        doc.fontSize(10).text(`... 共 ${records.length} 条记录，仅显示前100条`, { align: 'center' });
      }

      doc.end();

      stream.on('finish', () => {
        LogDB.addLog('report_generated', uid, { outputPath, startDate, endDate });
        resolve(outputPath);
      });

      stream.on('error', reject);
    });
  }

  async generateAllCardsReport(startDate, endDate, outputPath) {
    const cards = CardDB.getAllCards();
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    doc.fontSize(24).text('所有卡片审计汇总报告', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`生成时间: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(18).text('卡片统计概览', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`总卡片数量: ${cards.length} 张`);
    doc.moveDown();

    const tableHeaders = ['序号', '卡片名称', 'UID', '模拟次数', '涉及地点'];
    const colWidths = [40, 120, 140, 80, 100];
    let yPosition = doc.y;

    tableHeaders.forEach((header, i) => {
      const xPosition = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(header, xPosition, yPosition, { width: colWidths[i], bold: true });
    });
    yPosition += 20;

    for (let idx = 0; idx < cards.length; idx++) {
      const card = cards[idx];
      const records = AuditDB.getRecordsByUid(card.uid, startDate, endDate);
      const emulateCount = records.filter(r => r.action === 'emulate').length;
      const locations = new Set(records.filter(r => r.location).map(r => r.location));

      if (yPosition > 780) {
        doc.addPage();
        yPosition = 50;
        tableHeaders.forEach((header, i) => {
          const xPosition = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.text(header, xPosition, yPosition, { width: colWidths[i], bold: true });
        });
        yPosition += 20;
      }

      doc.text((idx + 1).toString(), 50, yPosition, { width: colWidths[0] });
      doc.text(card.name, 90, yPosition, { width: colWidths[1] });
      doc.text(card.uid, 210, yPosition, { width: colWidths[2] });
      doc.text(emulateCount.toString(), 350, yPosition, { width: colWidths[3] });
      doc.text(locations.size.toString(), 430, yPosition, { width: colWidths[4] });
      
      yPosition += 15;
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        LogDB.addLog('summary_report_generated', null, { outputPath, startDate, endDate });
        resolve(outputPath);
      });
      stream.on('error', reject);
    });
  }

  getAuditStatistics(uid, startDate, endDate) {
    const records = AuditDB.getRecordsByUid(uid, startDate, endDate);
    const locationData = AuditDB.getUsageByLocation(uid, startDate, endDate);
    const timeDistribution = AuditDB.getTimeDistribution(uid, startDate, endDate);
    const heatmapData = AuditDB.getHeatmapData(uid, startDate, endDate);

    const totalEmulates = records.filter(r => r.action === 'emulate').length;
    const totalStarts = records.filter(r => r.action === 'emulate_start').length;
    const totalStops = records.filter(r => r.action === 'emulate_stop').length;

    return {
      summary: {
        totalEmulates,
        totalStarts,
        totalStops,
        totalRecords: records.length,
        uniqueLocations: new Set(records.filter(r => r.location).map(r => r.location)).size,
        uniqueReaders: new Set(records.filter(r => r.reader_id).map(r => r.reader_id)).size
      },
      byLocation: locationData,
      byTime: timeDistribution,
      heatmap: heatmapData,
      records: records
    };
  }
}

module.exports = AuditReportGenerator;
