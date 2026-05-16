const API_BASE = 'http://localhost:8080/api';
const PAGE_SIZE = 10;
let currentUser = null;
let currentImageBase64 = null;
let paginationState = {
    tasks: { page: 0, totalPages: 0, totalElements: 0 },
    published: { page: 0, totalPages: 0, totalElements: 0 },
    accepted: { page: 0, totalPages: 0, totalElements: 0 },
    transactions: { page: 0, totalPages: 0, totalElements: 0 }
};

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    loadTasks();
});

function checkLoginStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserUI();
        refreshUserBalance();
    }
}

function updateUserUI() {
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    const publishBtn = document.getElementById('publishBtn');

    if (currentUser) {
        userInfo.style.display = 'flex';
        authButtons.style.display = 'none';
        publishBtn.style.display = 'inline-block';
        document.getElementById('userNickname').textContent = currentUser.nickname || currentUser.username;
        document.getElementById('userBalance').textContent = parseFloat(currentUser.balance).toFixed(2);
    } else {
        userInfo.style.display = 'none';
        authButtons.style.display = 'flex';
        publishBtn.style.display = 'none';
    }
}

async function refreshUserBalance() {
    if (!currentUser) return;
    try {
        const response = await fetch(`${API_BASE}/users/${currentUser.id}`);
        const result = await response.json();
        if (result.code === 200) {
            currentUser = result.data;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            document.getElementById('userBalance').textContent = parseFloat(currentUser.balance).toFixed(2);
        }
    } catch (error) {
        console.error('刷新余额失败:', error);
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

function showPublishModal() {
    if (!currentUser) {
        showToast('请先登录', 'error');
        return;
    }
    document.getElementById('publishModal').style.display = 'block';
}

function showRechargeModal() {
    document.getElementById('rechargeModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (result.code === 200) {
            currentUser = result.data;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserUI();
            closeModal('loginModal');
            showToast('登录成功');
            loadTasks();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('登录失败: ' + error.message, 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const nickname = document.getElementById('regNickname').value;
    const skills = document.getElementById('regSkills').value;

    try {
        const response = await fetch(`${API_BASE}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, nickname, skills })
        });
        const result = await response.json();
        if (result.code === 200) {
            closeModal('registerModal');
            showToast('注册成功，请登录');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('注册失败: ' + error.message, 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserUI();
    showToast('已退出登录');
    loadTasks();
}

async function handleRecharge(event) {
    event.preventDefault();
    const amount = parseFloat(document.getElementById('rechargeAmount').value);
    if (amount <= 0) {
        showToast('请输入有效金额', 'error');
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/users/${currentUser.id}/recharge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        const result = await response.json();
        if (result.code === 200) {
            currentUser = result.data;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            document.getElementById('userBalance').textContent = parseFloat(currentUser.balance).toFixed(2);
            closeModal('rechargeModal');
            showToast(`充值成功: ¥${amount.toFixed(2)}`);
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('充值失败: ' + error.message, 'error');
    }
}

async function handlePublish(event) {
    event.preventDefault();
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDesc').value;
    const reward = parseFloat(document.getElementById('taskReward').value);
    const deadline = document.getElementById('taskDeadline').value;
    const requiredSkills = document.getElementById('taskSkills').value;

    try {
        const response = await fetch(`${API_BASE}/tasks/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                description,
                reward,
                deadline: deadline ? new Date(deadline).toISOString() : null,
                requiredSkills,
                publisherId: currentUser.id
            })
        });
        const result = await response.json();
        if (result.code === 200) {
            closeModal('publishModal');
            showToast('任务发布成功');
            await refreshUserBalance();
            loadTasks();
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDesc').value = '';
            document.getElementById('taskReward').value = '';
            document.getElementById('taskDeadline').value = '';
            document.getElementById('taskSkills').value = '';
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('发布失败: ' + error.message, 'error');
    }
}

async function loadTasks(page = 0) {
    try {
        paginationState.tasks.page = page;
        const response = await fetch(`${API_BASE}/tasks/published/page?page=${page}&size=${PAGE_SIZE}`);
        const result = await response.json();
        if (result.code === 200) {
            const pageData = result.data;
            paginationState.tasks.totalPages = pageData.totalPages;
            paginationState.tasks.totalElements = pageData.totalElements;
            renderTaskList(pageData.content || [], 'taskList');
            renderPagination('tasksPagination', 'tasks', paginationState.tasks);
        }
    } catch (error) {
        console.error('加载任务失败:', error);
    }

    if (currentUser) {
        loadMyPublishedTasks();
        loadMyAcceptedTasks();
        loadTransactions();
    }
}

async function loadMyPublishedTasks(page = 0) {
    try {
        paginationState.published.page = page;
        const response = await fetch(`${API_BASE}/tasks/publisher/${currentUser.id}/page?page=${page}&size=${PAGE_SIZE}`);
        const result = await response.json();
        if (result.code === 200) {
            const pageData = result.data;
            paginationState.published.totalPages = pageData.totalPages;
            paginationState.published.totalElements = pageData.totalElements;
            renderTaskList(pageData.content || [], 'publishedTaskList', true);
            renderPagination('publishedPagination', 'published', paginationState.published);
        }
    } catch (error) {
        console.error('加载我的任务失败:', error);
    }
}

async function loadMyAcceptedTasks(page = 0) {
    try {
        paginationState.accepted.page = page;
        const response = await fetch(`${API_BASE}/tasks/accepter/${currentUser.id}/page?page=${page}&size=${PAGE_SIZE}`);
        const result = await response.json();
        if (result.code === 200) {
            const pageData = result.data;
            paginationState.accepted.totalPages = pageData.totalPages;
            paginationState.accepted.totalElements = pageData.totalElements;
            renderTaskList(pageData.content || [], 'acceptedTaskList', false, true);
            renderPagination('acceptedPagination', 'accepted', paginationState.accepted);
        }
    } catch (error) {
        console.error('加载承接任务失败:', error);
    }
}

async function loadTransactions(page = 0) {
    try {
        paginationState.transactions.page = page;
        const response = await fetch(`${API_BASE}/tasks/transactions/${currentUser.id}/page?page=${page}&size=${PAGE_SIZE}`);
        const result = await response.json();
        if (result.code === 200) {
            const pageData = result.data;
            paginationState.transactions.totalPages = pageData.totalPages;
            paginationState.transactions.totalElements = pageData.totalElements;
            renderTransactionList(pageData.content || []);
            renderPagination('transactionsPagination', 'transactions', paginationState.transactions);
        }
    } catch (error) {
        console.error('加载交易记录失败:', error);
    }
}

function renderPagination(containerId, type, state) {
    const container = document.getElementById(containerId);
    if (state.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    
    html += `<button onclick="changePage('${type}', ${state.page - 1})" ${state.page === 0 ? 'disabled' : ''}>上一页</button>`;
    
    const maxVisiblePages = 5;
    let startPage = Math.max(0, state.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(state.totalPages - 1, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === state.page ? 'active' : ''}" onclick="changePage('${type}', ${i})">${i + 1}</button>`;
    }
    
    html += `<button onclick="changePage('${type}', ${state.page + 1})" ${state.page >= state.totalPages - 1 ? 'disabled' : ''}>下一页</button>`;
    html += `<span class="pagination-info">共 ${state.totalElements} 条，第 ${state.page + 1}/${state.totalPages} 页</span>`;
    
    container.innerHTML = html;
}

function changePage(type, page) {
    if (page < 0) return;
    
    switch (type) {
        case 'tasks':
            loadTasks(page);
            break;
        case 'published':
            loadMyPublishedTasks(page);
            break;
        case 'accepted':
            loadMyAcceptedTasks(page);
            break;
        case 'transactions':
            loadTransactions(page);
            break;
    }
}

function renderTaskList(tasks, containerId, isPublisher = false, isAccepter = false) {
    const container = document.getElementById(containerId);
    if (!tasks || tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>暂无任务</p>
            </div>
        `;
        return;
    }

    container.innerHTML = tasks.map(task => {
        const skills = task.requiredSkills ? task.requiredSkills.split(',').filter(s => s.trim()).map(s => `<span class="skill-tag">${s.trim()}</span>`).join('') : '';
        const deadline = task.deadline ? new Date(task.deadline).toLocaleString('zh-CN') : '无截止时间';
        const statusText = getStatusText(task.status);
        
        let actions = '';
        
        if (isPublisher && task.status === 'PUBLISHED') {
            actions = `<button class="btn-secondary" onclick="loadApplications(${task.id}, this)">查看申请</button>`;
        } else if (isAccepter && task.status === 'IN_PROGRESS') {
            actions = `<button class="btn-success" onclick="showSubmitModal(${task.id})">提交完成</button>`;
        } else if (isPublisher && task.status === 'IN_PROGRESS') {
            actions = `<button class="btn-secondary" onclick="loadSubmission(${task.id}, this)">查看提交</button>`;
        }

        if (!isPublisher && !isAccepter && task.status === 'PUBLISHED' && currentUser && task.publisher.id !== currentUser.id) {
            actions = `<button class="btn-primary" onclick="showApplyModal(${task.id})">申请任务</button>`;
        }

        return `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-header">
                    <h3 class="task-title">${task.title}</h3>
                    <div class="task-reward">¥${parseFloat(task.reward).toFixed(2)}</div>
                </div>
                <div class="task-meta">
                    <span>发布者: ${task.publisher.nickname || task.publisher.username}</span>
                    <span>截止: ${deadline}</span>
                    <span class="status-badge status-${task.status}">${statusText}</span>
                </div>
                <p class="task-desc">${task.description}</p>
                ${skills ? `<div class="task-skills">${skills}</div>` : ''}
                ${actions ? `<div class="task-actions">${actions}</div>` : ''}
                <div class="application-list" id="applications-${task.id}" style="display: none;"></div>
            </div>
        `;
    }).join('');
}

function getStatusText(status) {
    const statusMap = {
        'PUBLISHED': '已发布',
        'IN_PROGRESS': '进行中',
        'COMPLETED': '已完成'
    };
    return statusMap[status] || status;
}

function showApplyModal(taskId) {
    document.getElementById('applyTaskId').value = taskId;
    document.getElementById('applyMessage').value = '';
    document.getElementById('applyModal').style.display = 'block';
}

async function handleApply(event) {
    event.preventDefault();
    const taskId = parseInt(document.getElementById('applyTaskId').value);
    const message = document.getElementById('applyMessage').value;

    try {
        const response = await fetch(`${API_BASE}/tasks/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, applicantId: currentUser.id, message })
        });
        const result = await response.json();
        if (result.code === 200) {
            closeModal('applyModal');
            showToast('申请已提交');
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('申请失败: ' + error.message, 'error');
    }
}

async function loadApplications(taskId, btn) {
    try {
        const response = await fetch(`${API_BASE}/tasks/${taskId}/applications`);
        const result = await response.json();
        if (result.code === 200) {
            const appsContainer = document.getElementById(`applications-${taskId}`);
            const apps = result.data || [];
            
            if (apps.length === 0) {
                appsContainer.innerHTML = '<p style="color: #999; padding: 10px;">暂无申请</p>';
            } else {
                appsContainer.innerHTML = apps.map(app => `
                    <div class="application-item">
                        <div class="applicant-info">
                            <strong>${app.applicant.nickname || app.applicant.username}</strong>
                            <span class="status-badge status-${app.status === 'PENDING' ? 'PUBLISHED' : app.status === 'ACCEPTED' ? 'IN_PROGRESS' : 'COMPLETED'}">
                                ${app.status === 'PENDING' ? '待处理' : app.status === 'ACCEPTED' ? '已接受' : '已拒绝'}
                            </span>
                        </div>
                        ${app.message ? `<p class="applicant-msg">${app.message}</p>` : ''}
                        ${app.status === 'PENDING' ? `
                            <div class="task-actions" style="border-top: none; padding-top: 10px; margin-top: 0;">
                                <button class="btn-success" onclick="acceptApplication(${app.id}, ${taskId})">接受</button>
                                <button class="btn-secondary" onclick="rejectApplication(${app.id})">拒绝</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            }
            appsContainer.style.display = appsContainer.style.display === 'none' ? 'block' : 'none';
        }
    } catch (error) {
        console.error('加载申请失败:', error);
    }
}

async function acceptApplication(applicationId, taskId) {
    try {
        const response = await fetch(`${API_BASE}/tasks/applications/${applicationId}/accept`, {
            method: 'POST'
        });
        const result = await response.json();
        if (result.code === 200) {
            showToast('已接受申请');
            loadTasks();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('操作失败: ' + error.message, 'error');
    }
}

async function rejectApplication(applicationId) {
    showToast('拒绝功能暂未实现', 'error');
}

function showSubmitModal(taskId) {
    document.getElementById('submitTaskId').value = taskId;
    document.getElementById('submitDesc').value = '';
    document.getElementById('imagePreview').innerHTML = '';
    currentImageBase64 = null;
    document.getElementById('submissionModal').style.display = 'block';
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageBase64 = e.target.result;
            document.getElementById('imagePreview').innerHTML = `<img src="${currentImageBase64}" alt="预览">`;
        };
        reader.readAsDataURL(file);
    }
}

async function handleSubmission(event) {
    event.preventDefault();
    const taskId = parseInt(document.getElementById('submitTaskId').value);
    const description = document.getElementById('submitDesc').value;

    try {
        const response = await fetch(`${API_BASE}/tasks/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                taskId, 
                submitterId: currentUser.id, 
                description,
                imageBase64: currentImageBase64 
            })
        });
        const result = await response.json();
        if (result.code === 200) {
            closeModal('submissionModal');
            showToast('提交成功，等待发布者确认');
            loadTasks();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('提交失败: ' + error.message, 'error');
    }
}

async function loadSubmission(taskId, btn) {
    try {
        const response = await fetch(`${API_BASE}/tasks/${taskId}/submission`);
        const result = await response.json();
        if (result.code === 200) {
            const appsContainer = document.getElementById(`applications-${taskId}`);
            const submission = result.data;
            
            if (!submission) {
                appsContainer.innerHTML = '<p style="color: #999; padding: 10px;">接单人尚未提交</p>';
            } else {
                appsContainer.innerHTML = `
                    <div class="submission-preview">
                        <h4 style="margin-bottom: 10px;">任务提交</h4>
                        <p><strong>完成描述:</strong> ${submission.description}</p>
                        ${submission.imageBase64 ? `<img src="${submission.imageBase64}" alt="完成凭证">` : ''}
                        <div class="task-actions" style="border-top: none; padding-top: 15px; margin-top: 15px;">
                            ${submission.status === 'PENDING' ? `
                                <button class="btn-success" onclick="confirmSubmission(${submission.id})">确认完成并打款</button>
                            ` : `
                                <span class="status-badge status-COMPLETED">已确认完成</span>
                            `}
                        </div>
                    </div>
                `;
            }
            appsContainer.style.display = appsContainer.style.display === 'none' ? 'block' : 'none';
        }
    } catch (error) {
        console.error('加载提交失败:', error);
    }
}

async function confirmSubmission(submissionId) {
    try {
        const response = await fetch(`${API_BASE}/tasks/submissions/${submissionId}/confirm`, {
            method: 'POST'
        });
        const result = await response.json();
        if (result.code === 200) {
            showToast('已确认完成，赏金已发放给接单人');
            refreshUserBalance();
            loadTasks();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('操作失败: ' + error.message, 'error');
    }
}

function renderTransactionList(transactions) {
    const container = document.getElementById('transactionList');
    if (!transactions || transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💳</div>
                <p>暂无交易记录</p>
            </div>
        `;
        return;
    }

    container.innerHTML = transactions.map(t => {
        const isReceiver = t.toUser && t.toUser.id === currentUser.id;
        const amount = isReceiver ? t.amount : -t.amount;
        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <h4>${t.description}</h4>
                    <p>${new Date(t.createTime).toLocaleString('zh-CN')}</p>
                    ${t.platformFee ? `<p style="color: #e74c3c; font-size: 12px;">平台服务费: ¥${parseFloat(t.platformFee).toFixed(2)}</p>` : ''}
                </div>
                <div class="transaction-amount ${amount >= 0 ? 'positive' : 'negative'}">
                    ${amount >= 0 ? '+' : ''}¥${Math.abs(parseFloat(amount)).toFixed(2)}
                </div>
            </div>
        `;
    }).join('');
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').style.display = 'block';
    
    if (tabName === 'myPublished' && currentUser) {
        loadMyPublishedTasks();
    } else if (tabName === 'myAccepted' && currentUser) {
        loadMyAcceptedTasks();
    } else if (tabName === 'transactions' && currentUser) {
        loadTransactions();
    }
}
