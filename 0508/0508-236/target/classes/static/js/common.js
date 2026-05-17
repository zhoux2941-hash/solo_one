let currentUser = null;

const PhoneUtils = {
    MOBILE_PATTERN: /^1[3-9]\d{9}$/,
    TEL_PATTERN: /^0\d{2,3}-?\d{7,8}$/,

    isValidMobile: function(phone) {
        if (!phone) return true;
        const clean = this.cleanPhone(phone);
        return this.MOBILE_PATTERN.test(clean);
    },

    isValidTel: function(tel) {
        if (!tel) return true;
        return this.TEL_PATTERN.test(tel);
    },

    isValidPhone: function(phone) {
        if (!phone) return true;
        return this.isValidMobile(phone) || this.isValidTel(phone);
    },

    cleanPhone: function(phone) {
        if (!phone) return '';
        return phone.replace(/[^0-9]/g, '');
    },

    formatMobile: function(phone) {
        if (!phone) return '-';
        const clean = this.cleanPhone(phone);
        if (clean.length === 11) {
            return clean.substring(0, 3) + '-' + clean.substring(3, 7) + '-' + clean.substring(7);
        }
        return phone;
    },

    formatTel: function(tel) {
        if (!tel) return '-';
        const clean = this.cleanPhone(tel);
        if (clean.length >= 10 && clean.length <= 12 && clean.startsWith('0')) {
            const areaCodeLen = clean.length === 11 ? 3 : 4;
            return clean.substring(0, areaCodeLen) + '-' + clean.substring(areaCodeLen);
        }
        return tel;
    },

    formatPhone: function(phone) {
        if (!phone) return '-';
        const clean = this.cleanPhone(phone);
        if (clean.length === 11 && clean.startsWith('1')) {
            return this.formatMobile(clean);
        } else if (clean.length >= 10 && clean.startsWith('0')) {
            return this.formatTel(clean);
        }
        return phone;
    },

    formatInput: function(input) {
        const value = input.value;
        const clean = this.cleanPhone(value);
        if (clean.length <= 3) {
            input.value = clean;
        } else if (clean.length <= 7) {
            input.value = clean.substring(0, 3) + '-' + clean.substring(3);
        } else if (clean.length <= 11) {
            input.value = clean.substring(0, 3) + '-' + clean.substring(3, 7) + '-' + clean.substring(7);
        } else {
            input.value = clean.substring(0, 3) + '-' + clean.substring(3, 7) + '-' + clean.substring(7, 11);
        }
    }
};

async function loadCurrentUser() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            currentUser = await response.json();
            updateUserInfo();
            updateNavigation();
        } else {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
    }
}

function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo && currentUser) {
        const roleText = getRoleText(currentUser.role);
        userInfo.innerHTML = `
            <span class="user-name">${currentUser.realName}</span>
            <span class="user-role">${roleText}</span>
        `;
    }
}

function updateNavigation() {
    const navUsers = document.getElementById('nav-users');
    if (navUsers && currentUser && currentUser.role !== 'ADMIN') {
        navUsers.style.display = 'none';
    }
}

function getRoleText(role) {
    const roleMap = {
        'ADMIN': '管理员',
        'SORTER': '分拣员',
        'DELIVERER': '派送员'
    };
    return roleMap[role] || role;
}

function getRoleBadgeClass(role) {
    const classMap = {
        'ADMIN': 'badge-admin',
        'SORTER': 'badge-sorter',
        'DELIVERER': 'badge-deliverer'
    };
    return classMap[role] || '';
}

function logout() {
    fetch('/logout', {
        method: 'POST'
    }).then(() => {
        window.location.href = '/login.html?logout';
    });
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.includes('login.html')) {
        loadCurrentUser();
    }
});
