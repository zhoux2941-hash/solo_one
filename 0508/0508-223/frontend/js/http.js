const BASE_URL = 'http://localhost:8080';

const http = {
    async request(url, options = {}) {
        const fullUrl = url.startsWith('http') ? url : BASE_URL + url;
        
        const isFileProtocol = window.location.protocol === 'file:';
        
        const defaultOptions = {
            credentials: isFileProtocol ? 'omit' : 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(fullUrl, finalOptions);
            
            if (response.status === 401) {
                const isLoginPage = window.location.pathname.toLowerCase().includes('login.html') || 
                                   window.location.href.toLowerCase().includes('login.html');
                
                if (!isLoginPage) {
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                }
                return { success: false, message: '登录已过期，请重新登录' };
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('请求失败:', error);
            showToast('网络请求失败，请检查服务器连接', 'error');
            return { success: false, message: '网络请求失败' };
        }
    },

    get(url, params = {}) {
        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    post(url, data = {}, params = {}) {
        let fullUrl = url;
        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        if (queryString) {
            fullUrl = `${url}?${queryString}`;
        }
        
        return this.request(fullUrl, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete(url) {
        return this.request(url, { method: 'DELETE' });
    },
};

function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function checkAuth() {
    const user = localStorage.getItem('user');
    const currentPath = window.location.pathname.toLowerCase();
    const currentHref = window.location.href.toLowerCase();
    
    if (!user && !currentPath.includes('login.html') && !currentHref.includes('login.html')) {
        window.location.href = 'login.html';
        return false;
    }
    return !!user;
}

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}
