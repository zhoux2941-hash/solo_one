import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API Error:', error)
    
    if (error.response) {
      const { status } = error.response
      
      if (status === 409) {
        const data = error.response.data
        if (data && data.errorCode === 'CONCURRENT_CONFLICT') {
          return Promise.reject({
            isConflict: true,
            message: data.message || '操作冲突，请刷新页面后重试'
          })
        }
      }
      
      if (status === 413) {
        return Promise.reject({
          isPayloadTooLarge: true,
          message: '提交内容过大，请精简图文内容后重试'
        })
      }
    }
    
    return Promise.reject(error)
  }
)

export const userApi = {
  login: (data) => api.post('/users/login', data),
  getAll: () => api.get('/users'),
  getByRole: (role) => api.get(`/users/role/${role}`)
}

export const deviceApi = {
  getAll: () => api.get('/devices'),
  getById: (id) => api.get(`/devices/${id}`),
  getByStatus: (status) => api.get(`/devices/status/${status}`),
  create: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  delete: (id) => api.delete(`/devices/${id}`)
}

export const workOrderApi = {
  getAll: () => api.get('/workorders'),
  getById: (id) => api.get(`/workorders/${id}`),
  getByStatus: (status) => api.get(`/workorders/status/${status}`),
  getByCreator: (creatorId) => api.get(`/workorders/creator/${creatorId}`),
  getByAssignee: (assigneeId) => api.get(`/workorders/assignee/${assigneeId}`),
  getPendingTeamLeader: (leaderId) => api.get(`/workorders/teamleader/${leaderId}/pending`),
  getPendingAdmin: (adminId) => api.get(`/workorders/admin/${adminId}/pending`),
  getApprovals: (id) => api.get(`/workorders/${id}/approvals`),
  create: (data) => api.post('/workorders', data),
  createFromAlert: (alertId) => api.post(`/workorders/from-alert/${alertId}`),
  approveByLeader: (id, data) => api.post(`/workorders/${id}/approve/teamleader`, data),
  approveByAdmin: (id, data) => api.post(`/workorders/${id}/approve/admin`, data),
  assign: (id, data) => api.post(`/workorders/${id}/assign`, data),
  claim: (id, data) => api.post(`/workorders/${id}/claim`, data),
  complete: (id) => api.post(`/workorders/${id}/complete`)
}

export const maintenanceLogApi = {
  getAll: () => api.get('/maintenance-logs'),
  getById: (id) => api.get(`/maintenance-logs/${id}`),
  getByWorkOrder: (workOrderId) => api.get(`/maintenance-logs/workorder/${workOrderId}`),
  getByDevice: (deviceId) => api.get(`/maintenance-logs/device/${deviceId}`),
  getByMaintainer: (maintainerId) => api.get(`/maintenance-logs/maintainer/${maintainerId}`),
  create: (data) => api.post('/maintenance-logs', data),
  update: (id, data) => api.put(`/maintenance-logs/${id}`, data)
}

export const scheduleApi = {
  getAll: () => api.get('/schedules'),
  getById: (id) => api.get(`/schedules/${id}`),
  getByUser: (userId) => api.get(`/schedules/user/${userId}`),
  getByDate: (date) => api.get(`/schedules/date/${date}`),
  getByDateRange: (startDate, endDate) => api.get(`/schedules/range?startDate=${startDate}&endDate=${endDate}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`)
}

export const alertApi = {
  getAll: () => api.get('/alerts'),
  getById: (id) => api.get(`/alerts/${id}`),
  getUnread: () => api.get('/alerts/unread'),
  getLatest: () => api.get('/alerts/latest'),
  create: (data) => api.post('/alerts', data),
  markAsRead: (id) => api.put(`/alerts/${id}/read`)
}

export const statisticsApi = {
  getDaily: (date) => api.get(`/statistics/daily/${date}`),
  getToday: () => api.get('/statistics/today'),
  getRange: (startDate, endDate) => api.get(`/statistics/range?startDate=${startDate}&endDate=${endDate}`),
  getAssignee: (assigneeId, startDate, endDate) => 
    api.get(`/statistics/assignee/${assigneeId}?startDate=${startDate}&endDate=${endDate}`),
  getAllAssignees: (startDate, endDate) => 
    api.get(`/statistics/assignees?startDate=${startDate}&endDate=${endDate}`),
  getDashboard: (date) => api.get(`/statistics/dashboard?date=${date || ''}`),
  getCompletionRate: (date) => api.get(`/statistics/completion-rate/daily/${date}`)
}

export default api
