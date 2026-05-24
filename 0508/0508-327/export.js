class PdfExporter {
    constructor() {
        this.jsPDF = window.jspdf.jsPDF;
    }

    async export(readings, stats) {
        const doc = new this.jsPDF('portrait', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let y = margin;

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('血糖监测报告', pageWidth / 2, y, { align: 'center' });
        y += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const dateStr = new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.text(`生成日期: ${dateStr}`, pageWidth / 2, y, { align: 'center' });
        y += 15;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('统计摘要', margin, y);
        y += 8;

        const statsData = [
            ['指标', '数值', '单位'],
            ['平均血糖', stats.average.toString(), 'mmol/L'],
            ['标准差', stats.stdDev.toString(), 'mmol/L'],
            ['预估 HbA1c', stats.hba1c.toString(), '%'],
            ['测量次数', stats.count.toString(), '次'],
            ['最低值', stats.min.toString(), 'mmol/L'],
            ['最高值', stats.max.toString(), 'mmol/L']
        ];

        this.drawTable(doc, statsData, margin, y, pageWidth - margin * 2);
        y += statsData.length * 7 + 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('正常血糖范围: 3.9 - 10.0 mmol/L', margin, y);
        doc.setTextColor(0, 0, 0);
        y += 10;

        if (y + 120 > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('血糖趋势图', margin, y);
        y += 10;

        const chartCanvas = document.getElementById('glucoseChart');
        if (chartCanvas) {
            try {
                const chartImgData = chartCanvas.toDataURL('image/png', 1.0);
                const chartWidth = pageWidth - margin * 2;
                const chartHeight = (chartWidth / chartCanvas.width) * chartCanvas.height;
                doc.addImage(chartImgData, 'PNG', margin, y, chartWidth, chartHeight);
                y += chartHeight + 10;
            } catch (e) {
                console.log('图表导出失败:', e);
            }
        }

        if (y + 50 > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('最近测量记录', margin, y);
        y += 8;

        const recentReadings = readings.slice(0, 15);
        const tableData = [
            ['时间', '血糖值', '标记', '状态']
        ];

        recentReadings.forEach(reading => {
            const date = new Date(reading.timestamp);
            const dateStr = date.toLocaleDateString('zh-CN');
            const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            const typeLabel = this.getTypeLabel(reading.type);
            const status = this.getStatus(reading.glucoseValue);
            const statusLabel = this.getStatusLabel(status);

            tableData.push([
                `${dateStr} ${timeStr}`,
                `${reading.glucoseValue} mmol/L`,
                typeLabel,
                statusLabel
            ]);
        });

        this.drawTable(doc, tableData, margin, y, pageWidth - margin * 2);
        y += tableData.length * 7 + 15;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text('🔒 隐私保护: 本报告数据仅存储于本地设备', pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text(`第 ${i} 页 / 共 ${pageCount} 页`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        }

        const fileName = `血糖报告_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);

        return { success: true, fileName };
    }

    drawTable(doc, data, x, y, width) {
        const colCount = data[0].length;
        const colWidth = width / colCount;
        const rowHeight = 7;

        data.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const cellX = x + colIndex * colWidth;
                const cellY = y + rowIndex * rowHeight;

                doc.setDrawColor(200, 200, 200);
                doc.rect(cellX, cellY - rowHeight + 2, colWidth, rowHeight);

                if (rowIndex === 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(255, 255, 255);
                    doc.setFillColor(102, 126, 234);
                    doc.rect(cellX, cellY - rowHeight + 2, colWidth, rowHeight, 'F');
                } else {
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(0, 0, 0);
                }

                doc.setFontSize(9);
                doc.text(cell, cellX + 2, cellY, { maxWidth: colWidth - 4 });
            });
        });

        doc.setTextColor(0, 0, 0);
    }

    getTypeLabel(type) {
        switch (type) {
            case 'before_meal': return '餐前';
            case 'after_meal': return '餐后';
            case 'fasting': return '空腹';
            case 'casual': return '随机';
            default: return '未标记';
        }
    }

    getStatus(glucoseValue) {
        if (glucoseValue < 3.9) return 'low';
        if (glucoseValue > 10.0) return 'high';
        return 'normal';
    }

    getStatusLabel(status) {
        switch (status) {
            case 'low': return '偏低';
            case 'high': return '偏高';
            default: return '正常';
        }
    }
}

const pdfExporter = new PdfExporter();