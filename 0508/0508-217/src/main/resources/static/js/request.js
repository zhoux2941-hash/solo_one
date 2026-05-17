const API_BASE = '/api';

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

async function request(url, options = {}) {
    const defaultOptions = {
        headers: {},
        credentials: 'include',
    };

    const finalOptions = { ...defaultOptions, ...options };
    if (options.body && typeof options.body === 'object') {
        finalOptions.body = JSON.stringify(options.body);
        finalOptions.headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_BASE}${url}`, finalOptions);
        
        if (response.status === 401) {
            showToast('登录已过期，请重新登录', 'error');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1000);
            return;
        }

        const data = await response.json();
        
        if (data.code === 200) {
            return data;
        } else {
            showToast(data.message || '操作失败', 'error');
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Request error:', error);
        if (error.message !== 'Failed to fetch') {
            showToast(error.message || '网络请求失败', 'error');
        }
        throw error;
    }
}

const api = {
    get: (url, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const finalUrl = queryString ? `${url}?${queryString}` : url;
        return request(finalUrl, { method: 'GET' });
    },
    
    post: (url, data = {}) => {
        return request(url, { method: 'POST', body: data });
    },
    
    put: (url, data = {}) => {
        return request(url, { method: 'PUT', body: data });
    },
    
    delete: (url) => {
        return request(url, { method: 'DELETE' });
    },

    auth: {
        login: (data) => api.post('/auth/login', data),
        logout: () => api.post('/auth/logout'),
        current: () => api.get('/auth/current')
    },

    user: {
        list: (params) => api.get('/users', params),
        get: (id) => api.get(`/users/${id}`),
        create: (data) => api.post('/users', data),
        update: (id, data) => api.put(`/users/${id}`, data),
        delete: (id) => api.delete(`/users/${id}`),
        toggleStatus: (id) => api.put(`/users/${id}/status`)
    },

    department: {
        list: (params) => api.get('/departments', params),
        enabled: () => api.get('/departments/enabled'),
        get: (id) => api.get(`/departments/${id}`),
        detail: (id) => api.get(`/departments/${id}/detail`),
        create: (data) => api.post('/departments', data),
        update: (id, data) => api.put(`/departments/${id}`, data),
        delete: (id) => api.delete(`/departments/${id}`),
        toggleStatus: (id) => api.put(`/departments/${id}/status`)
    }
};