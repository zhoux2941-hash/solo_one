const API_BASE = 'http://localhost:3000/api';

const api = {
  async get(endpoint, params = {}) {
    const url = new URL(API_BASE + endpoint);
    Object.keys(params).forEach(key => {
      if (params[key]) url.searchParams.append(key, params[key]);
    });
    const response = await fetch(url);
    return response.json();
  },

  async post(endpoint, data = {}) {
    const response = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async put(endpoint, data = {}) {
    const response = await fetch(API_BASE + endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async download(endpoint) {
    const link = document.createElement('a');
    link.href = API_BASE + endpoint;
    link.click();
  }
};

const batchesAPI = {
  getList: (params) => api.get('/batches', params),
  getDetail: (id) => api.get(`/batches/${id}`),
  create: (data) => api.post('/batches', data),
  update: (id, data) => api.put(`/batches/${id}`, data),
  addFlowReading: (id, data) => api.post(`/batches/${id}/flow-reading`, data),
  addDowntimeRemark: (id, data) => api.post(`/batches/${id}/downtime-remark`, data),
  startCalculation: (id) => api.post(`/batches/${id}/start-calculation`),
  getMachines: () => api.get('/batches/machines/list')
};

const timelineAPI = {
  getBatchTimeline: (batchId) => api.get(`/timeline/batch/${batchId}`)
};

const lossAPI = {
  getBatchLoss: (batchId) => api.get(`/loss/batch/${batchId}`),
  getSegments: (batchId) => api.get(`/loss/batch/${batchId}/segments`),
  getSnapshots: (batchId) => api.get(`/loss/batch/${batchId}/snapshots`),
  recalculate: (batchId) => api.post(`/loss/recalculate/${batchId}`)
};

const reportsAPI = {
  exportReport: (batchId) => api.download(`/reports/batch/${batchId}/export`),
  exportBrief: (batchId) => api.download(`/reports/batch/${batchId}/brief`),
  exportBatchBriefList: async (batchIds) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${API_BASE}/reports/batches/brief`;
    form.target = '_blank';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'batchIds';
    input.value = JSON.stringify(batchIds);
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }
};

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getStatusText(status) {
  const statusMap = {
    pending: '待处理',
    processing: '计算中',
    completed: '已完成',
    reviewed: '已复盘'
  };
  return statusMap[status] || status;
}

function formatDuration(seconds) {
  if (!seconds) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}