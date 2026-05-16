const API_BASE = 'http://localhost:8080/api';

let currentUser = null;
let currentPage = 0;

document.addEventListener('DOMContentLoaded', function() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showUserSection();
    }

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('violationForm').addEventListener('submit', handleCreateViolation);
    
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('violationTime').value = now.toISOString().slice(0, 16);
});

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showUserSection();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('连接服务器失败，请确保后端已启动', 'error');
    }
}

function showUserSection() {
    document.getElementById('loginSection').classList.add('hidden');
    
    if (currentUser.role === 'POLICE') {
        document.getElementById('policeSection').classList.remove('hidden');
        document.getElementById('policeName').textContent = `👮 ${currentUser.name}`;
        loadAllViolations();
    } else {
        document.getElementById('ownerSection').classList.remove('hidden');
        document.getElementById('ownerName').textContent = `👤 ${currentUser.name}`;
        document.getElementById('ownerPlate').textContent = `🚗 ${currentUser.plateNumber}`;
        loadMyViolations();
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('policeSection').classList.add('hidden');
    document.getElementById('ownerSection').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('loginForm').reset();
}

function validatePlateNumber(plateNumber) {
    const plateRegex = /^[\u4e00-\u9fa5][A-Z][A-Z0-9]{5,6}$/;
    return plateRegex.test(plateNumber);
}

async function handleCreateViolation(e) {
    e.preventDefault();

    const plateNumber = document.getElementById('plateNumber').value.trim().toUpperCase();
    
    if (!validatePlateNumber(plateNumber)) {
        showMessage('车牌号格式不正确，请输入正确的车牌号（如：粤A12345）', 'error');
        return;
    }

    const violation = {
        plateNumber: plateNumber,
        violationTime: document.getElementById('violationTime').value,
        location: document.getElementById('location').value,
        fineAmount: parseFloat(document.getElementById('fineAmount').value),
        points: parseInt(document.getElementById('points').value)
    };

    try {
        const response = await fetch(`${API_BASE}/violations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(violation)
        });

        const data = await response.json();

        if (data.success) {
            showMessage('违章记录录入成功！', 'success');
            document.getElementById('violationForm').reset();
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            document.getElementById('violationTime').value = now.toISOString().slice(0, 16);
            loadAllViolations();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('请求失败', 'error');
    }
}

async function loadAllViolations(page = 0) {
    try {
        const response = await fetch(`${API_BASE}/violations/paged?page=${page}`);
        const data = await response.json();

        if (data.success) {
            currentPage = data.currentPage;
            renderViolationsList(data.violations, 'allViolationsList', false, false, data);
        }
    } catch (error) {
        console.error('加载失败:', error);
    }
}

function renderPagination(paginationData, containerId) {
    const container = document.getElementById(containerId);
    const { currentPage, totalPages, totalItems } = paginationData;
    
    if (totalPages <= 1) {
        return '';
    }

    let paginationHtml = '<div class="pagination">';
    
    paginationHtml += `<button class="btn btn-secondary" onclick="loadAllViolations(0)" ${currentPage === 0 ? 'disabled' : ''}>首页</button>`;
    paginationHtml += `<button class="btn btn-secondary" onclick="loadAllViolations(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>上一页</button>`;
    paginationHtml += `<span class="page-info">第 ${currentPage + 1} / ${totalPages} 页，共 ${totalItems} 条记录</span>`;
    paginationHtml += `<button class="btn btn-secondary" onclick="loadAllViolations(${currentPage + 1})" ${currentPage === totalPages - 1 ? 'disabled' : ''}>下一页</button>`;
    paginationHtml += `<button class="btn btn-secondary" onclick="loadAllViolations(${totalPages - 1})" ${currentPage === totalPages - 1 ? 'disabled' : ''}>末页</button>`;
    
    paginationHtml += '</div>';
    
    container.innerHTML += paginationHtml;
}

async function loadMyViolations() {
    try {
        const response = await fetch(`${API_BASE}/violations/plate/${currentUser.plateNumber}/unpaid`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('totalPoints').textContent = data.totalPoints;
            
            const progressWidth = Math.min((data.totalPoints / 12) * 100, 100);
            document.getElementById('pointsProgress').style.width = `${progressWidth}%`;

            if (data.isSuspended) {
                document.getElementById('suspensionWarning').classList.remove('hidden');
            } else {
                document.getElementById('suspensionWarning').classList.add('hidden');
            }

            renderViolationsList(data.violations, 'myViolationsList', true, data.isSuspended);
        }
    } catch (error) {
        console.error('加载失败:', error);
    }
}

function renderViolationsList(violations, containerId, showPayButton, isSuspended = false, paginationData = null) {
    const container = document.getElementById(containerId);
    
    if (!violations || violations.length === 0) {
        container.innerHTML = '<div class="no-data">暂无违章记录</div>';
        return;
    }

    let html = violations.map(v => {
        const statusClass = v.status === 'PAID' ? 'status-paid' : 
                           isSuspended ? 'status-suspended' : 'status-unpaid';
        const statusText = v.status === 'PAID' ? '已处理' : 
                          isSuspended ? '驾照暂扣' : '未处理';
        const itemClass = v.status === 'PAID' ? 'paid' : 
                         isSuspended ? 'suspended' : '';
        
        return `
            <div class="violation-item ${itemClass}">
                <div class="violation-header">
                    <span class="violation-plate">🚗 ${v.plateNumber}</span>
                    <span class="violation-status ${statusClass}">${statusText}</span>
                </div>
                <div class="violation-details">
                    <div class="violation-detail"><strong>时间：</strong>${formatDateTime(v.violationTime)}</div>
                    <div class="violation-detail"><strong>地点：</strong>${v.location}</div>
                    <div class="violation-detail"><strong>罚款：</strong>¥${v.fineAmount}</div>
                    <div class="violation-detail"><strong>扣分：</strong>${v.points}分</div>
                    ${v.receiptNumber ? `<div class="violation-detail"><strong>凭证号：</strong>${v.receiptNumber}</div>` : ''}
                    ${v.paymentTime ? `<div class="violation-detail"><strong>缴费时间：</strong>${formatDateTime(v.paymentTime)}</div>` : ''}
                </div>
                ${showPayButton && v.status === 'UNPAID' ? `
                    <div class="violation-actions">
                        <button onclick="payViolation(${v.id})" class="btn btn-success" ${isSuspended ? 'disabled' : ''}>
                            ${isSuspended ? '禁止缴费' : '立即缴费'}
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    container.innerHTML = html;

    if (paginationData) {
        renderPagination(paginationData, containerId);
    }
}

async function payViolation(id) {
    if (!confirm('确认支付该违章罚款吗？')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/violations/${id}/pay`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            showMessage('缴费成功！', 'success');
            showReceipt(data.violation);
            loadMyViolations();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('缴费失败', 'error');
    }
}

function showReceipt(violation) {
    const receiptContent = document.getElementById('receiptContent');
    receiptContent.innerHTML = `
        <div class="receipt-logo">✅</div>
        <h2>电子缴费凭证</h2>
        <div class="receipt-number">凭证号：${violation.receiptNumber}</div>
        <div class="receipt-details">
            <div class="receipt-detail"><span>车牌号</span><span>${violation.plateNumber}</span></div>
            <div class="receipt-detail"><span>违章时间</span><span>${formatDateTime(violation.violationTime)}</span></div>
            <div class="receipt-detail"><span>违章地点</span><span>${violation.location}</span></div>
            <div class="receipt-detail"><span>罚款金额</span><span>¥${violation.fineAmount}</span></div>
            <div class="receipt-detail"><span>扣分</span><span>${violation.points}分</span></div>
            <div class="receipt-detail"><span>缴费时间</span><span>${formatDateTime(violation.paymentTime)}</span></div>
        </div>
        <div class="receipt-footer">
            <p>此凭证为系统自动生成，具有法律效力</p>
            <p>交通违章管理系统</p>
        </div>
    `;
    document.getElementById('receiptModal').classList.remove('hidden');
}

function closeReceipt() {
    document.getElementById('receiptModal').classList.add('hidden');
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild.nextSibling);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

document.getElementById('receiptModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeReceipt();
    }
});
