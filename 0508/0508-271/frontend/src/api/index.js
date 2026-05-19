import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    return Promise.reject(error)
  }
)

export const customerApi = {
  list: () => request.get('/customer/list'),
  search: (keyword) => request.get(`/customer/search?keyword=${keyword}`),
  get: (id) => request.get(`/customer/${id}`),
  save: (data) => request.post('/customer/save', data),
  delete: (id) => request.delete(`/customer/${id}`)
}

export const vehicleApi = {
  list: () => request.get('/vehicle/list'),
  byCustomer: (customerId) => request.get(`/vehicle/customer/${customerId}`),
  search: (keyword) => request.get(`/vehicle/search?keyword=${keyword}`),
  get: (id) => request.get(`/vehicle/${id}`),
  save: (data) => request.post('/vehicle/save', data),
  delete: (id) => request.delete(`/vehicle/${id}`)
}

export const partApi = {
  list: () => request.get('/part/list'),
  search: (keyword) => request.get(`/part/search?keyword=${keyword}`),
  warning: () => request.get('/part/warning'),
  get: (id) => request.get(`/part/${id}`),
  save: (data) => request.post('/part/save', data),
  stockIn: (id, quantity) => request.post(`/part/stockIn/${id}?quantity=${quantity}`),
  stockOut: (id, quantity) => request.post(`/part/stockOut/${id}?quantity=${quantity}`),
  delete: (id) => request.delete(`/part/${id}`)
}

export const workOrderApi = {
  list: () => request.get('/workorder/list'),
  byStatus: (status) => request.get(`/workorder/status/${status}`),
  byCustomer: (customerId) => request.get(`/workorder/customer/${customerId}`),
  search: (keyword) => request.get(`/workorder/search?keyword=${keyword}`),
  get: (id) => request.get(`/workorder/${id}`),
  getParts: (id) => request.get(`/workorder/${id}/parts`),
  getRecords: (id) => request.get(`/workorder/${id}/records`),
  create: (data) => request.post('/workorder/create', data),
  assign: (id, assignTo) => request.post(`/workorder/${id}/assign?assignTo=${assignTo}`),
  start: (id) => request.post(`/workorder/${id}/start`),
  complete: (id) => request.post(`/workorder/${id}/complete`),
  settle: (id, discountAmount, paidAmount) => request.post(`/workorder/${id}/settle?discountAmount=${discountAmount || 0}&paidAmount=${paidAmount}`),
  addPart: (data) => request.post('/workorder/part/add', data)
}

export const statisticsApi = {
  monthly: () => request.get('/statistics/monthly'),
  dashboard: () => request.get('/statistics/dashboard')
}