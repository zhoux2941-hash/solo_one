const API_BASE = '/api';
let stompClient = null;
let dustChart = null;
let autoSimulateInterval = null;
let isAutoSimulating = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...');
    initDateInputs();
    loadSectionSelects();
    loadDashboard();
    loadSections();
    loadWarnings();
    loadDurationReport();
    connectWebSocket();
    console.log('初始化完成');
});

function initDateInputs() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const formatDateTime = (date) => {
        return date.toISOString().slice(0, 16);
    };
    
    document.getElementById('report-start').value = formatDateTime(yesterday);
    document.getElementById('report-end').value = formatDateTime(now);
    document.getElementById('duration-start').value = formatDateTime(yesterday);
    document.getElementById('duration-end').value = formatDateTime(now);
}

function switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
    
    if (tabName === 'reports') {
        loadDustTrend();
        loadDurationReport();
    }
}

async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/report/dashboard`);
        const data = await response.json();
        
        document.getElementById('total-sections').textContent = data.totalSections;
        document.getElementById('active-ventilation').textContent = data.activeVentilationCount;
        document.getElementById('active-warnings').textContent = data.activeWarningCount;
        document.getElementById('normal-sections').textContent = data.totalSections - data.activeVentilationCount;
    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
    }
}

async function loadSections() {
    try {
        const response = await fetch(`${API_BASE}/sections`);
        const sections = await response.json();
        
        const container = document.getElementById('sections-container');
        container.innerHTML = '';
        
        for (const section of sections) {
            const dustData = await getLatestDustData(section.sectionId);
            const card = createSectionCard(section, dustData);
            container.appendChild(card);
        }
    } catch (error) {
        console.error('加载区间数据失败:', error);
    }
}

async function getLatestDustData(sectionId) {
    try {
        const response = await fetch(`${API_BASE}/dust/section/${sectionId}`);
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        return null;
    }
}

function createSectionCard(section, dustData) {
    const card = document.createElement('div');
    card.className = 'section-card ' + (section.ventilationActive ? 'ventilating' : 'normal');
    card.id = `section-${section.sectionId}`;

    const isWarning = dustData && (dustData.pm25 > 75 || dustData.pm10 > 150);
    if (isWarning) {
        card.className = 'section-card warning';
    } else if (section.ventilationActive) {
        card.className = 'section-card ventilating';
    }

    let statusText = '正常';
    let statusClass = 'status-normal';
    
    if (isWarning) {
        statusText = '浓度超标';
        statusClass = 'status-warning';
    } else if (section.ventilationActive) {
        statusText = '通风中';
        statusClass = 'status-ventilating';
    }

    const pm25Class = dustData && dustData.pm25 > 75 ? 'high' : 'normal';
    const pm10Class = dustData && dustData.pm10 > 150 ? 'high' : 'normal';

    card.innerHTML = `
        <div class="section-header">
            <div class="section-name">${section.sectionName}</div>
            <span class="section-status ${statusClass}">${statusText}</span>
        </div>
        <div class="dust-values">
            <div class="dust-item">
                <div class="dust-label">PM2.5 (μg/m³)</div>
                <div class="dust-value ${pm25Class}">${dustData ? dustData.pm25.toFixed(1) : '--'}</div>
            </div>
            <div class="dust-item">
                <div class="dust-label">PM10 (μg/m³)</div>
                <div class="dust-value ${pm10Class}">${dustData ? dustData.pm10.toFixed(1) : '--'}</div>
            </div>
        </div>
        <button class="ventilation-btn ${section.ventilationActive ? 'btn-stop' : 'btn-start'}"
                onclick="toggleVentilation('${section.sectionId}', ${section.ventilationActive})">
            ${section.ventilationActive ? '停止通风' : '开启通风'}
        </button>
    `;

    return card;
}

async function toggleVentilation(sectionId, isActive) {
    console.log('切换通风状态:', { sectionId, isActive });
    const endpoint = isActive ? '/ventilation/stop' : '/ventilation/start';
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sectionId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP错误: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('通风操作结果:', result);

        await loadSections();
        await loadDashboard();
        
        alert(isActive ? '通风已停止' : '通风已开启');
    } catch (error) {
        console.error('操作失败:', error);
        alert('操作失败: ' + error.message);
    }
}

async function loadWarnings() {
    try {
        const response = await fetch(`${API_BASE}/warnings/all`);
        const warnings = await response.json();
        
        const container = document.getElementById('warnings-container');
        
        if (warnings.length === 0) {
            container.innerHTML = '<div style="padding: 40px; text-align: center; color: #999;">暂无预警记录</div>';
            return;
        }

        container.innerHTML = warnings.map(warning => `
            <div class="warning-item">
                <div class="warning-info">
                    <h4>⚠️ ${warning.sectionName}</h4>
                    <p>${warning.warningType} - PM2.5: ${warning.pm25?.toFixed(1)} μg/m³, PM10: ${warning.pm10?.toFixed(1)} μg/m³</p>
                </div>
                <div class="warning-time">
                    ${formatTime(warning.warningTime)}
                    <br>
                    <span style="color: ${warning.resolved ? '#4caf50' : '#f44336'}">
                        ${warning.resolved ? '已解除' : '未解除'}
                    </span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('加载预警记录失败:', error);
    }
}

async function loadDustTrend() {
    console.log('加载粉尘浓度趋势图...');
    const sectionId = document.getElementById('report-section').value;
    const startTime = document.getElementById('report-start').value;
    const endTime = document.getElementById('report-end').value;

    if (!startTime || !endTime) {
        alert('请选择时间范围');
        return;
    }

    try {
        let url = `${API_BASE}/report/dust-trend?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
        if (sectionId) {
            url += `&sectionId=${sectionId}`;
        }

        console.log('请求URL:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('趋势图数据:', data);

        const ctx = document.getElementById('dust-chart').getContext('2d');
        
        const datasets = [];
        const colors = ['#283593', '#f44336', '#4caf50', '#ff9800', '#9c27b0'];
        let colorIndex = 0;

        for (const [sectionId, points] of Object.entries(data.trendData)) {
            if (points.length === 0) continue;

            datasets.push({
                label: `${sectionId} - PM2.5`,
                data: points.map(p => ({ x: p.time, y: p.pm25 })),
                borderColor: colors[colorIndex % colors.length],
                backgroundColor: colors[colorIndex % colors.length] + '20',
                tension: 0.4,
                fill: false
            });

            datasets.push({
                label: `${sectionId} - PM10`,
                data: points.map(p => ({ x: p.time, y: p.pm10 })),
                borderColor: colors[(colorIndex + 1) % colors.length],
                backgroundColor: colors[(colorIndex + 1) % colors.length] + '20',
                tension: 0.4,
                fill: false,
                borderDash: [5, 5]
            });

            colorIndex += 2;
        }

        if (datasets.length === 0) {
            datasets.push({
                label: '暂无数据',
                data: [],
                borderColor: '#999'
            });
        }

        if (dustChart) {
            dustChart.destroy();
        }

        dustChart = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: '时间'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '浓度 (μg/m³)'
                        }
                    }
                }
            }
        });
        
        console.log('趋势图加载完成');
    } catch (error) {
        console.error('加载趋势图失败:', error);
        alert('加载趋势图失败: ' + error.message);
    }
}

async function loadDurationReport() {
    console.log('加载通风时长报表...');
    const startTime = document.getElementById('duration-start').value;
    const endTime = document.getElementById('duration-end').value;

    if (!startTime || !endTime) {
        return;
    }

    try {
        const url = `${API_BASE}/report/ventilation-duration?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
        console.log('请求URL:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('时长报表数据:', data);

        const container = document.getElementById('duration-container');

        if (!data.durationList || data.durationList.length === 0) {
            container.innerHTML = '<div style="padding: 40px; text-align: center; color: #999;">暂无数据</div>';
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>隧道区间</th>
                        <th>运行状态</th>
                        <th>总运行时长</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.durationList.map(item => `
                        <tr>
                            <td>${item.sectionName}</td>
                            <td>
                                ${item.currentlyRunning 
                                    ? '<span class="running-indicator"></span>运行中 (' + Math.round(item.currentDuration / 60) + ' 分钟)' 
                                    : '已停止'}
                            </td>
                            <td>${item.totalDurationHours} 小时</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        console.log('时长报表加载完成');
    } catch (error) {
        console.error('加载运行时长失败:', error);
        alert('加载运行时长失败: ' + error.message);
    }
}

async function loadSectionSelects() {
    console.log('开始加载区间选项...');
    try {
        const response = await fetch(`${API_BASE}/sections`);
        console.log('API响应状态:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }
        
        const sections = await response.json();
        console.log('获取到的区间数据:', sections);

        const simulateSelect = document.getElementById('simulate-section');
        const reportSelect = document.getElementById('report-section');

        if (!simulateSelect || !reportSelect) {
            console.error('未找到下拉框元素');
            return;
        }

        while (simulateSelect.options.length > 1) {
            simulateSelect.remove(1);
        }
        while (reportSelect.options.length > 1) {
            reportSelect.remove(1);
        }

        sections.forEach(section => {
            simulateSelect.add(new Option(section.sectionName, section.sectionId));
            reportSelect.add(new Option(section.sectionName, section.sectionId));
        });
        
        console.log('区间选项加载完成');
    } catch (error) {
        console.error('加载区间选项失败:', error);
    }
}

async function simulateReport() {
    console.log('开始模拟上报...');
    const sectionSelect = document.getElementById('simulate-section');
    const pm25Input = document.getElementById('simulate-pm25');
    const pm10Input = document.getElementById('simulate-pm10');
    
    const sectionId = sectionSelect.value;
    const pm25 = parseFloat(pm25Input.value);
    const pm10 = parseFloat(pm10Input.value);

    console.log('输入值:', { sectionId, pm25, pm10 });

    if (!sectionId || sectionId === '') {
        alert('请选择隧道区间');
        sectionSelect.focus();
        return;
    }
    if (isNaN(pm25)) {
        alert('请输入有效的PM2.5数值');
        pm25Input.focus();
        return;
    }
    if (isNaN(pm10)) {
        alert('请输入有效的PM10数值');
        pm10Input.focus();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/dust/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sectionId, pm25, pm10 })
        });

        console.log('上报响应状态:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP错误: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('上报结果:', result);

        await loadSections();
        await loadDashboard();
        await loadWarnings();
        
        alert('数据上报成功！');
        
        pm25Input.value = '';
        pm10Input.value = '';
    } catch (error) {
        console.error('模拟上报失败:', error);
        alert('模拟上报失败: ' + error.message);
    }
}

function toggleAutoSimulate() {
    const btn = document.getElementById('auto-simulate-btn');
    
    if (isAutoSimulating) {
        clearInterval(autoSimulateInterval);
        isAutoSimulating = false;
        btn.textContent = '开始自动模拟';
        btn.className = 'btn-auto-simulate';
    } else {
        autoSimulateInterval = setInterval(autoSimulate, 10000);
        isAutoSimulating = true;
        btn.textContent = '停止自动模拟';
        btn.className = 'btn-stop-simulate';
        autoSimulate();
    }
}

async function autoSimulate() {
    try {
        const response = await fetch(`${API_BASE}/sections`);
        const sections = await response.json();

        for (const section of sections) {
            const pm25 = Math.random() * 120 + 20;
            const pm10 = pm25 * 2 + Math.random() * 50;

            await fetch(`${API_BASE}/dust/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    sectionId: section.sectionId, 
                    pm25: Math.round(pm25 * 10) / 10, 
                    pm10: Math.round(pm10 * 10) / 10 
                })
            });
        }

        loadSections();
        loadDashboard();
        loadWarnings();
    } catch (error) {
        console.error('自动模拟失败:', error);
    }
}

function connectWebSocket() {
    try {
        console.log('尝试连接WebSocket...');
        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, function(frame) {
            console.log('WebSocket连接成功');

            stompClient.subscribe('/topic/dust-data', function(message) {
                console.log('收到粉尘数据更新');
                loadSections();
                loadDashboard();
            });

            stompClient.subscribe('/topic/warnings', function(message) {
                console.log('收到预警更新');
                loadWarnings();
            });

            stompClient.subscribe('/topic/ventilation', function(message) {
                console.log('收到通风更新');
                loadSections();
                loadDashboard();
            });
        }, function(error) {
            console.error('WebSocket连接失败:', error);
        });
    } catch (e) {
        console.error('WebSocket初始化异常:', e);
    }
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
