import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default {
  getActivities(department = null) {
    const params = department ? { department } : {}
    return api.get('/activities', { params })
  },

  getActivityById(id) {
    return api.get(`/activities/${id}`)
  },

  createActivity(data) {
    return api.post('/activities', data)
  },

  submitActual(id, data) {
    return api.put(`/activities/${id}/submit`, data)
  },

  approveActivity(id) {
    return api.put(`/activities/${id}/approve`)
  },

  rejectActivity(id) {
    return api.put(`/activities/${id}/reject`)
  },

  deleteActivity(id) {
    return api.delete(`/activities/${id}`)
  },

  getDepartments() {
    return api.get('/activities/departments')
  },

  getStats(department = null) {
    const params = department ? { department } : {}
    return api.get('/activities/stats', { params })
  },

  getBudgetChangesByActivity(activityId) {
    return api.get(`/budget-changes/activity/${activityId}`)
  },

  getPendingBudgetChanges() {
    return api.get('/budget-changes/pending')
  },

  createBudgetChange(activityId, data) {
    return api.post(`/budget-changes/activity/${activityId}`, data)
  },

  approveBudgetChange(id, reviewReason = null) {
    return api.put(`/budget-changes/${id}/approve`, { reviewReason })
  },

  rejectBudgetChange(id, reviewReason) {
    return api.put(`/budget-changes/${id}/reject`, { reviewReason })
  }
}
