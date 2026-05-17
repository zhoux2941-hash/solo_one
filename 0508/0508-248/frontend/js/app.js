const API_BASE = 'http://localhost:8080/api';

let inspections = [];
let workOrders = [];
let densityChart, trendChart;

document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initForm();
    initDate();
    loadInspections();
    loadWorkOrders();
    initCharts();
});

function initDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('inspectionDate').value = today;
}

function initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const tabName = this.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById('tab-' + tabName).classList.remove('hidden');
            
            if (tabName === 'reports') {
                loadReportData();
            }
        });
    });
}

function initForm() {
    const form = document.getElementById('inspection-form');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const lineSpeedValue = document.getElementById('lineSpeed').value;
        const data = {
            section: document.getElementById('section').value,
            mileage: document.getElementById('mileage').value,
            railPosition: document.getElementById('railPosition').value,
            damageType: document.getElementById('damageType').value,
            depth: parseFloat(document.getElementById('depth').value),
            lineSpeed: lineSpeedValue ? parseInt(lineSpeedValue) : null,
            inspectionDate: document.getElementById('inspectionDate').value
        };
        
        try {
            const response = await fetch(`${API_BASE}/inspections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            showAlert('检测数据提交成功！', 'success');
            
            if (result.workOrder) {
                showWorkOrderResult(result.workOrder);
            }
            
            form.reset();
            initDate();
            loadInspections();
            loadWorkOrders();
        } catch (error) {
            console.error('Error:', error);
            showAlert('提交失败，请检查后端服务是否启动', 'error');
        }
    });
}

function showWorkOrderResult(workOrder) {
    const container = document.getElementById('work-order-result');
    container.classList.remove('hidden');
    container.innerHTML = `
        <h4>✅ 自动生成维修工单</h4>
        <p><strong>工单编号：</strong>${workOrder.orderNo}</p>
        <p><strong>线路区间：</strong>${workOrder.section}</p>
        <p><strong>里程桩号：</strong>${workOrder.mileage}</p>
        <p><strong>严重程度：</strong>${workOrder.severityLevel}</p>
        <p><strong>建议修复时间：</strong>${workOrder.suggestedRepairTime}</p>
    `;
    
    setTimeout(() => {
        container.classList.add('hidden');
    }, 5000);
}

async function loadInspections() {
    const section = document.getElementById('filter-section').value;
    const level = document.getElementById('filter-level').value;
    const type = document.getElementById('filter-type').value;
    
    try {
        let url = `${API_BASE}/inspections`;
        const params = new URLSearchParams();
        if (section) params.append('section', section);
        if (level) params.append('severityLevel', level);
        if (type) params.append('damageType', type);
        if (params.toString()) url += '?' + params.toString();
        
        const response = await fetch(url);
        inspections = await response.json();
        renderInspectionsTable();
    } catch (error) {
        console.error('Error:', error);
        inspections = getMockInspections();
        renderInspectionsTable();
    }
}

function renderInspectionsTable() {
    const tbody = document.querySelector('#inspections-table tbody');
    tbody.innerHTML = inspections.map(item => `
        <tr>
            <td>${item.id || '-'}</td>
            <td>${item.section}</td>
            <td>${item.mileage}</td>
            <td>${item.railPosition}</td>
            <td>${item.damageType}</td>
            <td>${item.depth}</td>
            <td>${item.lineSpeed || '-'} km/h</td>
            <td><span class="badge badge-level${getLevelNumber(item.severityLevel)}">${item.severityLevel}</span></td>
            <td>${item.inspectionDate}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteInspection(${item.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function getLevelNumber(level) {
    if (level === 'Ⅰ级' || level === 'LEVEL1') return 1;
    if (level === 'Ⅱ级' || level === 'LEVEL2') return 2;
    return 3;
}

async function deleteInspection(id) {
    if (!confirm('确定要删除这条检测记录吗？')) return;
    
    try {
        await fetch(`${API_BASE}/inspections/${id}`, { method: 'DELETE' });
        showAlert('删除成功！', 'success');
        loadInspections();
    } catch (error) {
        console.error('Error:', error);
        showAlert('删除失败', 'error');
    }
}

async function loadWorkOrders() {
    const status = document.getElementById('filter-order-status').value;
    
    try {
        let url = `${API_BASE}/work-orders`;
        if (status) url += `?status=${status}`;
        
        const response = await fetch(url);
        workOrders = await response.json();
        renderWorkOrdersTable();
    } catch (error) {
        console.error('Error:', error);
        workOrders = getMockWorkOrders();
        renderWorkOrdersTable();
    }
}

function renderWorkOrdersTable() {
    const tbody = document.querySelector('#work-orders-table tbody');
    tbody.innerHTML = workOrders.map(item => `
        <tr>
            <td>${item.orderNo}</td>
            <td>${item.section}</td>
            <td>${item.mileage}</td>
            <td>${item.damageType}</td>
            <td><span class="badge badge-level${getLevelNumber(item.severityLevel)}">${item.severityLevel}</span></td>
            <td>${item.suggestedRepairTime}</td>
            <td>${item.createTime}</td>
            <td><span class="status-badge status-${item.status.toLowerCase()}">${getStatusText(item.status)}</span></td>
            <td>
                ${item.status !== 'COMPLETED' ? `
                    <button class="btn btn-success btn-sm" onclick="updateWorkOrderStatus('${item.orderNo}', 'PROCESSING')">开始处理</button>
                    <button class="btn btn-primary btn-sm" onclick="updateWorkOrderStatus('${item.orderNo}', 'COMPLETED')">完成</button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}

function getStatusText(status) {
    const map = { 'PENDING': '待处理', 'PROCESSING': '处理中', 'COMPLETED': '已完成' };
    return map[status] || status;
}

async function updateWorkOrderStatus(orderNo, status) {
    try {
        await fetch(`${API_BASE}/work-orders/${orderNo}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        showAlert('状态更新成功！', 'success');
        loadWorkOrders();
    } catch (error) {
        console.error('Error:', error);
        showAlert('状态更新失败', 'error');
    }
}

function initCharts() {
    const densityCtx = document.getElementById('density-chart').getContext('2d');
    const trendCtx = document.getElementById('trend-chart').getContext('2d');
    
    densityChart = new Chart(densityCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '伤损密度 (处/km)',
                data: [],
                backgroundColor: 'rgba(42, 82, 152, 0.7)',
                borderColor: 'rgba(42, 82, 152, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });
    
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '历史数据',
                data: [],
                borderColor: 'rgba(42, 82, 152, 1)',
                backgroundColor: 'rgba(42, 82, 152, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: '预测数据',
                data: [],
                borderColor: 'rgba(220, 53, 69, 1)',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                borderDash: [5, 5],
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });
}

async function loadReportData() {
    try {
        const [statsRes, densityRes, trendRes] = await Promise.all([
            fetch(`${API_BASE}/reports/statistics`),
            fetch(`${API_BASE}/reports/density`),
            fetch(`${API_BASE}/reports/trend`)
        ]);
        
        const stats = await statsRes.json();
        const densityData = await densityRes.json();
        const trendData = await trendRes.json();
        
        updateStats(stats);
        updateDensityChart(densityData);
        updateTrendChart(trendData);
        updateSectionStatsTable(densityData);
    } catch (error) {
        console.error('Error:', error);
        loadMockReportData();
    }
}

function loadMockReportData() {
    const stats = { total: 45, level1: 25, level2: 15, level3: 5 };
    const densityData = [
        { section: '1号线-区间A', totalCount: 8, density: 2.3, level1: 5, level2: 2, level3: 1 },
        { section: '1号线-区间B', totalCount: 12, density: 3.5, level1: 6, level2: 4, level3: 2 },
        { section: '1号线-区间C', totalCount: 6, density: 1.8, level1: 4, level2: 2, level3: 0 },
        { section: '2号线-区间A', totalCount: 9, density: 2.7, level1: 5, level2: 3, level3: 1 },
        { section: '2号线-区间B', totalCount: 7, density: 2.1, level1: 4, level2: 2, level3: 1 },
        { section: '2号线-区间C', totalCount: 3, density: 0.9, level1: 1, level2: 2, level3: 0 }
    ];
    const trendData = {
        months: ['1月', '2月', '3月', '4月', '5月', '6月'],
        historical: [8, 12, 10, 15, 18, 22],
        predicted: [25, 28, 32, 35]
    };
    
    updateStats(stats);
    updateDensityChart(densityData);
    updateTrendChart(trendData);
    updateSectionStatsTable(densityData);
}

function updateStats(stats) {
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-level1').textContent = stats.level1;
    document.getElementById('stat-level2').textContent = stats.level2;
    document.getElementById('stat-level3').textContent = stats.level3;
}

function updateDensityChart(data) {
    densityChart.data.labels = data.map(d => d.section);
    densityChart.data.datasets[0].data = data.map(d => d.density);
    densityChart.update();
}

function updateTrendChart(data) {
    const allLabels = [...data.months];
    const historicalData = [...data.historical];
    const predictedData = new Array(data.months.length).fill(null);
    
    data.predicted.forEach((val, i) => {
        allLabels.push(`预测${i + 1}月`);
        historicalData.push(null);
        predictedData.push(val);
    });
    
    trendChart.data.labels = allLabels;
    trendChart.data.datasets[0].data = historicalData;
    trendChart.data.datasets[1].data = predictedData;
    trendChart.update();
}

function updateSectionStatsTable(data) {
    const tbody = document.querySelector('#section-stats-table tbody');
    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.section}</td>
            <td>${item.totalCount}</td>
            <td><span class="badge badge-level1">${item.level1}</span></td>
            <td><span class="badge badge-level2">${item.level2}</span></td>
            <td><span class="badge badge-level3">${item.level3}</span></td>
            <td>${item.density.toFixed(2)}</td>
        </tr>
    `).join('');
}

function showAlert(message, type) {
    const container = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.innerHTML = '';
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

function getMockInspections() {
    return [
        { id: 1, section: '1号线-区间A', mileage: 'K12+345', railPosition: '左轨', damageType: '裂纹', depth: 3.2, lineSpeed: 80, severityLevel: 'Ⅰ级', inspectionDate: '2026-05-15' },
        { id: 2, section: '1号线-区间B', mileage: 'K15+678', railPosition: '右轨', damageType: '核伤', depth: 7.5, lineSpeed: 80, severityLevel: 'Ⅱ级', inspectionDate: '2026-05-16' },
        { id: 3, section: '2号线-区间A', mileage: 'K8+123', railPosition: '左轨', damageType: '磨耗', depth: 9.0, lineSpeed: 120, severityLevel: 'Ⅲ级', inspectionDate: '2026-05-17' },
        { id: 4, section: '1号线-区间C', mileage: 'K20+456', railPosition: '右轨', damageType: '裂纹', depth: 2.8, lineSpeed: 80, severityLevel: 'Ⅰ级', inspectionDate: '2026-05-17' },
        { id: 5, section: '2号线-区间B', mileage: 'K10+789', railPosition: '左轨', damageType: '核伤', depth: 6.1, lineSpeed: 120, severityLevel: 'Ⅱ级', inspectionDate: '2026-05-16' },
        { id: 6, section: '2号线-区间C', mileage: 'K5+200', railPosition: '右轨', damageType: '磨耗', depth: 4.2, lineSpeed: 120, severityLevel: 'Ⅱ级', inspectionDate: '2026-05-15' }
    ];
}

function getMockWorkOrders() {
    return [
        { orderNo: 'WO20260517001', section: '1号线-区间B', mileage: 'K15+678', damageType: '核伤', severityLevel: 'Ⅱ级', suggestedRepairTime: '1个月内', createTime: '2026-05-17 10:30', status: 'PENDING' },
        { orderNo: 'WO20260517002', section: '2号线-区间A', mileage: 'K8+123', damageType: '磨耗', severityLevel: 'Ⅲ级', suggestedRepairTime: '立即修复', createTime: '2026-05-17 14:20', status: 'PROCESSING' },
        { orderNo: 'WO20260517003', section: '2号线-区间B', mileage: 'K10+789', damageType: '核伤', severityLevel: 'Ⅱ级', suggestedRepairTime: '1个月内', createTime: '2026-05-16 09:15', status: 'COMPLETED' }
    ];
}
