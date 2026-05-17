const API_BASE = '/api';

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

async function request(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        const data = await response.json();
        return data;
    } catch (error) {
        showToast('网络请求失败', 'error');
        throw error;
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function logout() {
    request(`${API_BASE}/user/logout`, { method: 'POST' })
        .then(() => {
            window.location.href = '/login.html';
        });
}

function checkLogin() {
    return request(`${API_BASE}/user/current`)
        .then(data => {
            if (data.code !== 200) {
                window.location.href = '/login.html';
                return null;
            }
            return data.data;
        });
}

function getRoleText(role) {
    const roleMap = {
        'ADMIN': '管理员',
        'DISPATCHER': '调度员',
        'WAREHOUSE_KEEPER': '仓管员'
    };
    return roleMap[role] || role;
}

function getRoleClass(role) {
    const classMap = {
        'ADMIN': 'role-admin',
        'DISPATCHER': 'role-dispatcher',
        'WAREHOUSE_KEEPER': 'role-keeper'
    };
    return classMap[role] || '';
}

function getStatusText(status) {
    const statusMap = {
        'AVAILABLE': '可用',
        'FULL': '已满',
        'MAINTENANCE': '维护中'
    };
    return statusMap[status] || status;
}

function getStatusClass(status) {
    const classMap = {
        'AVAILABLE': 'status-available',
        'FULL': 'status-full',
        'MAINTENANCE': 'status-maintenance'
    };
    return classMap[status] || '';
}
