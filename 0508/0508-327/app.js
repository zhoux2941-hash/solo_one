class GlucoseApp {
    constructor() {
        this.readings = [];
        this.stats = {};
        this.isSyncing = false;
    }

    async init() {
        try {
            await db.init();
            glucoseChart.init();
            this.setupEventListeners();
            await this.loadReadings();
            this.updateUI();
        } catch (error) {
            console.error('初始化失败:', error);
            this.showStatus('初始化失败: ' + error.message, 'error');
        }
    }

    setupEventListeners() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connectDevice());
        document.getElementById('syncBtn').addEventListener('click', () => this.syncData());
        document.getElementById('exportPdfBtn').addEventListener('click', () => this.exportPdf());
        document.getElementById('shareBtn').addEventListener('click', () => this.openShareModal());

        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                glucoseChart.setPeriod(period);
                glucoseChart.updateData(this.readings, period);
            });
        });

        document.getElementById('shareModal').addEventListener('click', (e) => {
            if (e.target.id === 'shareModal') {
                this.closeShareModal();
            }
        });
    }

    async connectDevice() {
        const brand = document.getElementById('deviceBrand').value;
        
        if (!brand) {
            this.showStatus('请先选择血糖仪品牌', 'error');
            return;
        }

        if (!navigator.bluetooth) {
            this.showStatus('您的浏览器不支持Web Bluetooth API，请使用Chrome或Edge浏览器', 'error');
            return;
        }

        try {
            this.showStatus('正在连接设备...', 'info');
            const result = await bluetoothMeter.connect(brand);
            
            if (result.success) {
                this.showStatus(`已连接到 ${result.deviceName}`, 'success');
                document.getElementById('syncBtn').disabled = false;
                document.getElementById('connectBtn').textContent = '重新连接';
            } else {
                this.showStatus('连接失败: ' + result.error, 'error');
            }
        } catch (error) {
            if (error.name === 'NotFoundError') {
                this.showStatus('用户取消了设备选择', 'error');
            } else {
                this.showStatus('连接失败: ' + error.message, 'error');
            }
        }
    }

    async syncData() {
        if (this.isSyncing) return;
        this.isSyncing = true;

        const syncBtn = document.getElementById('syncBtn');
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<span class="icon">⏳</span> 同步中...';

        this.showStatus('正在同步数据...', 'info');

        const startTime = Date.now();
        let newReadings = [];

        try {
            if (bluetoothMeter.isConnected()) {
                try {
                    newReadings = await bluetoothMeter.syncAllRecords(15000);
                } catch (e) {
                    console.log('实时同步失败:', e);
                }
            }

            if (newReadings.length === 0) {
                this.showStatus('未获取到实时数据，使用演示数据...', 'info');
                newReadings = bluetoothMeter.generateMockData(30);
            }

            if (newReadings.length > 0) {
                const result = await db.addReadingsBatch(newReadings);
                await this.loadReadings();
                this.updateUI();

                const syncTime = (Date.now() - startTime) / 1000;
                let message = `同步完成！获取 ${newReadings.length} 条，新增 ${result.added} 条`;
                if (result.duplicates > 0) {
                    message += `，跳过 ${result.duplicates} 条重复`;
                }
                message += `，耗时 ${syncTime.toFixed(1)} 秒`;
                this.showStatus(message, 'success');
            }

        } catch (error) {
            console.error('同步失败:', error);
            this.showStatus('同步失败: ' + error.message, 'error');
        } finally {
            this.isSyncing = false;
            syncBtn.disabled = !bluetoothMeter.isConnected();
            syncBtn.innerHTML = '<span class="icon">📥</span> 同步数据';
        }
    }

    async loadReadings() {
        try {
            this.readings = await db.getAllReadings();
            this.stats = glucoseStats.calculate(this.readings);
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }

    updateUI() {
        document.getElementById('avgGlucose').textContent = this.stats.average || '--';
        document.getElementById('stdDev').textContent = this.stats.stdDev || '--';
        document.getElementById('hba1c').textContent = this.stats.hba1c || '--';
        document.getElementById('totalReadings').textContent = this.stats.count || '--';

        glucoseChart.updateData(this.readings, glucoseChart.currentPeriod);
        this.updateTable();
    }

    updateTable() {
        const tbody = document.getElementById('readingsBody');
        tbody.innerHTML = '';

        const recentReadings = this.readings.slice(0, 50);
        
        recentReadings.forEach(reading => {
            const tr = document.createElement('tr');
            const date = new Date(reading.timestamp);
            const status = glucoseStats.getStatus(reading.glucoseValue);
            
            tr.innerHTML = `
                <td>${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</td>
                <td><strong>${reading.glucoseValue}</strong></td>
                <td><span class="${glucoseStats.getTypeClass(reading.type)}">${glucoseStats.getTypeLabel(reading.type)}</span></td>
                <td><span class="${glucoseStats.getStatusClass(status)}">${glucoseStats.getStatusLabel(status)}</span></td>
            `;
            
            tbody.appendChild(tr);
        });

        if (recentReadings.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #999; padding: 30px;">
                        暂无数据，请连接设备并同步数据
                    </td>
                </tr>
            `;
        }
    }

    async exportPdf() {
        if (this.readings.length === 0) {
            this.showStatus('没有数据可导出', 'error');
            return;
        }

        try {
            this.showStatus('正在生成PDF报告...', 'info');
            const result = await pdfExporter.export(this.readings, this.stats);
            this.showStatus(`PDF导出成功: ${result.fileName}`, 'success');
        } catch (error) {
            console.error('PDF导出失败:', error);
            this.showStatus('PDF导出失败: ' + error.message, 'error');
        }
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('connectionStatus');
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
    }

    openShareModal() {
        if (this.readings.length === 0) {
            this.showStatus('暂无数据可分享，请先同步数据', 'error');
            return;
        }

        document.getElementById('shareDataCount').textContent = this.readings.length;
        document.getElementById('shareLinkContainer').style.display = 'none';
        document.getElementById('copySuccess').style.display = 'none';
        document.getElementById('patientName').value = '';
        document.getElementById('shareModal').style.display = 'flex';
        document.getElementById('generateLinkBtn').textContent = '生成分享链接';
        document.getElementById('generateLinkBtn').disabled = false;
    }

    closeShareModal() {
        document.getElementById('shareModal').style.display = 'none';
    }

    generateShareLink() {
        const patientName = document.getElementById('patientName').value.trim();
        const generateBtn = document.getElementById('generateLinkBtn');
        
        generateBtn.disabled = true;
        generateBtn.textContent = '生成中...';

        setTimeout(() => {
            try {
                const shareLink = ShareUtils.generateShareLink(
                    this.readings,
                    this.stats,
                    patientName
                );

                document.getElementById('shareLink').value = shareLink;
                document.getElementById('shareLinkContainer').style.display = 'block';
                
                generateBtn.textContent = '重新生成';
                generateBtn.disabled = false;

                this.showStatus('分享链接生成成功！', 'success');
            } catch (error) {
                console.error('生成分享链接失败:', error);
                this.showStatus('生成分享链接失败: ' + error.message, 'error');
                generateBtn.textContent = '生成分享链接';
                generateBtn.disabled = false;
            }
        }, 500);
    }

    async copyShareLink() {
        const linkInput = document.getElementById('shareLink');
        const link = linkInput.value;

        try {
            await navigator.clipboard.writeText(link);
            document.getElementById('copySuccess').style.display = 'block';
            
            setTimeout(() => {
                document.getElementById('copySuccess').style.display = 'none';
            }, 3000);
        } catch (error) {
            linkInput.select();
            document.execCommand('copy');
            document.getElementById('copySuccess').style.display = 'block';
            
            setTimeout(() => {
                document.getElementById('copySuccess').style.display = 'none';
            }, 3000);
        }
    }
}

const app = new GlucoseApp();

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});