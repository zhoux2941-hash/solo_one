const API_BASE = 'http://localhost:8080/api';

const api = {
    async getSlopes() {
        const response = await fetch(`${API_BASE}/slopes`);
        return response.json();
    },

    async getSlopeById(id) {
        const response = await fetch(`${API_BASE}/slopes/${id}`);
        return response.json();
    },

    async updateSlopeStatus(id, status) {
        const response = await fetch(`${API_BASE}/slopes/${id}/status?status=${status}`, {
            method: 'PUT'
        });
        return response.json();
    },

    async incrementVisitor(id) {
        await fetch(`${API_BASE}/slopes/${id}/visitors`, {
            method: 'POST'
        });
    },

    async getLifts() {
        const response = await fetch(`${API_BASE}/lifts`);
        return response.json();
    },

    async getActiveLifts() {
        const response = await fetch(`${API_BASE}/lifts/active`);
        return response.json();
    },

    async updateLiftQueue(id, queueSize, recordedBy) {
        const response = await fetch(
            `${API_BASE}/lifts/${id}/queue?queueSize=${queueSize}&recordedBy=${recordedBy}`,
            { method: 'PUT' }
        );
        return response.json();
    },

    async toggleLiftStatus(id) {
        const response = await fetch(`${API_BASE}/lifts/${id}/toggle`, {
            method: 'POST'
        });
        return response.json();
    },

    async getDailyVisitorReport(date) {
        const url = date 
            ? `${API_BASE}/reports/visitors/daily?date=${date}`
            : `${API_BASE}/reports/visitors/daily`;
        const response = await fetch(url);
        return response.json();
    },

    async getQueueReport(start, end) {
        let url = `${API_BASE}/reports/queue`;
        const params = [];
        if (start) params.push(`start=${start}`);
        if (end) params.push(`end=${end}`);
        if (params.length > 0) url += '?' + params.join('&');
        const response = await fetch(url);
        return response.json();
    }
};
