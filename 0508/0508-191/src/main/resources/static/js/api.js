const API_BASE = '/api';

async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(API_BASE + url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, message: '网络错误' };
    }
}

const API = {
    register: (data) => apiRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    login: (data) => apiRequest('/users/login', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    getUser: (id) => apiRequest(`/users/${id}`),

    publishBook: (data) => apiRequest('/books', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    getAllBooks: () => apiRequest('/books'),

    getAvailableBooks: () => apiRequest('/books/available'),

    getPopularBooks: () => apiRequest('/books/popular'),

    getMyBooks: (ownerId) => apiRequest(`/books/owner/${ownerId}`),

    getBook: (id) => apiRequest(`/books/${id}`),

    requestDrift: (data) => apiRequest('/drifts', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    confirmDrift: (id) => apiRequest(`/drifts/${id}/confirm`, {
        method: 'PUT'
    }),

    rejectDrift: (id) => apiRequest(`/drifts/${id}/reject`, {
        method: 'PUT'
    }),

    completeDrift: (id) => apiRequest(`/drifts/${id}/complete`, {
        method: 'PUT'
    }),

    getMyRequests: (requesterId) => apiRequest(`/drifts/requester/${requesterId}`),

    getReceivedRequests: (ownerId) => apiRequest(`/drifts/owner/${ownerId}`),

    getActiveDrifts: (requesterId) => apiRequest(`/drifts/active/${requesterId}`),

    checkin: (data) => apiRequest('/checkins', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    getCheckinsByDrift: (driftId) => apiRequest(`/checkins/drift/${driftId}`),

    getCheckinsByUser: (userId) => apiRequest(`/checkins/user/${userId}`)
};
