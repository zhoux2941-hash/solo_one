const Auth = {
    TOKEN_KEY: 'scenic_token',
    USER_KEY: 'scenic_user',

    login: function(username, password) {
        return new Promise((resolve, reject) => {
            Request.post('/api/auth/login', { username, password })
                .then(res => {
                    if (res.code === 200) {
                        this.setToken(res.data.token);
                        this.setUser({
                            username: res.data.username,
                            role: res.data.role,
                            empName: res.data.empName
                        });
                    }
                    resolve(res);
                })
                .catch(err => reject(err));
        });
    },

    logout: function() {
        return new Promise((resolve, reject) => {
            Request.post('/api/auth/logout')
                .then(res => {
                    this.clearAuth();
                    resolve(res);
                })
                .catch(err => {
                    this.clearAuth();
                    reject(err);
                });
        });
    },

    setToken: function(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    getToken: function() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    setUser: function(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    getUser: function() {
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    clearAuth: function() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    },

    isAuthenticated: function() {
        return !!this.getToken();
    },

    checkAuth: function() {
        if (!this.isAuthenticated()) {
            const path = window.location.pathname;
            if (path.includes('/pages/')) {
                window.location.href = 'login.html';
            } else {
                window.location.href = 'pages/login.html';
            }
            return false;
        }
        return true;
    }
};
