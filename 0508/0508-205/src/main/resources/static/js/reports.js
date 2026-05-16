const slopeNames = {
    1: '初级雪道1号',
    2: '初级雪道2号',
    3: '中级雪道1号',
    4: '中级雪道2号',
    5: '高级雪道1号',
    6: '高级雪道2号'
};

function initReportDates() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    document.getElementById('reportDate').value = dateStr;

    const startTime = new Date(today);
    startTime.setHours(0, 0, 0, 0);
    document.getElementById('queueStartTime').value = startTime.toISOString().slice(0, 16);
    
    const endTime = new Date(today);
    endTime.setHours(23, 59, 59, 999);
    document.getElementById('queueEndTime').value = endTime.toISOString().slice(0, 16);

    loadVisitorReport();
    loadQueueReport();
}

async function loadVisitorReport() {
    const date = document.getElementById('reportDate').value;
    
    try {
        const report = await api.getDailyVisitorReport(date);
        renderVisitorReport(report);
    } catch (error) {
        console.error('加载客流量报表失败:', error);
    }
}

function renderVisitorReport(report) {
    document.getElementById('totalVisitors').textContent = report.totalVisitors;
    
    const peakHours = report.peakHours || [];
    document.getElementById('peakHour').textContent = peakHours.length > 0 
        ? `${peakHours[0]}:00` 
        : '-';

    renderHourlyChart(report.hourlyVisitors);
    renderSlopeStats(report.slopeVisitors);
}

function renderHourlyChart(hourlyVisitors) {
    const container = document.getElementById('hourlyChart');
    container.innerHTML = '';

    const maxValue = Math.max(...Object.values(hourlyVisitors), 1);

    for (let hour = 8; hour <= 20; hour++) {
        const value = hourlyVisitors[hour] || 0;
        const heightPercent = (value / maxValue) * 100;

        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${Math.max(heightPercent, 2)}%`;
        bar.title = `${hour}:00 - ${value}人`;

        if (value > 0) {
            const valueLabel = document.createElement('span');
            valueLabel.className = 'bar-value';
            valueLabel.textContent = value;
            bar.appendChild(valueLabel);
        }

        const label = document.createElement('span');
        label.className = 'bar-label';
        label.textContent = hour;
        bar.appendChild(label);

        container.appendChild(bar);
    }
}

function renderSlopeStats(slopeVisitors) {
    const container = document.getElementById('slopeStats');
    container.innerHTML = '';

    const entries = Object.entries(slopeVisitors).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
        container.innerHTML = '<p style="color: #666;">暂无数据</p>';
        return;
    }

    entries.forEach(([slopeId, count]) => {
        const item = document.createElement('div');
        item.className = 'slope-stat-item';
        item.innerHTML = `
            <div class="slope-stat-name">${slopeNames[slopeId] || `雪道${slopeId}`}</div>
            <div class="slope-stat-value">${count}人</div>
        `;
        container.appendChild(item);
    });
}

async function loadQueueReport() {
    const start = document.getElementById('queueStartTime').value;
    const end = document.getElementById('queueEndTime').value;

    try {
        const report = await api.getQueueReport(start, end);
        renderQueueReport(report);
    } catch (error) {
        console.error('加载排队报表失败:', error);
    }
}

function renderQueueReport(report) {
    const container = document.getElementById('queueStats');
    container.innerHTML = '';

    const liftStats = report.liftStats || {};

    if (Object.keys(liftStats).length === 0) {
        container.innerHTML = '<p style="color: #666; grid-column: 1/-1;">暂无数据</p>';
        return;
    }

    Object.entries(liftStats).forEach(([liftId, stats]) => {
        const card = document.createElement('div');
        card.className = 'queue-stat-card';
        
        const avgWaitTime = stats.avgWaitTime || 0;
        const maxWaitTime = stats.maxWaitTime || 0;
        const avgQueue = stats.avgQueueSize || 0;
        const maxQueue = stats.maxQueueSize || 0;

        card.innerHTML = `
            <div class="queue-stat-name">${stats.liftName || `缆车${liftId}`}</div>
            <div class="queue-stat-row">
                <span>平均排队人数</span>
                <span style="font-weight: bold; color: #667eea;">${avgQueue}人</span>
            </div>
            <div class="queue-stat-row">
                <span>最高排队人数</span>
                <span style="font-weight: bold; color: #f44336;">${maxQueue}人</span>
            </div>
            <div class="queue-stat-row">
                <span>平均等待时间</span>
                <span style="font-weight: bold; color: #2196F3;">${avgWaitTime}分</span>
            </div>
            <div class="queue-stat-row">
                <span>最长等待时间</span>
                <span style="font-weight: bold; color: #ff9800;">${maxWaitTime}分</span>
            </div>
            ${renderPeakHours(stats.hourlyPeakQueue)}
        `;

        container.appendChild(card);
    });
}

function renderPeakHours(hourlyPeakQueue) {
    if (!hourlyPeakQueue || Object.keys(hourlyPeakQueue).length === 0) {
        return '';
    }

    const entries = Object.entries(hourlyPeakQueue).sort((a, b) => b[1] - a[1]).slice(0, 3);
    
    if (entries.length === 0) return '';

    let html = '<div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #eee;">';
    html += '<div style="font-weight: 500; margin-bottom: 0.5rem; font-size: 0.875rem;">高峰时段</div>';
    
    entries.forEach(([hour, count]) => {
        html += `
            <div class="queue-stat-row">
                <span>${hour}:00</span>
                <span style="color: #f44336;">${count}人</span>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}
