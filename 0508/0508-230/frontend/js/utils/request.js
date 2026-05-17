const Request = {
    BASE_URL: 'http://localhost:8080',

    request: function(method, url, data = null) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method, this.BASE_URL + url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');

            const token = Auth.getToken();
            if (token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 401) {
                        Auth.clearAuth();
                        const path = window.location.pathname;
                        if (path.includes('/pages/')) {
                            window.location.href = 'login.html';
                        } else {
                            window.location.href = 'pages/login.html';
                        }
                        return;
                    }

                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve(response);
                        } else {
                            reject(response);
                        }
                    } catch (e) {
                        reject({ code: xhr.status, message: '解析响应失败' });
                    }
                }
            };

            xhr.onerror = function() {
                reject({ code: 500, message: '网络请求失败' });
            };

            if (data) {
                xhr.send(JSON.stringify(data));
            } else {
                xhr.send();
            }
        });
    },

    get: function(url, params = {}) {
        const queryString = Object.keys(params)
            .filter(key => {
                const value = params[key];
                return value !== null && value !== undefined && value !== '';
            })
            .map(key => key + '=' + encodeURIComponent(params[key]))
            .join('&');
        const fullUrl = queryString ? url + '?' + queryString : url;
        return this.request('GET', fullUrl);
    },

    post: function(url, data = {}) {
        return this.request('POST', url, data);
    },

    put: function(url, data = {}) {
        return this.request('PUT', url, data);
    },

    delete: function(url) {
        return this.request('DELETE', url);
    }
};
