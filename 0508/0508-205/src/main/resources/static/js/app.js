let currentLiftId = null;
let slopesData = [];
let liftsData = [];

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    loadData();
    initReportDates();
    setInterval(loadData, 30000);
});

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const pageId = btn.dataset.page + '-page';
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');

            if (btn.dataset.page === 'reports') {
                const today = new Date().toISOString().split('T')[0];
                const reportDate = document.getElementById('reportDate');
                if (reportDate && !reportDate.value) {
                    reportDate.value = today;
                }
                loadVisitorReport();
                loadQueueReport();
            }
        });
    });
}

function updateCurrentTime() {
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeStr;
}

async function loadData() {
    try {
        slopesData = await api.getSlopes();
        liftsData = await api.getLifts();
        
        renderMap(slopesData, liftsData);
        renderSlopesList(slopesData);
        renderLiftsList(liftsData);
        renderLiftQueuePanel(liftsData);
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

function refreshSlopes() {
    loadData();
}

function refreshLifts() {
    loadData();
}

function renderSlopesList(slopes) {
    const container = document.getElementById('slopesList');
    container.innerHTML = '';

    slopes.forEach(slope => {
        const card = document.createElement('div');
        card.classList.add('slope-card', slope.difficulty.toLowerCase());
        
        card.innerHTML = `
            <div class="slope-name">${slope.name}</div>
            <div class="slope-info">
                <span>难度: ${getDifficultyText(slope.difficulty)}</span>
                <span class="slope-status ${slope.status}">${getStatusText(slope.status)}</span>
            </div>
            <div class="slope-info">
                <span>长度: ${slope.length}米</span>
                <span>今日客流: ${slope.visitorCount}人</span>
            </div>
            <div class="slope-actions">
                ${slope.status !== 'OPEN' ? 
                    `<button class="btn btn-success" onclick="changeSlopeStatus(${slope.id}, 'OPEN')">开放</button>` : 
                    `<button class="btn btn-danger" onclick="changeSlopeStatus(${slope.id}, 'CLOSED')">关闭</button>`
                }
                ${slope.status !== 'GROOMING' ? 
                    `<button class="btn btn-warning" onclick="changeSlopeStatus(${slope.id}, 'GROOMING')">压雪</button>` : 
                    `<button class="btn btn-success" onclick="changeSlopeStatus(${slope.id}, 'OPEN')">完成</button>`
                }
                <button class="btn btn-primary" onclick="addVisitor(${slope.id})">+1客流</button>
            </div>
        `;

        container.appendChild(card);
    });
}

function renderLiftsList(lifts) {
    const container = document.getElementById('liftsList');
    container.innerHTML = '';

    lifts.forEach(lift => {
        const waitTime = lift.estimatedWaitTimeMinutes || Math.ceil(lift.currentQueue / (lift.capacityPerHour / 60));
        
        const card = document.createElement('div');
        card.classList.add('lift-card');
        
        card.innerHTML = `
            <div class="lift-name">${lift.name}</div>
            <div class="lift-info">
                <span>类型: ${getLiftTypeText(lift.type)}</span>
                <span>状态: ${lift.isActive ? '运行中' : '已停止'}</span>
            </div>
            <div class="lift-info">
                <span>运力: ${lift.capacityPerHour}人/小时</span>
                <span>行程: ${lift.rideTimeMinutes}分钟</span>
            </div>
            <div class="lift-queue">
                <div>
                    <div style="font-size: 0.875rem; color: #666;">当前排队</div>
                    <div class="queue-count">${lift.currentQueue}人</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: #666;">预计等待</div>
                    <div class="queue-count" style="color: ${waitTime > 10 ? '#f44336' : '#28a745'}">
                        ${waitTime}分
                    </div>
                </div>
            </div>
            <div class="lift-actions">
                <button class="btn btn-primary" onclick="openQueueModal(${lift.id}, '${lift.name}', ${lift.currentQueue}, ${lift.capacityPerHour})">
                    更新排队
                </button>
                <button class="btn ${lift.isActive ? 'btn-warning' : 'btn-success'}" onclick="toggleLift(${lift.id})">
                    ${lift.isActive ? '停止' : '启动'}
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

async function changeSlopeStatus(id, status) {
    try {
        await api.updateSlopeStatus(id, status);
        loadData();
    } catch (error) {
        console.error('更新雪道状态失败:', error);
    }
}

async function addVisitor(id) {
    try {
        await api.incrementVisitor(id);
        loadData();
    } catch (error) {
        console.error('增加客流量失败:', error);
    }
}

function openQueueModal(liftId, liftName, currentQueue, capacityPerHour) {
    currentLiftId = liftId;
    document.getElementById('modalLiftName').textContent = liftName;
    document.getElementById('queueSizeInput').value = currentQueue;
    document.getElementById('recordedByInput').value = '';
    updateEstimatedWaitTime(currentQueue, capacityPerHour);
    document.getElementById('queueModal').classList.add('show');
}

function updateEstimatedWaitTime(queueSize, capacityPerHour) {
    const waitTime = Math.ceil(queueSize / (capacityPerHour / 60));
    document.getElementById('estimatedWaitTime').textContent = `${waitTime} 分钟`;
}

document.getElementById('queueSizeInput').addEventListener('input', (e) => {
    const lift = liftsData.find(l => l.id === currentLiftId);
    if (lift) {
        updateEstimatedWaitTime(parseInt(e.target.value) || 0, lift.capacityPerHour);
    }
});

function closeModal() {
    document.getElementById('queueModal').classList.remove('show');
    currentLiftId = null;
}

async function submitQueueUpdate() {
    const queueSize = parseInt(document.getElementById('queueSizeInput').value) || 0;
    const recordedBy = document.getElementById('recordedByInput').value || 'system';

    try {
        await api.updateLiftQueue(currentLiftId, queueSize, recordedBy);
        closeModal();
        loadData();
    } catch (error) {
        console.error('更新排队人数失败:', error);
    }
}

async function toggleLift(id) {
    try {
        await api.toggleLiftStatus(id);
        loadData();
    } catch (error) {
        console.error('切换缆车状态失败:', error);
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('queueModal');
    if (event.target === modal) {
        closeModal();
    }
};
