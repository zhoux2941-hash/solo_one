const API_BASE_URL = 'http://localhost:8080/api';

const api = {
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        const finalOptions = { ...defaultOptions, ...options };
        if (finalOptions.body && typeof finalOptions.body !== 'string') {
            finalOptions.body = JSON.stringify(finalOptions.body);
        }
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, finalOptions);
            
            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData && typeof errorData === 'object') {
                        const messages = Object.values(errorData);
                        if (messages.length > 0) {
                            errorMessage = messages.join('; ');
                        }
                    }
                } catch (e) {
                    // 如果无法解析JSON，使用默认错误信息
                }
                throw new Error(errorMessage);
            }
            
            if (response.status === 204) {
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    },

    get(url) {
        return this.request(url, { method: 'GET' });
    },

    post(url, data) {
        return this.request(url, { method: 'POST', body: data });
    },

    put(url, data) {
        return this.request(url, { method: 'PUT', body: data });
    },

    delete(url) {
        return this.request(url, { method: 'DELETE' });
    },

    customers: {
        getAll: () => api.get('/customers'),
        getById: (id) => api.get(`/customers/${id}`),
        getBySalesperson: (salesperson) => api.get(`/customers/salesperson/${salesperson}`),
        getSalespersons: () => api.get('/customers/salespersons'),
        create: (data) => api.post('/customers', data),
        update: (id, data) => api.put(`/customers/${id}`, data),
        delete: (id) => api.delete(`/customers/${id}`),
        calculateProbability: (id) => api.post(`/customers/${id}/calculate-probability`),
    },

    followUpRecords: {
        getAll: () => api.get('/follow-up-records'),
        getById: (id) => api.get(`/follow-up-records/${id}`),
        getByCustomerId: (customerId) => api.get(`/follow-up-records/customer/${customerId}`),
        getBySalesperson: (salesperson) => api.get(`/follow-up-records/salesperson/${salesperson}`),
        create: (customerId, data) => api.post(`/follow-up-records/customer/${customerId}`, data),
        update: (id, data) => api.put(`/follow-up-records/${id}`, data),
        delete: (id) => api.delete(`/follow-up-records/${id}`),
    },

    dashboard: {
        getStats: () => api.get('/dashboard/stats'),
        getCustomers: () => api.get('/dashboard/customers'),
    },
};

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
    }).format(amount);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        color: white;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background-color: #27ae60;' : ''}
        ${type === 'error' ? 'background-color: #e74c3c;' : ''}
        ${type === 'info' ? 'background-color: #3498db;' : ''}
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
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

const ValidationUtils = {
    validatePhone(phone) {
        if (!phone) return { valid: false, message: '电话不能为空' };
        if (phone.length < 7) return { valid: false, message: '电话号码长度不能少于7位' };
        if (phone.length > 20) return { valid: false, message: '电话号码长度不能超过20位' };
        const phoneRegex = /^[0-9+\-\s()]+$/;
        if (!phoneRegex.test(phone)) {
            return { valid: false, message: '电话号码只能包含数字、空格、+、-、(、)' };
        }
        return { valid: true };
    },

    validateCompanyName(name) {
        if (!name || name.trim().length === 0) return { valid: false, message: '公司名称不能为空' };
        if (name.trim().length < 2) return { valid: false, message: '公司名称长度不能少于2个字符' };
        if (name.length > 100) return { valid: false, message: '公司名称长度不能超过100个字符' };
        return { valid: true };
    },

    validateContactPerson(name) {
        if (!name || name.trim().length === 0) return { valid: false, message: '联系人不能为空' };
        if (name.trim().length < 2) return { valid: false, message: '联系人姓名长度不能少于2个字符' };
        if (name.length > 50) return { valid: false, message: '联系人姓名长度不能超过50个字符' };
        return { valid: true };
    },

    validateSalesperson(name) {
        if (name && name.length > 50) {
            return { valid: false, message: '销售人员姓名长度不能超过50个字符' };
        }
        return { valid: true };
    },

    validateContent(content) {
        if (!content || content.trim().length === 0) return { valid: false, message: '沟通内容不能为空' };
        if (content.length > 2000) return { valid: false, message: '沟通内容长度不能超过2000个字符' };
        return { valid: true };
    },

    preventInvalidPhoneInput(event) {
        const input = event.target;
        const cursorPos = input.selectionStart;
        const originalValue = input.value;
        let newValue = originalValue.replace(/[^0-9+\-\s()]/g, '');
        if (newValue.length > 20) {
            newValue = newValue.substring(0, 20);
        }
        if (originalValue !== newValue) {
            input.value = newValue;
            input.setSelectionRange(Math.min(cursorPos, newValue.length), Math.min(cursorPos, newValue.length));
        }
    },

    limitInputLength(event, maxLength) {
        const input = event.target;
        if (input.value.length > maxLength) {
            input.value = input.value.substring(0, maxLength);
        }
    }
};