const API_BASE_URL = 'http://localhost:8080/api/cases';
const NOTIFICATION_API_URL = 'http://localhost:8080/api/notifications';

let currentCaseId = null;

const fieldLabels = {
    caseNumber: '案号',
    party: '当事人',
    filingDate: '立案日期',
    statuteOfLimitationsDeadline: '诉讼时效截止日',
    lawyer: '承办律师',
    hearingDate: '开庭日期',
    judgmentDate: '判决日期'
};

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadCases();
    loadAlerts();
    loadReports();
    initModals();
    initEventListeners();
});

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            if (tabId === 'alerts') {
                loadAlerts();
            } else if (tabId === 'reports') {
                loadReports();
            } else if (tabId === 'notifications') {
                loadNotifications();
                loadNotificationStats();
            }
        });
    });
}

function initEventListeners() {
    document.getElementById('addCaseBtn').addEventListener('click', () => openCaseModal());
    document.getElementById('saveCaseBtn').addEventListener('click', saveCase);
    document.getElementById('cancelBtn').addEventListener('click', () => closeModal('caseModal'));
    document.getElementById('saveHearingBtn').addEventListener('click', saveHearing);
    document.getElementById('saveJudgmentBtn').addEventListener('click', saveJudgment);
    document.getElementById('addHearingBtn').addEventListener('click', () => openHearingModal());
    document.getElementById('addJudgmentBtn').addEventListener('click', () => openJudgmentModal());
    document.getElementById('generateNotificationsBtn').addEventListener('click', generateNotifications);
    document.getElementById('sendAllBtn').addEventListener('click', sendAllNotifications);

    document.getElementById('searchInput').addEventListener('input', filterCases);

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(input => {
        input.addEventListener('input', () => clearFieldError(input));
    });
}

function initModals() {
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('input-error');
        let errorDiv = field.parentNode.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            field.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    }
}

function clearFieldError(input) {
    input.classList.remove('input-error');
    const errorDiv = input.parentNode.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.textContent = '';
    }
}

function clearAllErrors(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.querySelectorAll('.input-error').forEach(input => {
            input.classList.remove('input-error');
        });
        form.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
        });
    }
}

function validateCaseForm() {
    clearAllErrors('caseForm');
    let isValid = true;

    const caseNumber = document.getElementById('caseNumber').value.trim();
    const party = document.getElementById('party').value.trim();
    const filingDate = document.getElementById('filingDate').value;
    const statuteDeadline = document.getElementById('statuteOfLimitationsDeadline').value;
    const lawyer = document.getElementById('lawyer').value.trim();

    if (!caseNumber) {
        showFieldError('caseNumber', '案号不能为空');
        isValid = false;
    }

    if (!party) {
        showFieldError('party', '当事人不能为空');
        isValid = false;
    }

    if (!filingDate) {
        showFieldError('filingDate', '立案日期不能为空');
        isValid = false;
    }

    if (!statuteDeadline) {
        showFieldError('statuteOfLimitationsDeadline', '诉讼时效截止日不能为空');
        isValid = false;
    }

    if (!lawyer) {
        showFieldError('lawyer', '承办律师不能为空');
        isValid = false;
    }

    return isValid;
}

function validateHearingForm() {
    clearAllErrors('hearingForm');
    let isValid = true;

    const hearingDate = document.getElementById('hearingDate').value;

    if (!hearingDate) {
        showFieldError('hearingDate', '开庭日期不能为空');
        isValid = false;
    }

    return isValid;
}

function validateJudgmentForm() {
    clearAllErrors('judgmentForm');
    let isValid = true;

    const judgmentDate = document.getElementById('judgmentDate').value;

    if (!judgmentDate) {
        showFieldError('judgmentDate', '判决日期不能为空');
        isValid = false;
    }

    return isValid;
}

function handleValidationErrors(errors, formId) {
    clearAllErrors(formId);
    let errorMessages = [];

    for (const [field, message] of Object.entries(errors)) {
        const fieldLabel = fieldLabels[field] || field;
        showFieldError(field, message);
        errorMessages.push(`${fieldLabel}: ${message}`);
    }

    if (errorMessages.length > 0) {
        alert('请修正以下错误：\n' + errorMessages.join('\n'));
    }
}

function openCaseModal(caseData = null) {
    const modal = document.getElementById('caseModal');
    const title = document.getElementById('modalTitle');

    clearAllErrors('caseForm');

    if (caseData) {
        title.textContent = '编辑案件';
        document.getElementById('caseId').value = caseData.id;
        document.getElementById('caseNumber').value = caseData.caseNumber;
        document.getElementById('party').value = caseData.party;
        document.getElementById('opposingParty').value = caseData.opposingParty || '';
        document.getElementById('caseReason').value = caseData.caseReason || '';
        document.getElementById('filingDate').value = caseData.filingDate;
        document.getElementById('statuteOfLimitationsDeadline').value = caseData.statuteOfLimitationsDeadline;
        document.getElementById('lawyer').value = caseData.lawyer;
        document.getElementById('status').value = caseData.status || '办理中';
    } else {
        title.textContent = '新增案件';
        document.getElementById('caseForm').reset();
        document.getElementById('caseId').value = '';
    }

    modal.style.display = 'block';
}

function openHearingModal() {
    document.getElementById('hearingCaseId').value = currentCaseId;
    document.getElementById('hearingForm').reset();
    clearAllErrors('hearingForm');
    document.getElementById('hearingModal').style.display = 'block';
}

function openJudgmentModal() {
    document.getElementById('judgmentCaseId').value = currentCaseId;
    document.getElementById('judgmentForm').reset();
    clearAllErrors('judgmentForm');
    document.getElementById('judgmentModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

async function loadCases() {
    try {
        const response = await fetch(API_BASE_URL);
        const cases = await response.json();
        renderCasesTable(cases);
    } catch (error) {
        console.error('加载案件失败:', error);
    }
}

function renderCasesTable(cases) {
    const tbody = document.getElementById('casesTableBody');
    tbody.innerHTML = '';

    cases.forEach(caseItem => {
        const row = document.createElement('tr');
        const alertClass = getAlertClass(caseItem.alertLevel);

        row.innerHTML = `
            <td>${caseItem.caseNumber}</td>
            <td>${caseItem.party}</td>
            <td>${caseItem.opposingParty || '-'}</td>
            <td>${caseItem.caseReason || '-'}</td>
            <td>${caseItem.filingDate}</td>
            <td>${caseItem.statuteOfLimitationsDeadline}</td>
            <td class="${alertClass}">${caseItem.remainingDays} 天</td>
            <td>${caseItem.lawyer}</td>
            <td><span class="status-badge">${caseItem.status || '办理中'}</span></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewCaseDetail(${caseItem.id})">详情</button>
                <button class="btn btn-sm btn-warning" onclick="editCase(${caseItem.id})">编辑</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCase(${caseItem.id})">删除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getAlertClass(alertLevel) {
    switch (alertLevel) {
        case '紧急': return 'text-danger';
        case '重要': return 'text-warning';
        case '提醒': return 'text-info';
        case '已过期': return 'text-expired';
        default: return 'text-normal';
    }
}

function filterCases() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#casesTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

async function saveCase() {
    if (!validateCaseForm()) {
        return;
    }

    const caseId = document.getElementById('caseId').value;
    const caseData = {
        caseNumber: document.getElementById('caseNumber').value.trim(),
        party: document.getElementById('party').value.trim(),
        opposingParty: document.getElementById('opposingParty').value.trim(),
        caseReason: document.getElementById('caseReason').value.trim(),
        filingDate: document.getElementById('filingDate').value,
        statuteOfLimitationsDeadline: document.getElementById('statuteOfLimitationsDeadline').value,
        lawyer: document.getElementById('lawyer').value.trim(),
        status: document.getElementById('status').value
    };

    try {
        let response;
        if (caseId) {
            response = await fetch(`${API_BASE_URL}/${caseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(caseData)
            });
        } else {
            response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(caseData)
            });
        }

        const result = await response.json();

        if (response.ok) {
            closeModal('caseModal');
            loadCases();
            loadAlerts();
            alert('保存成功！');
        } else {
            if (result.error) {
                alert(result.error);
            } else {
                handleValidationErrors(result, 'caseForm');
            }
        }
    } catch (error) {
        console.error('保存案件失败:', error);
        alert('保存失败，请重试');
    }
}

async function editCase(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        const caseData = await response.json();
        openCaseModal(caseData);
    } catch (error) {
        console.error('加载案件详情失败:', error);
    }
}

async function deleteCase(id) {
    if (confirm('确定要删除该案件吗？')) {
        try {
            await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
            loadCases();
            loadAlerts();
            alert('删除成功！');
        } catch (error) {
            console.error('删除案件失败:', error);
            alert('删除失败，请重试');
        }
    }
}

async function viewCaseDetail(id) {
    currentCaseId = id;
    try {
        const [caseResponse, hearingsResponse, judgmentsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/${id}`),
            fetch(`${API_BASE_URL}/${id}/hearings`),
            fetch(`${API_BASE_URL}/${id}/judgments`)
        ]);

        const caseData = await caseResponse.json();
        const hearings = await hearingsResponse.json();
        const judgments = await judgmentsResponse.json();

        renderCaseDetail(caseData);
        renderHearings(hearings);
        renderJudgments(judgments);

        document.getElementById('detailModal').style.display = 'block';
    } catch (error) {
        console.error('加载案件详情失败:', error);
    }
}

function renderCaseDetail(caseData) {
    document.getElementById('detailModalTitle').textContent = `案件详情 - ${caseData.caseNumber}`;
    const alertClass = getAlertClass(caseData.alertLevel);

    document.getElementById('caseDetail').innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <label>案号:</label>
                <span>${caseData.caseNumber}</span>
            </div>
            <div class="detail-item">
                <label>当事人:</label>
                <span>${caseData.party}</span>
            </div>
            <div class="detail-item">
                <label>对方当事人:</label>
                <span>${caseData.opposingParty || '-'}</span>
            </div>
            <div class="detail-item">
                <label>案由:</label>
                <span>${caseData.caseReason || '-'}</span>
            </div>
            <div class="detail-item">
                <label>立案日期:</label>
                <span>${caseData.filingDate}</span>
            </div>
            <div class="detail-item">
                <label>诉讼时效截止日:</label>
                <span>${caseData.statuteOfLimitationsDeadline}</span>
            </div>
            <div class="detail-item">
                <label>剩余天数:</label>
                <span class="${alertClass}">${caseData.remainingDays} 天 (${caseData.alertLevel})</span>
            </div>
            <div class="detail-item">
                <label>承办律师:</label>
                <span>${caseData.lawyer}</span>
            </div>
            <div class="detail-item">
                <label>状态:</label>
                <span><span class="status-badge">${caseData.status || '办理中'}</span></span>
            </div>
        </div>
    `;
}

function renderHearings(hearings) {
    const container = document.getElementById('hearingsList');
    if (hearings.length === 0) {
        container.innerHTML = '<p class="no-data">暂无开庭记录</p>';
        return;
    }

    container.innerHTML = hearings.map(h => `
        <div class="record-card">
            <div class="record-date">${h.hearingDate}</div>
            <div class="record-details">
                <p><strong>法院:</strong> ${h.court || '-'}</p>
                <p><strong>法官:</strong> ${h.judge || '-'}</p>
                <p><strong>备注:</strong> ${h.notes || '-'}</p>
            </div>
        </div>
    `).join('');
}

function renderJudgments(judgments) {
    const container = document.getElementById('judgmentsList');
    if (judgments.length === 0) {
        container.innerHTML = '<p class="no-data">暂无判决记录</p>';
        return;
    }

    container.innerHTML = judgments.map(j => `
        <div class="record-card">
            <div class="record-date">${j.judgmentDate}</div>
            <div class="record-details">
                <p><strong>判决结果:</strong> <span class="result-badge result-${j.result || '其他'}">${j.result || '其他'}</span></p>
                <p><strong>判决详情:</strong> ${j.judgmentDetails || '-'}</p>
                <p><strong>上诉期限:</strong> ${j.appealDeadline || '-'}</p>
                <p><strong>已上诉:</strong> ${j.appealed ? '是' : '否'}</p>
            </div>
        </div>
    `).join('');
}

async function saveHearing() {
    if (!validateHearingForm()) {
        return;
    }

    const hearingData = {
        hearingDate: document.getElementById('hearingDate').value,
        court: document.getElementById('court').value.trim(),
        judge: document.getElementById('judge').value.trim(),
        notes: document.getElementById('hearingNotes').value.trim()
    };

    const caseId = document.getElementById('hearingCaseId').value;

    try {
        const response = await fetch(`${API_BASE_URL}/${caseId}/hearings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hearingData)
        });

        const result = await response.json();

        if (response.ok) {
            closeModal('hearingModal');
            viewCaseDetail(caseId);
            alert('开庭记录保存成功！');
        } else {
            if (result.error) {
                alert(result.error);
            } else {
                handleValidationErrors(result, 'hearingForm');
            }
        }
    } catch (error) {
        console.error('保存开庭记录失败:', error);
        alert('保存失败，请重试');
    }
}

async function saveJudgment() {
    if (!validateJudgmentForm()) {
        return;
    }

    const judgmentData = {
        judgmentDate: document.getElementById('judgmentDate').value,
        result: document.getElementById('result').value,
        judgmentDetails: document.getElementById('judgmentDetails').value.trim(),
        appealDeadline: document.getElementById('appealDeadline').value || null,
        appealed: document.getElementById('appealed').checked
    };

    const caseId = document.getElementById('judgmentCaseId').value;

    try {
        const response = await fetch(`${API_BASE_URL}/${caseId}/judgments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(judgmentData)
        });

        const result = await response.json();

        if (response.ok) {
            closeModal('judgmentModal');
            viewCaseDetail(caseId);
            alert('判决结果保存成功！');
        } else {
            if (result.error) {
                alert(result.error);
            } else {
                handleValidationErrors(result, 'judgmentForm');
            }
        }
    } catch (error) {
        console.error('保存判决结果失败:', error);
        alert('保存失败，请重试');
    }
}

async function loadAlerts() {
    try {
        const [alerts1Day, alerts7Days, alerts30Days] = await Promise.all([
            fetch(`${API_BASE_URL}/alerts/1day`).then(r => r.json()),
            fetch(`${API_BASE_URL}/alerts/7days`).then(r => r.json()),
            fetch(`${API_BASE_URL}/alerts/30days`).then(r => r.json())
        ]);

        document.getElementById('alert1Day').textContent = alerts1Day.length;
        document.getElementById('alert7Days').textContent = alerts7Days.length;
        document.getElementById('alert30Days').textContent = alerts30Days.length;

        renderAlertsTable(alerts30Days);
    } catch (error) {
        console.error('加载提醒失败:', error);
    }
}

function renderAlertsTable(cases) {
    const tbody = document.getElementById('alertsTableBody');
    tbody.innerHTML = '';

    cases.forEach(caseItem => {
        const row = document.createElement('tr');
        const alertClass = getAlertClass(caseItem.alertLevel);
        const badgeClass = caseItem.alertLevel === '紧急' ? 'badge-danger' :
                          caseItem.alertLevel === '重要' ? 'badge-warning' : 'badge-info';

        row.innerHTML = `
            <td>${caseItem.caseNumber}</td>
            <td>${caseItem.party}</td>
            <td>${caseItem.statuteOfLimitationsDeadline}</td>
            <td class="${alertClass}">${caseItem.remainingDays} 天</td>
            <td><span class="alert-badge ${badgeClass}">${caseItem.alertLevel}</span></td>
            <td>${caseItem.lawyer}</td>
        `;
        tbody.appendChild(row);
    });
}

async function loadReports() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics`);
        const stats = await response.json();
        renderLawyerStats(stats.casesByLawyer);
        renderCaseOverview(stats);
    } catch (error) {
        console.error('加载报表失败:', error);
    }
}

function renderLawyerStats(casesByLawyer) {
    const container = document.getElementById('lawyerStats');
    if (!casesByLawyer || casesByLawyer.length === 0) {
        container.innerHTML = '<p class="no-data">暂无数据</p>';
        return;
    }

    container.innerHTML = `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>律师姓名</th>
                    <th>案件数量</th>
                </tr>
            </thead>
            <tbody>
                ${casesByLawyer.map(item => `
                    <tr>
                        <td>${item.lawyer}</td>
                        <td><span class="count-badge">${item.caseCount}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderCaseOverview(stats) {
    const container = document.getElementById('caseOverview');
    container.innerHTML = `
        <div class="overview-grid">
            <div class="overview-item">
                <div class="overview-label">案件总数</div>
                <div class="overview-value">${stats.totalCases}</div>
            </div>
            <div class="overview-item">
                <div class="overview-label">即将到期</div>
                <div class="overview-value text-warning">${stats.alertCases}</div>
            </div>
        </div>
    `;
}

async function loadNotifications() {
    try {
        const response = await fetch(NOTIFICATION_API_URL);
        const notifications = await response.json();
        renderNotificationsTable(notifications);
    } catch (error) {
        console.error('加载通知失败:', error);
    }
}

function renderNotificationsTable(notifications) {
    const tbody = document.getElementById('notificationsTableBody');
    tbody.innerHTML = '';

    if (notifications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center no-data">暂无通知记录</td>
            </tr>
        `;
        return;
    }

    notifications.forEach(notification => {
        const row = document.createElement('tr');
        const alertClass = getAlertClass(notification.alertLevel);
        const statusBadge = notification.status === 'SENT' ? 'badge-success' : 'badge-warning';
        const statusText = notification.status === 'SENT' ? '已发送' : '待发送';

        row.innerHTML = `
            <td>${notification.caseNumber}</td>
            <td>${notification.party}</td>
            <td>${notification.lawyer}</td>
            <td><span class="${alertClass}">${notification.alertLevel}</span></td>
            <td class="${alertClass}">${notification.remainingDays} 天</td>
            <td style="max-width: 300px; font-size: 12px;">${notification.message}</td>
            <td><span class="alert-badge ${statusBadge}">${statusText}</span></td>
            <td>${formatDateTime(notification.createdAt)}</td>
            <td>${notification.sentAt ? formatDateTime(notification.sentAt) : '-'}</td>
            <td>
                ${notification.status === 'PENDING' ? 
                    `<button class="btn btn-sm btn-primary" onclick="sendNotification(${notification.id})">发送</button>` :
                    '<span style="color: #6c757d;">已发送</span>'
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadNotificationStats() {
    try {
        const response = await fetch(`${NOTIFICATION_API_URL}/stats`);
        const stats = await response.json();

        document.getElementById('pendingCount').textContent = stats.pending || 0;
        document.getElementById('sentCount').textContent = stats.sent || 0;
        document.getElementById('urgentCount').textContent = stats.urgent || 0;
        document.getElementById('importantCount').textContent = stats.important || 0;

        const badge = document.getElementById('notificationBadge');
        if (stats.pending > 0) {
            badge.textContent = `${stats.pending} 条待发送`;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('加载通知统计失败:', error);
    }
}

async function sendNotification(id) {
    if (!confirm('确定要发送这条通知吗？')) {
        return;
    }

    try {
        const response = await fetch(`${NOTIFICATION_API_URL}/${id}/send`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('通知发送成功！');
            loadNotifications();
            loadNotificationStats();
        } else {
            alert('通知发送失败');
        }
    } catch (error) {
        console.error('发送通知失败:', error);
        alert('发送失败，请重试');
    }
}

async function sendAllNotifications() {
    if (!confirm('确定要批量发送所有待发送的通知吗？')) {
        return;
    }

    try {
        const response = await fetch(`${NOTIFICATION_API_URL}/send-all`, {
            method: 'POST'
        });

        if (response.ok) {
            const result = await response.json();
            alert(`批量发送完成！共发送 ${result.length} 条通知`);
            loadNotifications();
            loadNotificationStats();
        } else {
            alert('批量发送失败');
        }
    } catch (error) {
        console.error('批量发送通知失败:', error);
        alert('发送失败，请重试');
    }
}

async function generateNotifications() {
    try {
        const response = await fetch(`${NOTIFICATION_API_URL}/generate`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('通知生成完成！');
            loadNotifications();
            loadNotificationStats();
        } else {
            alert('通知生成失败');
        }
    } catch (error) {
        console.error('生成通知失败:', error);
        alert('生成失败，请重试');
    }
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '-';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
