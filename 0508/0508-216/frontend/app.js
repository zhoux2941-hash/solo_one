const API_BASE = 'http://localhost:8080/api';

let devices = [];
let humidityData = [];
let realtimeChart = null;
let humidityChart = null;
let energyChart = null;
let selectedDeviceId = null;
let refreshInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initModal();
    initDeviceForm();
    loadDevices();
    initCharts();
    startRealTimeRefresh();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

function updateCurrentTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = now.toLocaleString('zh-CN');
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            if (tabId === 'reports') {
                loadReportDevices();
            }
        });
    });
}

function initModal() {
    const modal = document.getElementById('deviceModal');
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = document.getElementById('cancelBtn');
    const addBtn = document.getElementById('addDeviceBtn');

    addBtn.addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = '添加展柜';
        document.getElementById('deviceForm').reset();
        document.getElementById('deviceId').value = '';
        setDefaultHumidityRange();
        modal.classList.add('show');
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    cancelBtn.addEventListener('click', () => modal.classList.remove('show'));

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });
}

function initDeviceForm() {
    const form = document.getElementById('deviceForm');
    const exhibitTypeSelect = document.getElementById('exhibitType');

    exhibitTypeSelect.addEventListener('change', setDefaultHumidityRange);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const cabinetNumber = document.getElementById('cabinetNumber').value.trim();
        const targetHumidityMin = parseFloat(document.getElementById('targetHumidityMin').value);
        const targetHumidityMax = parseFloat(document.getElementById('targetHumidityMax').value);

        if (!cabinetNumber) {
            alert('柜号不能为空！');
            return;
        }

        if (isNaN(targetHumidityMin) || isNaN(targetHumidityMax)) {
            alert('湿度值必须是有效的数字！');
            return;
        }

        if (targetHumidityMin < 0 || targetHumidityMin > 100) {
            alert('湿度最小值必须在0-100%RH范围内！');
            return;
        }

        if (targetHumidityMax < 0 || targetHumidityMax > 100) {
            alert('湿度最大值必须在0-100%RH范围内！');
            return;
        }

        if (targetHumidityMax <= targetHumidityMin) {
            alert('湿度最大值必须大于最小值！');
            return;
        }

        const deviceId = document.getElementById('deviceId').value;
        const device = {
            cabinetNumber: cabinetNumber,
            exhibitType: document.getElementById('exhibitType').value,
            targetHumidityMin: targetHumidityMin,
            targetHumidityMax: targetHumidityMax
        };

        try {
            let response;
            if (deviceId) {
                response = await fetch(`${API_BASE}/devices/${deviceId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(device)
                });
            } else {
                response = await fetch(`${API_BASE}/devices`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(device)
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || '请求失败');
            }
            
            document.getElementById('deviceModal').classList.remove('show');
            loadDevices();
        } catch (error) {
            console.error('保存设备失败:', error);
            alert(error.message || '保存设备失败，请检查后端服务是否启动');
        }
    });
}

function setDefaultHumidityRange() {
    const exhibitType = document.getElementById('exhibitType').value;
    if (exhibitType === 'ORGANIC') {
        document.getElementById('targetHumidityMin').value = 50;
        document.getElementById('targetHumidityMax').value = 55;
    } else {
        document.getElementById('targetHumidityMin').value = 40;
        document.getElementById('targetHumidityMax').value = 45;
    }
}

async function loadDevices() {
    try {
        const response = await fetch(`${API_BASE}/devices`);
        devices = await response.json();
        renderDeviceTable();
        updateMonitorDeviceSelect();
    } catch (error) {
        console.error('加载设备失败:', error);
        devices = getMockDevices();
        renderDeviceTable();
        updateMonitorDeviceSelect();
    }
}

function getMockDevices() {
    return [
        { id: 1, cabinetNumber: 'A001', exhibitType: 'ORGANIC', targetHumidityMin: 50, targetHumidityMax: 55, currentHumidity: 52.3, status: 'NORMAL' },
        { id: 2, cabinetNumber: 'A002', exhibitType: 'INORGANIC', targetHumidityMin: 40, targetHumidityMax: 45, currentHumidity: 48.1, status: 'DEHUMIDIFYING' },
        { id: 3, cabinetNumber: 'B001', exhibitType: 'ORGANIC', targetHumidityMin: 50, targetHumidityMax: 55, currentHumidity: 44.5, status: 'HUMIDIFYING' }
    ];
}

function renderDeviceTable() {
    const tbody = document.getElementById('deviceTableBody');
    tbody.innerHTML = devices.map(device => `
        <tr>
            <td>${device.cabinetNumber}</td>
            <td>${device.exhibitType === 'ORGANIC' ? '有机展品' : '无机展品'}</td>
            <td>${device.targetHumidityMin}-${device.targetHumidityMax}%RH</td>
            <td>${device.currentHumidity ? device.currentHumidity.toFixed(1) : '--'}%RH</td>
            <td>${getStatusBadge(device.status)}</td>
            <td>
                <button class="btn btn-small btn-secondary" onclick="editDevice(${device.id})">编辑</button>
                <button class="btn btn-small btn-danger" onclick="deleteDevice(${device.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function getStatusBadge(status) {
    const statusMap = {
        'NORMAL': '<span class="status-badge normal">正常</span>',
        'WARNING': '<span class="status-badge warning">警告</span>',
        'HUMIDIFYING': '<span class="status-badge humidifying">加湿中</span>',
        'DEHUMIDIFYING': '<span class="status-badge dehumidifying">除湿中</span>'
    };
    return statusMap[status] || '<span class="status-badge idle">未知</span>';
}

async function editDevice(id) {
    const device = devices.find(d => d.id === id);
    if (device) {
        document.getElementById('modalTitle').textContent = '编辑展柜';
        document.getElementById('deviceId').value = device.id;
        document.getElementById('cabinetNumber').value = device.cabinetNumber;
        document.getElementById('exhibitType').value = device.exhibitType;
        document.getElementById('targetHumidityMin').value = device.targetHumidityMin;
        document.getElementById('targetHumidityMax').value = device.targetHumidityMax;
        document.getElementById('deviceModal').classList.add('show');
    }
}

async function deleteDevice(id) {
    if (confirm('确定要删除这个展柜吗？')) {
        try {
            await fetch(`${API_BASE}/devices/${id}`, { method: 'DELETE' });
            loadDevices();
        } catch (error) {
            console.error('删除设备失败:', error);
            devices = devices.filter(d => d.id !== id);
            renderDeviceTable();
        }
    }
}

function updateMonitorDeviceSelect() {
    const select = document.getElementById('monitorDeviceSelect');
    select.innerHTML = '<option value="">选择展柜</option>' + 
        devices.map(d => `<option value="${d.id}">${d.cabinetNumber}</option>`).join('');
    
    select.addEventListener('change', (e) => {
        selectedDeviceId = e.target.value ? parseInt(e.target.value) : null;
        if (selectedDeviceId) {
            loadDeviceMonitorData(selectedDeviceId);
        }
    });
}

async function loadDeviceMonitorData(deviceId) {
    try {
        const response = await fetch(`${API_BASE}/devices/${deviceId}`);
        const device = await response.json();
        updateMonitorDisplay(device);
    } catch (error) {
        console.error('加载监控数据失败:', error);
        const device = devices.find(d => d.id === deviceId);
        if (device) {
            updateMonitorDisplay(device);
        }
    }

    try {
        const response = await fetch(`${API_BASE}/humidity/device/${deviceId}?limit=20`);
        humidityData = await response.json();
    } catch (error) {
        humidityData = generateMockHumidityData(deviceId);
    }
    
    updateRealtimeChart();
    loadControlLogs(deviceId);
}

function updateMonitorDisplay(device) {
    document.getElementById('currentHumidity').textContent = device.currentHumidity ? device.currentHumidity.toFixed(1) : '--';
    document.getElementById('targetRange').textContent = `${device.targetHumidityMin}-${device.targetHumidityMax}%RH`;
    
    const statusEl = document.getElementById('humidifierStatus');
    if (device.status === 'HUMIDIFYING') {
        statusEl.textContent = '加湿中';
        statusEl.className = 'status-badge humidifying';
    } else if (device.status === 'DEHUMIDIFYING') {
        statusEl.textContent = '除湿中';
        statusEl.className = 'status-badge dehumidifying';
    } else {
        statusEl.textContent = '待机';
        statusEl.className = 'status-badge idle';
    }
}

function generateMockHumidityData(deviceId) {
    const data = [];
    const now = new Date();
    const device = devices.find(d => d.id === deviceId);
    const baseHumidity = device ? (device.targetHumidityMin + device.targetHumidityMax) / 2 : 50;
    
    for (let i = 19; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 15 * 60 * 1000);
        data.push({
            timestamp: time.toISOString(),
            humidity: baseHumidity + (Math.random() - 0.5) * 10
        });
    }
    return data;
}

async function loadControlLogs(deviceId) {
    try {
        const response = await fetch(`${API_BASE}/control-logs/device/${deviceId}?limit=10`);
        const logs = await response.json();
        renderControlLogs(logs);
    } catch (error) {
        renderControlLogs(generateMockLogs(deviceId));
    }
}

function generateMockLogs(deviceId) {
    const logs = [];
    const now = new Date();
    const types = ['humidify', 'dehumidify', 'warning'];
    
    for (let i = 0; i < 5; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const time = new Date(now.getTime() - i * 3600 * 1000);
        logs.push({
            timestamp: time.toISOString(),
            controlType: type.toUpperCase(),
            message: type === 'humidify' ? '启动加湿' : type === 'dehumidify' ? '启动除湿' : '湿度超出正常范围'
        });
    }
    return logs;
}

function renderControlLogs(logs) {
    const logContainer = document.getElementById('controlLog');
    if (logs.length === 0) {
        logContainer.innerHTML = '<div class="log-item"><div class="log-message">暂无调控日志</div></div>';
        return;
    }
    
    logContainer.innerHTML = logs.map(log => {
        const time = new Date(log.timestamp).toLocaleString('zh-CN');
        const typeClass = log.controlType === 'HUMIDIFY' ? 'humidify' : 
                          log.controlType === 'DEHUMIDIFY' ? 'dehumidify' : 'warning';
        return `
            <div class="log-item ${typeClass}">
                <div class="log-time">${time}</div>
                <div class="log-message">${log.message}</div>
            </div>
        `;
    }).join('');
}

function initCharts() {
    const realtimeCtx = document.getElementById('realtimeChart').getContext('2d');
    realtimeChart = new Chart(realtimeCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '湿度 (%RH)',
                data: [],
                borderColor: '#2a5298',
                backgroundColor: 'rgba(42, 82, 152, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 30,
                    max: 70
                }
            }
        }
    });

    const humidityCtx = document.getElementById('humidityChart').getContext('2d');
    humidityChart = new Chart(humidityCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '湿度 (%RH)',
                data: [],
                borderColor: '#2a5298',
                backgroundColor: 'rgba(42, 82, 152, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    const energyCtx = document.getElementById('energyChart').getContext('2d');
    energyChart = new Chart(energyCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: '加湿能耗 (kWh)',
                    data: [],
                    backgroundColor: '#3498db'
                },
                {
                    label: '除湿能耗 (kWh)',
                    data: [],
                    backgroundColor: '#e67e22'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true
                }
            }
        }
    });
}

function updateRealtimeChart() {
    if (!realtimeChart || humidityData.length === 0) return;
    
    realtimeChart.data.labels = humidityData.map(d => {
        const time = new Date(d.timestamp);
        return time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    });
    realtimeChart.data.datasets[0].data = humidityData.map(d => d.humidity.toFixed(1));
    realtimeChart.update();
}

function startRealTimeRefresh() {
    refreshInterval = setInterval(async () => {
        if (selectedDeviceId) {
            try {
                const response = await fetch(`${API_BASE}/devices/${selectedDeviceId}`);
                const device = await response.json();
                updateMonitorDisplay(device);
                
                const now = new Date();
                humidityData.push({
                    timestamp: now.toISOString(),
                    humidity: device.currentHumidity
                });
                if (humidityData.length > 20) {
                    humidityData.shift();
                }
                updateRealtimeChart();
            } catch (error) {
                const device = devices.find(d => d.id === selectedDeviceId);
                if (device) {
                    device.currentHumidity += (Math.random() - 0.5) * 2;
                    updateMonitorDisplay(device);
                }
            }
        }
        loadDevices();
    }, 5000);
}

function loadReportDevices() {
    const select = document.getElementById('reportDeviceSelect');
    select.innerHTML = '<option value="">全部展柜</option>' + 
        devices.map(d => `<option value="${d.id}">${d.cabinetNumber}</option>`).join('');
}

document.getElementById('generateReport').addEventListener('click', async () => {
    const deviceId = document.getElementById('reportDeviceSelect').value;
    const period = document.getElementById('reportPeriod').value;
    
    try {
        const url = deviceId ? 
            `${API_BASE}/humidity/device/${deviceId}?period=${period}` :
            `${API_BASE}/humidity?period=${period}`;
        const response = await fetch(url);
        const data = await response.json();
        updateHumidityReportChart(data);
    } catch (error) {
        updateHumidityReportChart(generateMockReportData(period));
    }
    
    generateEnergyReport();
});

function generateMockReportData(period) {
    const data = [];
    const now = new Date();
    let points = 24;
    let interval = 60 * 60 * 1000;
    
    if (period === '7d') {
        points = 7;
        interval = 24 * 60 * 60 * 1000;
    } else if (period === '30d') {
        points = 30;
        interval = 24 * 60 * 60 * 1000;
    }
    
    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - i * interval);
        data.push({
            timestamp: time.toISOString(),
            humidity: 50 + (Math.random() - 0.5) * 10
        });
    }
    return data;
}

function updateHumidityReportChart(data) {
    humidityChart.data.labels = data.map(d => {
        const time = new Date(d.timestamp);
        return time.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    });
    humidityChart.data.datasets[0].data = data.map(d => d.humidity.toFixed(1));
    humidityChart.update();
}

async function generateEnergyReport() {
    const period = document.getElementById('energyPeriod').value;
    
    try {
        const response = await fetch(`${API_BASE}/energy-statistics?period=${period}`);
        const stats = await response.json();
        updateEnergyChart(stats);
    } catch (error) {
        updateEnergyChart(generateMockEnergyData(period));
    }
}

function generateMockEnergyData(period) {
    const labels = [];
    const humidifyData = [];
    const dehumidifyData = [];
    const now = new Date();
    
    let days = 1;
    if (period === 'week') days = 7;
    if (period === 'month') days = 30;
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        labels.push(date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }));
        humidifyData.push(Math.random() * 5);
        dehumidifyData.push(Math.random() * 5);
    }
    
    return { labels, humidifyData, dehumidifyData };
}

function updateEnergyChart(stats) {
    energyChart.data.labels = stats.labels;
    energyChart.data.datasets[0].data = stats.humidifyData;
    energyChart.data.datasets[1].data = stats.dehumidifyData;
    energyChart.update();
    
    const totalHumidify = stats.humidifyData.reduce((a, b) => a + b, 0);
    const totalDehumidify = stats.dehumidifyData.reduce((a, b) => a + b, 0);
    const total = totalHumidify + totalDehumidify;
    
    document.getElementById('totalEnergy').textContent = total.toFixed(2) + ' kWh';
    document.getElementById('humidifyEnergy').textContent = totalHumidify.toFixed(2) + ' kWh';
    document.getElementById('dehumidifyEnergy').textContent = totalDehumidify.toFixed(2) + ' kWh';
}
