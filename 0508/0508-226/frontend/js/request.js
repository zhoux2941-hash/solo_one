const BASE_URL = 'http://localhost:8080/api';

function getToken() {
    return localStorage.getItem('token');
}

function request(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${BASE_URL}${url}`, {
        ...options,
        headers
    }).then(response => {
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return Promise.reject(new Error('未登录'));
        }
        return response.json();
    }).then(data => {
        if (data.code !== 200) {
            return Promise.reject(new Error(data.message || '请求失败'));
        }
        return data;
    }).catch(error => {
        console.error('请求错误:', error);
        if (error.message && error.message !== '未登录') {
            showMessage(error.message || '网络错误，请检查后端服务是否启动', 'error');
        }
        return Promise.reject(error);
    });
}

function get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return request(fullUrl, { method: 'GET' });
}

function post(url, data = {}) {
    return request(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

function put(url, data = {}) {
    return request(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

function del(url) {
    return request(url, { method: 'DELETE' });
}

function showMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 4px;
        color: white;
        font-size: 14px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    
    if (type === 'success') {
        toast.style.backgroundColor = '#52c41a';
    } else if (type === 'error') {
        toast.style.backgroundColor = '#ff4d4f';
    } else if (type === 'warning') {
        toast.style.backgroundColor = '#faad14';
    } else {
        toast.style.backgroundColor = '#1890ff';
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);