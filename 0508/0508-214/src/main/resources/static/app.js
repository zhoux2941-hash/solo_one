const API_BASE = 'http://localhost:8080/api';

let currentInmateId = null;
let currentCallId = null;
let callTimer = null;
let callStartTime = null;
let currentAlertId = null;
let editingInmateId = null;

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    loadDashboard();
    loadInmates();
    loadInmateSelect();
});

function initNavigation() {
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
        });
    });
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(`page-${pageId}`).classList.remove('hidden');
    
    switch(pageId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'call':
            loadInmateSelect();
            break;
        case 'records':
            loadCallRecords();
            break;
        case 'alerts':
            loadAlerts();
            break;
        case 'inmates':
            loadInmates();
            break;
        case 'sensitive':
            loadSensitiveWords();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${url}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            ...options
        });
        return await response.json();
    } catch (error) {
        console.error('API请求失败:', error);
        return null;
    }
}

async function loadDashboard() {
    const stats = await apiRequest('/reports/dashboard');
    if (stats) {
        document.getElementById('stat-total-calls').textContent = stats.totalCalls || 0;
        document.getElementById('stat-total-alerts').textContent = stats.totalAlerts || 0;
        document.getElementById('stat-pending-alerts').textContent = stats.pendingAlerts || 0;
    }
    
    const callTrend = await apiRequest('/reports/call-trend?days=7');
    if (callTrend && callTrend.data) {
        renderBarChart('call-trend-chart', callTrend.data, 'callCount');
    }
    
    const alertTrend = await apiRequest('/reports/alert-trend?days=7');
    if (alertTrend && alertTrend.data) {
        renderBarChart('alert-trend-chart', alertTrend.data, 'alertCount', '#f56c6c');
    }
    
    loadLatestAlerts();
}

async function loadLatestAlerts() {
    const alerts = await apiRequest('/alerts');
    const tbody = document.getElementById('latest-alerts-table');
    tbody.innerHTML = '';
    
    if (alerts && alerts.length > 0) {
        alerts.slice(0, 5).forEach(alert => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${alert.inmateName || '-'}</td>
                <td>${alert.prisonArea || '-'}</td>
                <td><span class="badge badge-danger">${alert.sensitiveWords || '-'}</span></td>
                <td>${alert.status === 'PENDING' ? '<span class="badge badge-warning">待处理</span>' : '<span class="badge badge-success">已处理</span>'}</td>
                <td>${formatDateTime(alert.createdAt)}</td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">暂无数据</td></tr>';
    }
}

async function loadInmateSelect() {
    const inmates = await apiRequest('/inmates');
    const select = document.getElementById('call-inmate-select');
    select.innerHTML = '<option value="">请选择服刑人员</option>';
    
    if (inmates) {
        inmates.forEach(inmate => {
            const option = document.createElement('option');
            option.value = inmate.id;
            option.textContent = `${inmate.inmateNo} - ${inmate.name} (${inmate.prisonArea})`;
            select.appendChild(option);
        });
    }
    
    select.addEventListener('change', function() {
        if (this.value) {
            checkQuota(parseInt(this.value));
        } else {
            document.getElementById('quota-info').textContent = '-';
            document.getElementById('quota-message').innerHTML = '';
        }
    });
}

async function checkQuota(inmateId) {
    currentInmateId = inmateId;
    const result = await apiRequest(`/calls/quota/${inmateId}`);
    const quotaInfo = document.getElementById('quota-info');
    const quotaMessage = document.getElementById('quota-message');
    const startBtn = document.getElementById('btn-start-call');
    
    if (result) {
        quotaInfo.innerHTML = `<strong>${result.used}</strong> / ${result.quota} 次`;
        
        if (result.allowed) {
            quotaMessage.innerHTML = `<div class="quota-ok">${result.message}，单次最长 ${result.maxDuration} 分钟</div>`;
            startBtn.disabled = false;
        } else {
            quotaMessage.innerHTML = `<div class="quota-exceeded">${result.message}</div>`;
            startBtn.disabled = true;
        }
    }
}

async function startCall() {
    if (!currentInmateId) {
        alert('请选择服刑人员');
        return;
    }
    
    const calledNumber = document.getElementById('call-number').value;
    const calledPerson = document.getElementById('call-person').value;
    
    const result = await apiRequest('/calls/start', {
        method: 'POST',
        body: JSON.stringify({
            inmateId: currentInmateId,
            calledNumber: calledNumber,
            calledPerson: calledPerson
        })
    });
    
    if (result) {
        currentCallId = result.id;
        callStartTime = new Date();
        
        const select = document.getElementById('call-inmate-select');
        const selectedOption = select.options[select.selectedIndex];
        
        document.getElementById('panel-inmate-name').textContent = result.inmateName;
        document.getElementById('panel-called').textContent = calledPerson || calledNumber;
        
        document.getElementById('call-panel').classList.remove('hidden');
        document.getElementById('btn-start-call').disabled = true;
        document.getElementById('call-inmate-select').disabled = true;
        
        startTimer();
    }
}

function startTimer() {
    callTimer = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now - callStartTime) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        
        document.getElementById('call-timer').textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    if (callTimer) {
        clearInterval(callTimer);
        callTimer = null;
    }
}

async function endCall() {
    stopTimer();
    
    const transcription = document.getElementById('transcription').value;
    
    const result = await apiRequest(`/calls/end/${currentCallId}`, {
        method: 'POST',
        body: JSON.stringify({ transcription: transcription })
    });
    
    if (result) {
        if (result.hasSensitiveWord) {
            alert(`检测到敏感词：${result.sensitiveWordsFound}\n已自动推送预警！`);
        } else {
            alert('通话结束！');
        }
        
        currentCallId = null;
        document.getElementById('call-panel').classList.add('hidden');
        document.getElementById('btn-start-call').disabled = false;
        document.getElementById('call-inmate-select').disabled = false;
        document.getElementById('transcription').value = '';
        document.getElementById('call-number').value = '';
        document.getElementById('call-person').value = '';
        
        if (currentInmateId) {
            checkQuota(currentInmateId);
        }
    }
}

async function loadCallRecords() {
    const records = await apiRequest('/calls');
    const tbody = document.getElementById('call-records-table');
    tbody.innerHTML = '';
    
    if (records && records.length > 0) {
        records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.inmateName || '-'}</td>
                <td>${record.inmateNo || '-'}</td>
                <td>${record.prisonArea || '-'}</td>
                <td>${record.calledPerson || record.calledNumber || '-'}</td>
                <td>${formatDateTime(record.startTime)}</td>
                <td>${record.durationSeconds || 0}</td>
                <td>${record.hasSensitiveWord ? `<span class="badge badge-danger">${record.sensitiveWordsFound}</span>` : '<span class="badge badge-success">无</span>'}</td>
                <td>
                    <button class="btn btn-sm btn-primary view-transcription-btn" data-transcription="${encodeURIComponent(record.transcription || '')}">查看内容</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        document.querySelectorAll('.view-transcription-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const content = decodeURIComponent(this.getAttribute('data-transcription'));
                showTranscription(content);
            });
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">暂无数据</td></tr>';
    }
}

async function loadAlerts() {
    const alerts = await apiRequest('/alerts');
    const tbody = document.getElementById('alerts-table');
    tbody.innerHTML = '';
    
    if (alerts && alerts.length > 0) {
        alerts.forEach(alert => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${alert.inmateName || '-'}</td>
                <td>${alert.prisonArea || '-'}</td>
                <td><span class="badge badge-danger">${alert.sensitiveWords || '-'}</span></td>
                <td><button class="btn btn-sm btn-primary alert-view-transcription-btn" data-transcription="${encodeURIComponent(alert.transcription || '')}">查看</button></td>
                <td>${alert.status === 'PENDING' ? '<span class="badge badge-warning">待处理</span>' : '<span class="badge badge-success">已处理</span>'}</td>
                <td>${alert.handler || '-'}</td>
                <td>${formatDateTime(alert.createdAt)}</td>
                <td>
                    ${alert.status === 'PENDING' ? 
                        `<button class="btn btn-sm btn-success handle-alert-btn" data-id="${alert.id}" data-inmate-name="${encodeURIComponent(alert.inmateName || '')}" data-sensitive-words="${encodeURIComponent(alert.sensitiveWords || '')}">处理</button>` : 
                        '<span class="badge badge-info">已完成</span>'}
                </td>
            `;
            tbody.appendChild(row);
        });
        
        document.querySelectorAll('.alert-view-transcription-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const content = decodeURIComponent(this.getAttribute('data-transcription'));
                showTranscription(content);
            });
        });
        
        document.querySelectorAll('.handle-alert-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const inmateName = decodeURIComponent(this.getAttribute('data-inmate-name'));
                const sensitiveWords = decodeURIComponent(this.getAttribute('data-sensitive-words'));
                showHandleAlert(id, inmateName, sensitiveWords);
            });
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">暂无数据</td></tr>';
    }
}

async function loadInmates() {
    const inmates = await apiRequest('/inmates');
    const tbody = document.getElementById('inmates-table');
    tbody.innerHTML = '';
    
    if (inmates && inmates.length > 0) {
        inmates.forEach(inmate => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${inmate.inmateNo}</td>
                <td>${inmate.name}</td>
                <td>${inmate.gender}</td>
                <td>${inmate.prisonArea}</td>
                <td>${inmate.monthlyQuota}</td>
                <td>${inmate.maxDurationMinutes}分钟</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editInmate(${inmate.id})">编辑</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteInmate(${inmate.id})">删除</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">暂无数据</td></tr>';
    }
}

async function loadSensitiveWords() {
    const words = await apiRequest('/sensitive-words');
    const tbody = document.getElementById('sensitive-table');
    tbody.innerHTML = '';
    
    if (words && words.length > 0) {
        words.forEach(word => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="badge badge-danger">${word.word}</span></td>
                <td>${word.category || '-'}</td>
                <td>${word.severityLevel}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteSensitiveWord(${word.id})">删除</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">暂无数据</td></tr>';
    }
}

async function loadReports() {
    const areaStats = await apiRequest('/reports/prison-area-calls');
    if (areaStats && areaStats.data) {
        renderBarChart('prison-area-chart', areaStats.data, 'callCount', '#667eea', 'prisonArea');
    }
    
    const callTrend = await apiRequest('/reports/call-trend?days=30');
    if (callTrend && callTrend.data) {
        renderBarChart('report-call-trend-chart', callTrend.data, 'callCount');
    }
    
    const alertTrend = await apiRequest('/reports/alert-trend?days=30');
    if (alertTrend && alertTrend.data) {
        renderBarChart('report-alert-trend-chart', alertTrend.data, 'alertCount', '#f56c6c');
    }
}

function renderBarChart(containerId, data, valueKey, color = '#4facfe', labelKey = 'date') {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (data.length === 0) {
        container.innerHTML = '<div class="loading">暂无数据</div>';
        return;
    }
    
    const maxValue = Math.max(...data.map(d => d[valueKey])) || 1;
    
    data.forEach(item => {
        const barItem = document.createElement('div');
        barItem.className = 'bar-item';
        
        const heightPercent = (item[valueKey] / maxValue) * 100;
        
        barItem.innerHTML = `
            <span class="bar-value">${item[valueKey]}</span>
            <div class="bar" style="height: ${Math.max(heightPercent, 5)}%; background: ${color}"></div>
            <span class="bar-label">${item[labelKey]}</span>
        `;
        
        container.appendChild(barItem);
    });
}

function showInmateModal() {
    editingInmateId = null;
    document.getElementById('modal-inmate-no').value = '';
    document.getElementById('modal-inmate-name').value = '';
    document.getElementById('modal-inmate-gender').value = '男';
    document.getElementById('modal-inmate-area').value = '';
    document.getElementById('modal-inmate-quota').value = '3';
    document.getElementById('modal-inmate-duration').value = '15';
    document.getElementById('inmate-modal').classList.add('show');
}

async function editInmate(id) {
    const inmate = await apiRequest(`/inmates/${id}`);
    if (inmate) {
        editingInmateId = id;
        document.getElementById('modal-inmate-no').value = inmate.inmateNo;
        document.getElementById('modal-inmate-name').value = inmate.name;
        document.getElementById('modal-inmate-gender').value = inmate.gender;
        document.getElementById('modal-inmate-area').value = inmate.prisonArea;
        document.getElementById('modal-inmate-quota').value = inmate.monthlyQuota;
        document.getElementById('modal-inmate-duration').value = inmate.maxDurationMinutes;
        document.getElementById('inmate-modal').classList.add('show');
    }
}

async function saveInmate() {
    const data = {
        inmateNo: document.getElementById('modal-inmate-no').value,
        name: document.getElementById('modal-inmate-name').value,
        gender: document.getElementById('modal-inmate-gender').value,
        prisonArea: document.getElementById('modal-inmate-area').value,
        monthlyQuota: parseInt(document.getElementById('modal-inmate-quota').value),
        maxDurationMinutes: parseInt(document.getElementById('modal-inmate-duration').value)
    };
    
    if (editingInmateId) {
        await apiRequest(`/inmates/${editingInmateId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    } else {
        await apiRequest('/inmates', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    closeModal('inmate-modal');
    loadInmates();
    loadInmateSelect();
}

async function deleteInmate(id) {
    if (confirm('确定要删除该服刑人员吗？')) {
        await apiRequest(`/inmates/${id}`, { method: 'DELETE' });
        loadInmates();
        loadInmateSelect();
    }
}

function showSensitiveModal() {
    document.getElementById('modal-sensitive-word').value = '';
    document.getElementById('modal-sensitive-category').value = '其他';
    document.getElementById('modal-sensitive-severity').value = '1';
    document.getElementById('sensitive-modal').classList.add('show');
}

async function saveSensitiveWord() {
    const data = {
        word: document.getElementById('modal-sensitive-word').value,
        category: document.getElementById('modal-sensitive-category').value,
        severityLevel: parseInt(document.getElementById('modal-sensitive-severity').value),
        enabled: true
    };
    
    await apiRequest('/sensitive-words', {
        method: 'POST',
        body: JSON.stringify(data)
    });
    
    closeModal('sensitive-modal');
    loadSensitiveWords();
}

async function deleteSensitiveWord(id) {
    if (confirm('确定要删除该敏感词吗？')) {
        await apiRequest(`/sensitive-words/${id}`, { method: 'DELETE' });
        loadSensitiveWords();
    }
}

function showTranscription(content) {
    document.getElementById('modal-transcription-content').textContent = content || '无';
    document.getElementById('transcription-modal').classList.add('show');
}

function showHandleAlert(id, inmateName, sensitiveWords) {
    currentAlertId = id;
    document.getElementById('modal-alert-content').innerHTML = 
        `<strong>服刑人员：</strong>${inmateName}<br><strong>敏感词：</strong>${sensitiveWords}`;
    document.getElementById('modal-alert-handler').value = '';
    document.getElementById('alert-modal').classList.add('show');
}

async function handleAlert() {
    const handler = document.getElementById('modal-alert-handler').value;
    if (!handler) {
        alert('请输入处理人');
        return;
    }
    
    await apiRequest(`/alerts/${currentAlertId}/handle`, {
        method: 'PUT',
        body: JSON.stringify({ handler: handler })
    });
    
    closeModal('alert-modal');
    loadAlerts();
    loadDashboard();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
