import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const orderApi = {
  create: (data) => request.post('/orders', data),
  getActive: () => request.get('/orders/active'),
  getAll: () => request.get('/orders'),
  getById: (id) => request.get(`/orders/${id}`),
  getSummary: (id) => request.get(`/orders/${id}/summary`),
  addItem: (id, data) => request.post(`/orders/${id}/items`, data),
  removeItem: (itemId, userId) => request.delete(`/orders/items/${itemId}`, { params: { userId } }),
  getItems: (id) => request.get(`/orders/${id}/items`),
  getParticipants: (id) => request.get(`/orders/${id}/participants`),
  getRecommendations: (id) => request.get(`/orders/${id}/recommendations`),
  end: (id, userId) => request.post(`/orders/${id}/end`, null, { params: { userId } }),
  cancel: (id, userId) => request.post(`/orders/${id}/cancel`, null, { params: { userId } }),
  getPayments: (id) => request.get(`/orders/${id}/payments`)
}

export const merchantApi = {
  getAll: () => request.get('/merchants'),
  getById: (id) => request.get(`/merchants/${id}`),
  getItems: (id) => request.get(`/merchants/${id}/items`)
}

export const exportApi = {
  exportExcel: (id) => request.get(`/export/${id}/excel`, {
    responseType: 'blob'
  })
}

export const statsApi = {
  getMonthlyOrderStats: (months = 6) => request.get('/stats/monthly-orders', { params: { months } }),
  getUserMonthlyStats: (userId, months = 6) => request.get('/stats/user-monthly', { params: { userId, months } }),
  getUserRanking: (limit = 10) => request.get('/stats/user-ranking', { params: { limit } }),
  getDepartmentRanking: (limit = 10) => request.get('/stats/department-ranking', { params: { limit } }),
  getPersonalSummary: (userId, userName) => request.get('/stats/personal-summary', { params: { userId, userName } })
}
