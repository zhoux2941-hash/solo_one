const API_BASE = 'http://localhost:8080/api/museum';

let flowChart = null;
let heatmapCanvas = null;
let heatmapCtx = null;
let currentTimeRange = 60;
let heatmapData = [];
let exhibits = [];

document.addEventListener('DOMContentLoaded', function() {
    initCanvas();
    initEventListeners();
    startClock();
    loadAllData();
    setInterval(loadRealtimeData, 5000);
    setInterval(loadHeatRanking, 10000);
    setInterval(loadHeatmap, 10000);
    setInterval(loadVisitorFlow, 60000);
});

function initCanvas() {
    heatmapCanvas = document.getElementById('heatmapCanvas');
    heatmapCtx = heatmapCanvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    heatmapCanvas.addEventListener('mousemove', handleHeatmapHover);
    heatmapCanvas.addEventListener('mouseleave', handleHeatmapLeave);
}

function resizeCanvas() {
    const container = heatmapCanvas.parentElement;
    const rect = container.getBoundingClientRect();
    heatmapCanvas.width = rect.width;
    heatmapCanvas.height = rect.height;
    if (heatmapData.length > 0) {
        drawHeatmap();
    }
}

function initEventListeners() {
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentTimeRange = parseInt(this.dataset.minutes);
            loadVisitorFlow();
        });
    });
}

function startClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
    document.getElementById('current-time').textContent = timeStr;
}

function setConnectionStatus(connected) {
    const badge = document.getElementById('connection-status');
    if (connected) {
        badge.textContent = '● 已连接';
        badge.classList.remove('error');
    } else {
        badge.textContent = '● 连接失败';
        badge.classList.add('error');
    }
}

async function loadAllData() {
    try {
        await Promise.all([
            loadRealtimeData(),
            loadVisitorFlow(),
            loadHeatRanking(),
            loadHeatmap(),
            loadExhibits()
        ]);
        setConnectionStatus(true);
    } catch (error) {
        console.error('加载数据失败:', error);
        setConnectionStatus(false);
    }
}

async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

async function loadRealtimeStats() {
    const data = await fetchData(`${API_BASE}/realtime-stats`);
    document.getElementById('current-visitors').textContent = data.currentVisitorCount || 0;
    document.getElementById('hot-exhibits').textContent = data.hotExhibitCount || 0;
    document.getElementById('wifi-probes').textContent = data.activeWifiProbes || 0;
    document.getElementById('total-records').textContent = data.totalStayRecords || 0;
    document.getElementById('avg-accuracy').textContent = data.avgPositioningAccuracy || '0.0';
    document.getElementById('avg-confidence').textContent = Math.round((data.avgPositioningConfidence || 0) * 100) + '%';
    document.getElementById('avg-gaze-ratio').textContent = Math.round((data.avgGazeRatio || 0) * 100) + '%';
    document.getElementById('passing-by-rate').textContent = Math.round((data.passingByRate || 0) * 100) + '%';

    if (data.gazeTracking) {
        document.getElementById('active-cameras').textContent = data.gazeTracking.activeCameras || 0;
    }
}

async function loadRealtimeData() {
    try {
        await loadRealtimeStats();
        setConnectionStatus(true);
    } catch (error) {
        console.error('加载实时数据失败:', error);
        setConnectionStatus(false);
    }
}

async function loadVisitorFlow() {
    try {
        const data = await fetchData(`${API_BASE}/visitor-flow?minutes=${currentTimeRange}`);
        renderFlowChart(data);
    } catch (error) {
        console.error('加载客流数据失败:', error);
    }
}

function renderFlowChart(data) {
    const ctx = document.getElementById('flowChart').getContext('2d');

    const labels = data.map(d => d.timeStr);
    const enterData = data.map(d => d.enterCount);
    const leaveData = data.map(d => d.leaveCount);
    const currentData = data.map(d => d.currentVisitorCount);

    const step = Math.max(1, Math.floor(labels.length / 12));
    const displayLabels = labels.map((l, i) => i % step === 0 ? l : '');

    if (flowChart) {
        flowChart.destroy();
    }

    flowChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: displayLabels,
            datasets: [
                {
                    label: '当前人数',
                    data: currentData,
                    borderColor: '#3949ab',
                    backgroundColor: 'rgba(57, 73, 171, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 0,
                    yAxisID: 'y1'
                },
                {
                    label: '进入人数',
                    data: enterData,
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: false,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 0,
                    yAxisID: 'y'
                },
                {
                    label: '离开人数',
                    data: leaveData,
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    fill: false,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 0,
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
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        maxRotation: 0,
                        font: { size: 11 }
                    }
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: { font: { size: 11 } },
                    title: {
                        display: true,
                        text: '每分钟进出人数',
                        font: { size: 11 }
                    }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    grid: { display: false },
                    ticks: { font: { size: 11 } },
                    title: {
                        display: true,
                        text: '当前在馆人数',
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

async function loadHeatRanking() {
    try {
        const data = await fetchData(`${API_BASE}/heat-ranking`);
        renderHeatRanking(data);
    } catch (error) {
        console.error('加载热度排行失败:', error);
    }
}

function renderHeatRanking(data) {
    const tbody = document.getElementById('ranking-body');
    tbody.innerHTML = '';

    data.forEach(item => {
        const rankClass = item.rank <= 3 ? `rank-${item.rank}` : 'rank-other';
        const hotClass = item.hot ? 'hot' : 'normal';
        const hotText = item.hot ? '🔥 热门' : '正常';
        const durationClass = item.hot ? 'avg-duration hot' : 'avg-duration';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="rank-badge ${rankClass}">${item.rank}</span></td>
            <td><strong>${item.exhibitName}</strong></td>
            <td>${item.visitorCount}</td>
            <td><span class="${durationClass}">${item.avgStayDuration.toFixed(1)}</span></td>
            <td>${item.totalStayDuration}</td>
            <td><span class="hot-badge ${hotClass}">${hotText}</span></td>
        `;
        tbody.appendChild(row);
    });
}

async function loadHeatmap() {
    try {
        const data = await fetchData(`${API_BASE}/heatmap`);
        heatmapData = data;
        drawHeatmap();
    } catch (error) {
        console.error('加载热力图失败:', error);
    }
}

function drawHeatmap() {
    const width = heatmapCanvas.width;
    const height = heatmapCanvas.height;

    heatmapCtx.clearRect(0, 0, width, height);

    drawFloorPlan(width, height);

    heatmapData.forEach(point => {
        const x = (point.x / 100) * width;
        const y = (point.y / 100) * height;
        const radius = 30 + (point.value / 100) * 30;

        const gradient = heatmapCtx.createRadialGradient(x, y, 0, x, y, radius);
        const color = getHeatColor(point.value);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        heatmapCtx.fillStyle = gradient;
        heatmapCtx.beginPath();
        heatmapCtx.arc(x, y, radius, 0, Math.PI * 2);
        heatmapCtx.fill();

        heatmapCtx.fillStyle = '#333';
        heatmapCtx.font = 'bold 11px Microsoft YaHei';
        heatmapCtx.textAlign = 'center';
        heatmapCtx.fillText(point.exhibitName, x, y + 4);
    });
}

function drawFloorPlan(width, height) {
    heatmapCtx.strokeStyle = '#ddd';
    heatmapCtx.lineWidth = 1;

    heatmapCtx.strokeRect(2, 2, width - 4, height - 4);

    heatmapCtx.setLineDash([5, 5]);
    heatmapCtx.strokeRect(5, 5, (width - 10) / 2, height - 10);
    heatmapCtx.strokeRect(5 + (width - 10) / 2, 5, (width - 10) / 2, height - 10);
    heatmapCtx.setLineDash([]);

    heatmapCtx.fillStyle = '#999';
    heatmapCtx.font = '12px Microsoft YaHei';
    heatmapCtx.textAlign = 'left';
    heatmapCtx.fillText('A区', 10, 20);
    heatmapCtx.fillText('B区', width / 2 + 10, 20);

    heatmapCtx.fillStyle = '#4caf50';
    heatmapCtx.fillRect(width / 2 - 20, height - 25, 40, 20);
    heatmapCtx.fillStyle = '#fff';
    heatmapCtx.font = '10px Microsoft YaHei';
    heatmapCtx.textAlign = 'center';
    heatmapCtx.fillText('入口', width / 2, height - 10);
}

function getHeatColor(value) {
    if (value >= 70) {
        return `rgba(239, 83, 80, ${0.5 + (value / 200)})`;
    } else if (value >= 40) {
        return `rgba(255, 152, 0, ${0.4 + (value / 250)})`;
    } else {
        return `rgba(41, 182, 246, ${0.3 + (value / 300)})`;
    }
}

function handleHeatmapHover(e) {
    const rect = heatmapCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = heatmapCanvas.width;
    const height = heatmapCanvas.height;

    let hoveredPoint = null;
    let minDist = Infinity;

    heatmapData.forEach(point => {
        const px = (point.x / 100) * width;
        const py = (point.y / 100) * height;
        const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
        if (dist < 40 && dist < minDist) {
            minDist = dist;
            hoveredPoint = point;
        }
    });

    const tooltip = document.getElementById('heatmap-tooltip');
    if (hoveredPoint) {
        tooltip.innerHTML = `
            <strong>${hoveredPoint.exhibitName}</strong><br>
            热度值: ${hoveredPoint.value}/100
        `;
        tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
        tooltip.style.top = (e.clientY - rect.top + 15) + 'px';
        tooltip.classList.add('visible');
    } else {
        tooltip.classList.remove('visible');
    }
}

function handleHeatmapLeave() {
    document.getElementById('heatmap-tooltip').classList.remove('visible');
}

async function loadExhibits() {
    try {
        const data = await fetchData(`${API_BASE}/exhibits`);
        exhibits = data;
        const heatRanking = await fetchData(`${API_BASE}/heat-ranking`);
        renderExhibits(data, heatRanking);
    } catch (error) {
        console.error('加载展品列表失败:', error);
    }
}

function renderExhibits(exhibitsList, heatRanking) {
    const grid = document.getElementById('exhibits-grid');
    grid.innerHTML = '';

    const heatMap = {};
    heatRanking.forEach(h => {
        heatMap[h.exhibitId] = h;
    });

    exhibitsList.forEach(exhibit => {
        const heat = heatMap[exhibit.id];
        const isHot = heat && heat.isHot;
        const hotClass = isHot ? 'hot' : '';

        const card = document.createElement('div');
        card.className = `exhibit-card ${hotClass}`;
        card.innerHTML = `
            <div class="exhibit-header">
                <span class="exhibit-name">${exhibit.name}</span>
                <span class="exhibit-category">${exhibit.category}</span>
            </div>
            <div class="exhibit-desc">${exhibit.description}</div>
            <div class="exhibit-stats">
                <span>位置: (${exhibit.x}, ${exhibit.y})</span>
                ${heat ? `<span>平均停留: ${heat.avgStayDuration.toFixed(1)}秒</span>` : ''}
            </div>
            ${heat ? `<div class="exhibit-stats">
                <span>参观人数: ${heat.visitorCount}</span>
                <span>${isHot ? '🔥 热门展品' : '正常'}</span>
            </div>` : ''}
        `;
        grid.appendChild(card);
    });
}
