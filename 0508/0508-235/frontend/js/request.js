const API_BASE_URL = 'http://localhost:8080/api';

const request = {
    get: function(url, params = {}) {
        const token = localStorage.getItem('token');
        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        const fullUrl = queryString ? `${API_BASE_URL}${url}?${queryString}` : `${API_BASE_URL}${url}`;
        
        return fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        }).then(response => response.json());
    },

    post: function(url, data = {}) {
        const token = localStorage.getItem('token');
        return fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(data)
        }).then(response => response.json());
    },

    put: function(url, data = {}) {
        const token = localStorage.getItem('token');
        return fetch(`${API_BASE_URL}${url}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(data)
        }).then(response => response.json());
    },

    delete: function(url) {
        const token = localStorage.getItem('token');
        return fetch(`${API_BASE_URL}${url}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            }
        }).then(response => response.json());
    }
};

const auth = {
    isLoggedIn: function() {
        return !!localStorage.getItem('token');
    },

    getUser: function() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    getRole: function() {
        const user = this.getUser();
        return user ? user.role : null;
    },

    login: function(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    logout: function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    checkAuth: function() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    hasPermission: function(requiredRoles) {
        const role = this.getRole();
        return requiredRoles.includes(role);
    }
};
