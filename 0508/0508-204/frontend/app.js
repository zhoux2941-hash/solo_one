const API_BASE = 'http://localhost:8081/api';

let trendChart = null;
let reportChart = null;

document.addEventListener('DOMContentLoaded', function() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('recordTime').value = now.toISOString().slice(0, 16);
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDate').value = today;
    
    loadMonitorData();
    loadAlertData();
    updateReport();
    
    setInterval(loadMonitorData, 60000);
    setInterval(loadAlertData, 30000);
});

function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
    
    if (tabId === 'monitor') loadMonitorData();
    if (tabId === 'alerts') loadAlertData();
    if (tabId === 'reports') updateReport();
}

async function loadMonitorData() {
    try {
        const [dataRes, trendRes] = await Promise.all([
            fetch(`${API_BASE}/water-quality`),
            fetch(`${API_BASE}/water-quality/trend?hours=24`)
        ]);
        
        const data = await dataRes.json();
        const trend = await trendRes.json();
        
        updateCurrentStatus(data);
        updateRecentRecords(data);
        updateTrendChart(trend);
    } catch (error) {
        console.error('加载监测数据失败:', error);
    }
}

function updateCurrentStatus(data) {
    const container = document.getElementById('currentStatus');
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;">暂无数据</p>';
        return;
    }
    
    const latest = data[0];
    const chlorineOk = latest.residualChlorine >= 0.3 && latest.residualChlorine <= 1.0;
    const phOk = latest.phValue >= 6.5 && latest.phValue <= 8.5;
    const turbidityOk = latest.turbidity <= 1;
    
    container.innerHTML = `
        <div class="status-card ${chlorineOk ? 'success' : 'warning'}">
            <div class="label">余氯</div>
            <div class="value">${latest.residualChlorine.toFixed(2)}</div>
            <div class="standard">标准: 0.3-1.0 mg/L</div>
        </div>
        <div class="status-card ${phOk ? 'success' : 'warning'}">
            <div class="label">PH值</div>
            <div class="value">${latest.phValue.toFixed(2)}</div>
            <div class="standard">标准: 6.5-8.5</div>
        </div>
        <div class="status-card ${turbidityOk ? 'success' : 'warning'}">
            <div class="label">浊度</div>
            <div class="value">${latest.turbidity.toFixed(2)}</div>
            <div class="standard">标准: ≤1</div>
        </div>
        <div class="status-card">
            <div class="label">水温</div>
            <div class="value">${latest.waterTemperature.toFixed(1)}</div>
            <div class="standard">°C</div>
        </div>
    `;
}

function updateRecentRecords(data) {
    const tbody = document.getElementById('recentRecords');
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;">暂无数据</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.slice(0, 10).map(item => {
        const badge = item.isStandard ? 
            '<span class="badge badge-success">达标</span>' : 
            '<span class="badge badge-danger">超标</span>';
        return `
            <tr>
                <td>${formatTime(item.recordTime)}</td>
                <td>${item.residualChlorine.toFixed(2)}</td>
                <td>${item.phValue.toFixed(2)}</td>
                <td>${item.turbidity.toFixed(2)}</td>
                <td>${item.waterTemperature.toFixed(1)}</td>
                <td>${badge}</td>
            </tr>
        `;
    }).join('');
}

function updateTrendChart(trend) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    const labels = trend.timeLabels.map(t => formatTime(t));
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '余氯',
                    data: trend.residualChlorine,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'PH值',
                    data: trend.phValue,
                    borderColor: '#f5576c',
                    backgroundColor: 'rgba(245, 87, 108, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                },
                {
                    label: '浊度',
                    data: trend.turbidity,
                    borderColor: '#f093fb',
                    backgroundColor: 'rgba(240, 147, 251, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: '余氯/浊度' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'PH值' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

async function submitData(event) {
    event.preventDefault();
    
    const data = {
        residualChlorine: parseFloat(document.getElementById('residualChlorine').value),
        phValue: parseFloat(document.getElementById('phValue').value),
        turbidity: parseFloat(document.getElementById('turbidity').value),
        waterTemperature: parseFloat(document.getElementById('waterTemperature').value),
        recordTime: document.getElementById('recordTime').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/water-quality`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showToast('数据提交成功！', 'success');
            document.getElementById('dataForm').reset();
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            document.getElementById('recordTime').value = now.toISOString().slice(0, 16);
            loadMonitorData();
            loadAlertData();
        } else {
            showToast('数据提交失败！', 'error');
        }
    } catch (error) {
        showToast('网络错误！', 'error');
    }
}

async function loadAlertData() {
    try {
        const [statsRes, alertsRes] = await Promise.all([
            fetch(`${API_BASE}/alerts/statistics`),
            fetch(`${API_BASE}/alerts`)
        ]);
        
        const stats = await statsRes.json();
        const alerts = await alertsRes.json();
        
        updateAlertStats(stats);
        updateUnhandledAlerts(alerts.filter(a => !a.isHandled));
        updateAllAlerts(alerts);
    } catch (error) {
        console.error('加载告警数据失败:', error);
    }
}

function updateAlertStats(stats) {
    document.getElementById('alertStats').innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${stats.totalAlerts}</div>
            <div class="stat-label">总告警数</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.unhandledAlerts}</div>
            <div class="stat-label">待处理</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stats.handledAlerts}</div>
            <div class="stat-label">已处理</div>
        </div>
    `;
}

function updateUnhandledAlerts(alerts) {
    const container = document.getElementById('unhandledAlerts');
    
    if (alerts.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;">暂无待处理告警</p>';
        return;
    }
    
    container.innerHTML = alerts.map(alert => `
        <div class="alert-item">
            <div class="alert-header">
                <span class="badge badge-danger">${alert.alertLevel}级</span>
                <span class="alert-time">${formatTime(alert.alertTime)}</span>
            </div>
            <div class="alert-content">${alert.alertContent}</div>
            <div class="alert-actions">
                <button class="btn btn-danger" onclick="openHandleModal(${alert.id})">处理告警</button>
            </div>
        </div>
    `).join('');
}

function updateAllAlerts(alerts) {
    const tbody = document.getElementById('allAlerts');
    
    if (alerts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;">暂无告警记录</td></tr>';
        return;
    }
    
    tbody.innerHTML = alerts.map(alert => {
        const badge = alert.isHandled ? 
            '<span class="badge badge-success">已处理</span>' : 
            '<span class="badge badge-warning">待处理</span>';
        return `
            <tr>
                <td>${formatTime(alert.alertTime)}</td>
                <td>${alert.alertType}</td>
                <td>${alert.alertContent}</td>
                <td><span class="badge badge-danger">${alert.alertLevel}</span></td>
                <td>${alert.handler || '-'}</td>
                <td>${alert.handleMeasure || '-'}</td>
                <td>${badge}</td>
            </tr>
        `;
    }).join('');
}

function openHandleModal(id) {
    document.getElementById('alertId').value = id;
    document.getElementById('handleModal').classList.add('active');
}

function closeModal() {
    document.getElementById('handleModal').classList.remove('active');
}

async function handleAlertSubmit(event) {
    event.preventDefault();
    
    const id = document.getElementById('alertId').value;
    const handler = document.getElementById('handler').value;
    const handleMeasure = document.getElementById('handleMeasure').value;
    
    try {
        const response = await fetch(
            `${API_BASE}/alerts/${id}/handle?handler=${encodeURIComponent(handler)}&handleMeasure=${encodeURIComponent(handleMeasure)}`,
            { method: 'PUT' }
        );
        
        if (response.ok) {
            showToast('告警处理成功！', 'success');
            closeModal();
            loadAlertData();
        } else {
            showToast('处理失败！', 'error');
        }
    } catch (error) {
        showToast('网络错误！', 'error');
    }
}

async function updateReport() {
    const type = document.getElementById('reportType').value;
    const dateStr = document.getElementById('reportDate').value;
    const date = new Date(dateStr);
    
    try {
        let url;
        if (type === 'daily') {
            url = `${API_BASE}/water-quality/report/daily?date=${dateStr}`;
        } else {
            url = `${API_BASE}/water-quality/report/monthly?year=${date.getFullYear()}&month=${date.getMonth() + 1}`;
        }
        
        const response = await fetch(url);
        const report = await response.json();
        
        updateReportStats(report, type);
        updateReportChart(report, type);
    } catch (error) {
        console.error('加载报表失败:', error);
    }
}

function updateReportStats(report, type) {
    const container = document.getElementById('reportStats');
    container.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${report.totalRecords}</div>
            <div class="stat-label">总记录数</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${report.standardRecords}</div>
            <div class="stat-label">达标记录</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${report.passRate.toFixed(1)}%</div>
            <div class="stat-label">合格率</div>
        </div>
    `;
}

function updateReportChart(report, type) {
    const ctx = document.getElementById('reportChart').getContext('2d');
    
    let labels, data;
    
    if (type === 'daily' && report.dataList) {
        labels = report.dataList.map(d => formatTime(d.recordTime));
        data = report.dataList.map(d => d.isStandard ? 100 : 0);
    } else if (type === 'monthly' && report.dailyStats) {
        labels = report.dailyStats.map(d => d.date.split('-')[2]);
        data = report.dailyStats.map(d => d.passRate);
    } else {
        labels = [];
        data = [];
    }
    
    if (reportChart) {
        reportChart.destroy();
    }
    
    reportChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '合格率 (%)',
                data: data,
                backgroundColor: data.map(v => v >= 100 ? 'rgba(72, 187, 120, 0.8)' : 'rgba(245, 101, 101, 0.8)'),
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: '合格率 (%)' }
                }
            }
        }
    });
}

function formatTime(timeStr) {
    if (!timeStr) return '-';
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}