const API_BASE_URL = 'http://localhost:8090/api';

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
}

function request(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = token;
    }

    return fetch(API_BASE_URL + url, {
        ...options,
        headers
    }).then(response => {
        if (response.status === 401) {
            removeToken();
            window.location.href = '/frontend/login.html';
            return Promise.reject(new Error('未登录'));
        }
        return response.json();
    }).then(result => {
        if (result.code !== 200) {
            return Promise.reject(new Error(result.message || '请求失败'));
        }
        return result;
    });
}

const http = {
    get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? url + '?' + queryString : url;
        return request(fullUrl, { method: 'GET' });
    },
    post(url, data = {}) {
        return request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    put(url, data = {}) {
        return request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    delete(url) {
        return request(url, { method: 'DELETE' });
    }
};