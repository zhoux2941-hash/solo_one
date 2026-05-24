class PLCDataCollector {
    constructor() {
        this.modbus = new ModbusRTU();
        this.db = new PLCDataBase();
        this.monitors = [];
        this.isConnected = false;
        this.isRecording = false;
        this.recordInterval = 5000;
        this.pollInterval = null;
        this.recordTimer = null;
        this.maxMonitors = 50;
        this.isPolling = false;
        this.pollDelay = 2000;
        
        this.chart = null;
        this.chartTimer = null;
        this.selectedMonitors = new Set();
        this.chartColors = [
            '#00d4ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
            '#14b8a6', '#a855f7', '#22c55e', '#eab308', '#3b82f6'
        ];
        
        this.init();
    }

    async init() {
        try {
            await this.db.init();
            const savedMonitors = await this.db.getMonitors();
            this.monitors = savedMonitors;
            this.updateMonitorList();
            this.updateDashboard();
            this.updateMonitorSelector();
            this.initChart();
        } catch (error) {
            this.log('error', `数据库初始化失败: ${error.message}`);
        }
        
        this.bindEvents();
        this.log('info', 'PLC数据采集工具已就绪');
    }

    bindEvents() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connect());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.disconnect());
        document.getElementById('addMonitorBtn').addEventListener('click', () => this.addMonitor());
        document.getElementById('writeBtn').addEventListener('click', () => this.writeValue());
        document.getElementById('startRecordBtn').addEventListener('click', () => this.startRecording());
        document.getElementById('stopRecordBtn').addEventListener('click', () => this.stopRecording());
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearData());
        document.getElementById('dataType').addEventListener('change', (e) => this.toggleDataTypeOptions(e));
        document.getElementById('writeType').addEventListener('change', (e) => this.toggleWriteOptions(e));
        
        document.getElementById('refreshChartBtn').addEventListener('click', () => this.refreshChart());
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.resetChartZoom());
        document.getElementById('timeRange').addEventListener('change', () => this.refreshChart());
        document.getElementById('autoRefresh').addEventListener('change', () => this.toggleAutoRefresh());
    }

    toggleDataTypeOptions(e) {
        const dataTypeGroup = document.getElementById('dataTypeGroup');
        const type = e.target.value;
        dataTypeGroup.style.display = (type === 'coil' || type === 'discrete') ? 'none' : 'block';
    }

    toggleWriteOptions(e) {
        const writeValueGroup = document.getElementById('writeValueGroup');
        const writeCoilGroup = document.getElementById('writeCoilGroup');
        const type = e.target.value;
        
        if (type === 'coil') {
            writeValueGroup.style.display = 'none';
            writeCoilGroup.style.display = 'block';
        } else {
            writeValueGroup.style.display = 'block';
            writeCoilGroup.style.display = 'none';
        }
    }

    async connect() {
        try {
            if (!navigator.serial) {
                throw new Error('您的浏览器不支持WebSerial API，请使用Chrome或Edge浏览器');
            }

            const port = await navigator.serial.requestPort();
            
            const baudRate = parseInt(document.getElementById('baudRate').value);
            const dataBits = parseInt(document.getElementById('dataBits').value);
            const stopBits = parseInt(document.getElementById('stopBits').value);
            const parity = document.getElementById('parity').value;
            this.modbus.slaveAddress = parseInt(document.getElementById('slaveAddress').value);

            await port.open({
                baudRate,
                dataBits,
                stopBits,
                parity,
                flowControl: 'none'
            });

            this.modbus.port = port;
            this.modbus.reader = port.readable.getReader();
            this.modbus.writer = port.writable.getWriter();

            this.isConnected = true;
            this.updateConnectionStatus();
            this.startPolling();
            this.toggleAutoRefresh();
            this.log('info', `串口连接成功 - 波特率: ${baudRate}`);
        } catch (error) {
            this.log('error', `连接失败: ${error.message}`);
        }
    }

    async disconnect() {
        try {
            this.stopPolling();
            this.stopRecording();
            this.stopAutoRefresh();
            
            if (this.modbus.reader) {
                try {
                    await this.modbus.reader.cancel();
                } catch (e) {}
                this.modbus.reader.releaseLock();
            }
            
            if (this.modbus.writer) {
                await this.modbus.writer.releaseLock();
            }
            
            if (this.modbus.port) {
                await this.modbus.port.close();
            }

            this.modbus.reader = null;
            this.modbus.writer = null;
            this.modbus.port = null;
            this.isConnected = false;
            
            this.updateConnectionStatus();
            this.log('info', '串口已断开');
        } catch (error) {
            this.log('error', `断开连接失败: ${error.message}`);
        }
    }

    updateConnectionStatus() {
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const writeBtn = document.getElementById('writeBtn');
        const startRecordBtn = document.getElementById('startRecordBtn');
        const stopRecordBtn = document.getElementById('stopRecordBtn');

        if (this.isConnected) {
            indicator.className = 'status-indicator connected';
            statusText.textContent = '已连接';
            connectBtn.disabled = true;
            disconnectBtn.disabled = false;
            writeBtn.disabled = false;
            startRecordBtn.disabled = false;
            document.getElementById('exportDataBtn').disabled = false;
            document.getElementById('clearDataBtn').disabled = false;
        } else {
            indicator.className = this.isRecording ? 'status-indicator recording' : 'status-indicator disconnected';
            statusText.textContent = this.isRecording ? '记录中' : '未连接';
            connectBtn.disabled = false;
            disconnectBtn.disabled = true;
            writeBtn.disabled = true;
            startRecordBtn.disabled = true;
            stopRecordBtn.disabled = true;
        }
    }

    addMonitor() {
        if (this.monitors.length >= this.maxMonitors) {
            this.log('error', `最多只能监控${this.maxMonitors}个寄存器`);
            return;
        }

        const type = document.getElementById('dataType').value;
        const address = parseInt(document.getElementById('registerAddress').value);
        const name = document.getElementById('registerName').value || `寄存器${address}`;
        const dataFormat = document.getElementById('dataFormat').value;
        const scaleFactor = parseFloat(document.getElementById('scaleFactor').value);
        const offset = parseFloat(document.getElementById('offset').value);

        const exists = this.monitors.some(m => m.type === type && m.address === address);
        if (exists) {
            this.log('error', '该监控点已存在');
            return;
        }

        const monitor = {
            id: Date.now(),
            type,
            address,
            name,
            dataFormat: (type === 'coil' || type === 'discrete') ? 'boolean' : dataFormat,
            scaleFactor,
            offset,
            value: null,
            timestamp: null
        };

        this.monitors.push(monitor);
        this.db.saveMonitor(monitor).catch(() => {});
        
        this.updateMonitorList();
        this.updateDashboard();
        this.updateMonitorSelector();
        this.log('info', `已添加监控点: ${name} (${type} @ ${address})`);
    }

    removeMonitor(index) {
        const monitor = this.monitors[index];
        if (monitor.id) {
            this.db.deleteMonitor(monitor.id).catch(() => {});
            this.selectedMonitors.delete(monitor.id);
        }
        this.monitors.splice(index, 1);
        this.updateMonitorList();
        this.updateDashboard();
        this.updateMonitorSelector();
        this.refreshChart();
        this.log('info', `已移除监控点: ${monitor.name}`);
    }

    updateMonitorList() {
        const list = document.getElementById('monitorList');
        document.getElementById('monitorCount').textContent = this.monitors.length;

        if (this.monitors.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>暂无监控点</p></div>';
            return;
        }

        list.innerHTML = this.monitors.map((m, index) => `
            <div class="monitor-item" data-index="${index}">
                <div class="monitor-item-info">
                    <div class="monitor-item-name">${m.name}</div>
                    <div class="monitor-item-details">
                        ${this.getTypeName(m.type)} @ ${m.address} | ${m.dataFormat}
                    </div>
                </div>
                <div class="monitor-item-value" data-field="value">
                    ${m.value !== null ? this.formatValue(m.value, m.type) : '--'}
                </div>
                <button class="btn danger" style="width:auto;padding:6px 12px;margin:0;" 
                        onclick="app.removeMonitor(${index})">删除</button>
            </div>
        `).join('');
    }

    updateMonitorValues() {
        this.monitors.forEach((m, index) => {
            const item = document.querySelector(`.monitor-item[data-index="${index}"]`);
            if (item) {
                const valueEl = item.querySelector('[data-field="value"]');
                if (valueEl) {
                    valueEl.textContent = m.value !== null ? this.formatValue(m.value, m.type) : '--';
                }
            }
        });
    }

    getTypeName(type) {
        const names = {
            holding: '保持寄存器',
            input: '输入寄存器',
            coil: '线圈',
            discrete: '离散输入'
        };
        return names[type] || type;
    }

    formatValue(value, type) {
        if (type === 'coil' || type === 'discrete') {
            return value ? 'ON' : 'OFF';
        }
        return typeof value === 'number' ? value.toFixed(2) : value;
    }

    updateDashboard() {
        const dashboard = document.getElementById('dashboard');

        if (this.monitors.length === 0) {
            dashboard.innerHTML = '<div class="empty-state"><p>暂无监控点，请从左侧添加要监控的寄存器</p></div>';
            return;
        }

        dashboard.innerHTML = `
            <svg style="position:absolute;width:0;height:0;">
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#10b981"/>
                        <stop offset="50%" style="stop-color:#f59e0b"/>
                        <stop offset="100%" style="stop-color:#ef4444"/>
                    </linearGradient>
                </defs>
            </svg>
            ${this.monitors.map((m, index) => this.createDashboardCard(m, index)).join('')}
        `;
    }

    updateDashboardValues() {
        this.monitors.forEach((m, index) => {
            if (m.type === 'coil' || m.type === 'discrete') {
                const card = document.querySelector(`.indicator-card[data-index="${index}"]`);
                if (card) {
                    const isOn = m.value === true;
                    const light = card.querySelector('.indicator-light');
                    const status = card.querySelector('.indicator-status');
                    if (light) light.className = `indicator-light ${isOn ? 'on' : 'off'}`;
                    if (status) {
                        status.className = `indicator-status ${isOn ? 'on' : 'off'}`;
                        status.textContent = isOn ? 'ON' : 'OFF';
                    }
                }
            } else {
                const card = document.querySelector(`.gauge-card[data-index="${index}"]`);
                if (card) {
                    const value = m.value !== null ? parseFloat(m.value) : 0;
                    const maxValue = 100;
                    const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
                    const dashArray = 188.5;
                    const dashOffset = dashArray - (dashArray * percentage / 100);
                    
                    const fill = card.querySelector('.gauge-fill');
                    const valueEl = card.querySelector('.gauge-value');
                    if (fill) fill.style.strokeDashoffset = dashOffset;
                    if (valueEl) valueEl.textContent = m.value !== null ? value.toFixed(1) : '--';
                }
            }
        });
    }

    createDashboardCard(monitor, index) {
        if (monitor.type === 'coil' || monitor.type === 'discrete') {
            const isOn = monitor.value === true;
            return `
                <div class="indicator-card" data-index="${index}">
                    <button class="delete-btn" onclick="app.removeMonitor(${index})">×</button>
                    <h3>${monitor.name}</h3>
                    <div class="indicator-light ${isOn ? 'on' : 'off'}"></div>
                    <div class="indicator-status ${isOn ? 'on' : 'off'}">
                        ${isOn ? 'ON' : 'OFF'}
                    </div>
                    <div style="font-size:11px;color:#6b7280;margin-top:8px;">
                        ${this.getTypeName(monitor.type)} @ ${monitor.address}
                    </div>
                </div>
            `;
        } else {
            const value = monitor.value !== null ? parseFloat(monitor.value) : 0;
            const maxValue = 100;
            const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
            const dashArray = 188.5;
            const dashOffset = dashArray - (dashArray * percentage / 100);

            return `
                <div class="gauge-card" data-index="${index}">
                    <button class="delete-btn" onclick="app.removeMonitor(${index})">×</button>
                    <h3>${monitor.name}</h3>
                    <div class="gauge-container">
                        <svg class="gauge-svg" viewBox="0 0 150 150">
                            <circle class="gauge-bg" cx="75" cy="75" r="60" 
                                stroke-dasharray="${dashArray}" stroke-dashoffset="0"/>
                            <circle class="gauge-fill" cx="75" cy="75" r="60" 
                                stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}"/>
                        </svg>
                        <div class="gauge-value">${monitor.value !== null ? value.toFixed(1) : '--'}</div>
                    </div>
                    <div class="gauge-min-max">
                        <span>0</span>
                        <span>${maxValue}</span>
                    </div>
                    <div style="font-size:11px;color:#6b7280;margin-top:8px;">
                        ${this.getTypeName(monitor.type)} @ ${monitor.address}
                    </div>
                </div>
            `;
        }
    }

    startPolling() {
        this.stopPolling();
        this.pollInterval = setInterval(() => this.pollData(), this.pollDelay);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.isPolling = false;
    }

    async pollData() {
        if (!this.isConnected || this.monitors.length === 0 || this.isPolling) return;

        this.isPolling = true;

        try {
            const grouped = {
                holding: [],
                input: [],
                coil: [],
                discrete: []
            };

            this.monitors.forEach((m, idx) => {
                grouped[m.type].push({ ...m, index: idx });
            });

            for (const [type, items] of Object.entries(grouped)) {
                if (items.length === 0) continue;
                
                try {
                    await this.readGroup(type, items);
                } catch (error) {
                    this.log('error', `读取${this.getTypeName(type)}失败: ${error.message}`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            this.updateMonitorValues();
            this.updateDashboardValues();
        } finally {
            this.isPolling = false;
        }
    }

    async readGroup(type, items) {
        const sorted = [...items].sort((a, b) => a.address - b.address);
        const ranges = this.groupAddressRanges(sorted);

        for (const range of ranges) {
            try {
                let response;
                const startAddr = range[0].address;
                const quantity = range[range.length - 1].address - startAddr + 1;

                switch (type) {
                    case 'holding':
                        response = await this.modbus.readHoldingRegisters(startAddr, quantity);
                        break;
                    case 'input':
                        response = await this.modbus.readInputRegisters(startAddr, quantity);
                        break;
                    case 'coil':
                        response = await this.modbus.readCoils(startAddr, quantity);
                        break;
                    case 'discrete':
                        response = await this.modbus.readDiscreteInputs(startAddr, quantity);
                        break;
                }

                this.log('rx', `接收: ${this.bufferToHex(response)}`);

                range.forEach(item => {
                    const offset = item.address - startAddr;
                    let value;

                    if (type === 'coil' || type === 'discrete') {
                        const byteOffset = 2 + Math.floor(offset / 8);
                        const bitOffset = offset % 8;
                        value = this.modbus.parseCoilValue(response, byteOffset, bitOffset);
                    } else {
                        const dataOffset = 2 + offset * 2;
                        value = this.modbus.parseRegisterValue(response, dataOffset, item.dataFormat);
                        value = value * item.scaleFactor + item.offset;
                    }

                    this.monitors[item.index].value = value;
                    this.monitors[item.index].timestamp = Date.now();
                });

            } catch (error) {
                throw error;
            }
        }
    }

    groupAddressRanges(items) {
        if (items.length === 0) return [];
        
        const ranges = [];
        let currentRange = [items[0]];

        for (let i = 1; i < items.length; i++) {
            const last = currentRange[currentRange.length - 1];
            if (items[i].address - last.address <= 5) {
                currentRange.push(items[i]);
            } else {
                ranges.push(currentRange);
                currentRange = [items[i]];
            }
        }
        ranges.push(currentRange);

        return ranges;
    }

    async writeValue() {
        try {
            const type = document.getElementById('writeType').value;
            const address = parseInt(document.getElementById('writeAddress').value);
            
            let response;
            if (type === 'coil') {
                const value = document.getElementById('writeCoilValue').value === 'true';
                response = await this.modbus.writeSingleCoil(address, value);
                this.log('tx', `发送写线圈: 地址=${address}, 值=${value ? 'ON' : 'OFF'}`);
                this.log('info', `写入线圈 @ ${address}: ${value ? 'ON' : 'OFF'}`);
            } else {
                const value = parseInt(document.getElementById('writeValue').value);
                response = await this.modbus.writeSingleRegister(address, value);
                this.log('tx', `发送写寄存器: 地址=${address}, 值=${value}`);
                this.log('info', `写入寄存器 @ ${address}: ${value}`);
            }

            this.log('rx', `响应: ${this.bufferToHex(response)}`);
            
            setTimeout(() => this.pollData(), 500);
        } catch (error) {
            this.log('error', `写入失败: ${error.message}`);
        }
    }

    startRecording() {
        if (this.isRecording) return;
        
        this.recordInterval = parseInt(document.getElementById('recordInterval').value) * 1000;
        this.isRecording = true;
        this.updateConnectionStatus();
        this.recordTimer = setInterval(() => this.recordData(), this.recordInterval);
        this.log('info', `开始数据记录，间隔: ${this.recordInterval / 1000}秒`);
    }

    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        if (this.recordTimer) {
            clearInterval(this.recordTimer);
            this.recordTimer = null;
        }
        this.updateConnectionStatus();
        this.log('info', '停止数据记录');
    }

    async recordData() {
        if (!this.isConnected) return;

        for (const monitor of this.monitors) {
            if (monitor.value !== null) {
                try {
                    await this.db.addRecord(
                        monitor.address,
                        monitor.name,
                        monitor.value
                    );
                } catch (error) {
                    this.log('error', `记录数据失败: ${error.message}`);
                }
            }
        }
    }

    async exportData() {
        try {
            await this.db.exportToCSV();
            this.log('info', '数据已导出为CSV文件');
        } catch (error) {
            this.log('error', `导出失败: ${error.message}`);
        }
    }

    async clearData() {
        if (!confirm('确定要清除所有记录的数据吗？此操作不可恢复！')) return;
        
        try {
            await this.db.clearRecords();
            this.refreshChart();
            this.log('info', '所有记录数据已清除');
        } catch (error) {
            this.log('error', `清除数据失败: ${error.message}`);
        }
    }

    log(type, message) {
        const container = document.getElementById('logContainer');
        const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="log-time">[${time}]</span>${message}`;
        
        container.insertBefore(entry, container.firstChild);
        
        while (container.children.length > 100) {
            container.removeChild(container.lastChild);
        }
    }

    bufferToHex(buffer) {
        return Array.from(buffer).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    }

    initChart() {
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#e0e0e0',
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#00d4ff',
                        bodyColor: '#e0e0e0',
                        borderColor: 'rgba(0, 212, 255, 0.3)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += typeof context.parsed.y === 'number' 
                                        ? context.parsed.y.toFixed(2) 
                                        : context.parsed.y;
                                }
                                return label;
                            }
                        }
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            modifierKey: null
                        },
                        zoom: {
                            wheel: {
                                enabled: true
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x'
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            displayFormats: {
                                minute: 'HH:mm',
                                hour: 'HH:mm',
                                second: 'HH:mm:ss'
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#a0a0a0',
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#a0a0a0'
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 2,
                        hoverRadius: 5
                    },
                    line: {
                        tension: 0.3
                    }
                }
            }
        });

        const canvas = document.getElementById('trendChart');
        canvas.addEventListener('dblclick', () => this.resetChartZoom());
    }

    updateMonitorSelector() {
        const selector = document.getElementById('monitorSelector');
        
        if (this.monitors.length === 0) {
            selector.innerHTML = '<span style="color:#6b7280;">暂无监控点</span>';
            return;
        }

        selector.innerHTML = this.monitors.map((m, index) => {
            const color = this.chartColors[index % this.chartColors.length];
            const isSelected = this.selectedMonitors.has(m.id);
            return `
                <div class="monitor-tag ${isSelected ? 'selected' : ''}" 
                     data-id="${m.id}" 
                     onclick="app.toggleMonitorSelection(${m.id})">
                    <span class="monitor-tag-color" style="background:${color};"></span>
                    <span>${m.name}</span>
                </div>
            `;
        }).join('');
    }

    toggleMonitorSelection(id) {
        if (this.selectedMonitors.has(id)) {
            this.selectedMonitors.delete(id);
        } else {
            this.selectedMonitors.add(id);
        }
        this.updateMonitorSelector();
        this.refreshChart();
    }

    async refreshChart() {
        if (!this.chart) return;

        const timeRange = parseInt(document.getElementById('timeRange').value);
        const endTime = Date.now();
        const startTime = timeRange > 0 ? endTime - timeRange : 0;

        const datasets = [];
        const selectedMonitorList = this.monitors.filter(m => this.selectedMonitors.has(m.id));

        if (selectedMonitorList.length === 0) {
            this.chart.data.datasets = [];
            this.chart.update();
            return;
        }

        for (let i = 0; i < selectedMonitorList.length; i++) {
            const monitor = selectedMonitorList[i];
            const color = this.chartColors[this.monitors.findIndex(m => m.id === monitor.id) % this.chartColors.length];
            
            try {
                const records = await this.db.getRecordsByMonitorId(monitor.id, 1000);
                
                const filteredRecords = records.filter(r => {
                    if (timeRange === 0) return true;
                    return r.timestamp >= startTime && r.timestamp <= endTime;
                });

                const data = filteredRecords.map(r => ({
                    x: r.timestamp,
                    y: r.value
                }));

                datasets.push({
                    label: monitor.name,
                    data: data,
                    borderColor: color,
                    backgroundColor: color.replace(')', ', 0.1)').replace('rgb', 'rgba'),
                    borderWidth: 2,
                    fill: false,
                    pointBackgroundColor: color
                });
            } catch (error) {
                this.log('error', `加载${monitor.name}数据失败: ${error.message}`);
            }
        }

        this.chart.data.datasets = datasets;
        this.chart.update();
    }

    resetChartZoom() {
        if (this.chart) {
            this.chart.resetZoom();
        }
    }

    toggleAutoRefresh() {
        this.stopAutoRefresh();
        
        const interval = parseInt(document.getElementById('autoRefresh').value);
        if (interval > 0 && this.isConnected) {
            this.chartTimer = setInterval(() => this.refreshChart(), interval);
        }
    }

    stopAutoRefresh() {
        if (this.chartTimer) {
            clearInterval(this.chartTimer);
            this.chartTimer = null;
        }
    }
}

const app = new PLCDataCollector();
