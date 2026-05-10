import request from '@/utils/request'

export const residentApi = {
  register: (data) => request.post('/resident/register', data),
  list: () => request.get('/resident/list'),
  getById: (id) => request.get(`/resident/${id}`),
  getPoints: (id) => request.get(`/resident/${id}/points`)
}

export const garbageApi = {
  throw: (data) => request.post('/garbage/throw', data),
  getRecords: (residentId) => request.get(`/garbage/records/${residentId}`)
}

export const productApi = {
  list: () => request.get('/product/list'),
  getById: (id) => request.get(`/product/${id}`),
  create: (data) => request.post('/product', data),
  update: (data) => request.put('/product', data),
  delete: (id) => request.delete(`/product/${id}`)
}

export const orderApi = {
  list: () => request.get('/order/list'),
  getByResidentId: (residentId) => request.get(`/order/resident/${residentId}`),
  getByStatus: (status) => request.get(`/order/status/${status}`),
  create: (data) => request.post('/order', data),
  verify: (id) => request.post(`/order/${id}/verify`),
  cancel: (id) => request.post(`/order/${id}/cancel`)
}

export const rankingApi = {
  getMonthlyRank: (params) => request.get('/ranking/monthly', { params }),
  getTotalRank: () => request.get('/ranking/total'),
  getEcoStar: (params) => request.get('/ranking/eco-star', { params }),
  getDashboard: (params) => request.get('/ranking/dashboard', { params }),
  refreshCache: (params) => request.post('/ranking/refresh', null, { params })
}
