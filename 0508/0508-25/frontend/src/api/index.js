import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    ElMessage.error(error.response?.data?.message || '请求失败')
    return Promise.reject(error)
  }
)

export const petApi = {
  getAll: () => request.get('/pets'),
  getById: (id) => request.get(`/pets/${id}`),
  getByOwner: (ownerId) => request.get(`/pets/owner/${ownerId}`),
  create: (data) => request.post('/pets', data),
  update: (id, data) => request.put(`/pets/${id}`, data),
  delete: (id) => request.delete(`/pets/${id}`),
  getTypes: () => request.get('/pets/types'),
  getSizes: () => request.get('/pets/sizes')
}

export const centerApi = {
  getAll: () => request.get('/centers'),
  getAllWithRooms: () => request.get('/centers/with-rooms'),
  getById: (id) => request.get(`/centers/${id}`),
  getWithRooms: (id) => request.get(`/centers/${id}/with-rooms`),
  getRooms: (centerId) => request.get(`/centers/${centerId}/rooms`),
  getAllRooms: () => request.get('/centers/rooms'),
  getRoomById: (id) => request.get(`/centers/rooms/${id}`),
  getRoomTypes: () => request.get('/centers/rooms/types'),
  getRoomOccupancy: (roomId, year, month) => 
    request.get(`/centers/rooms/${roomId}/occupancy/${year}/${month}`),
  checkRoomAvailability: (roomId, startDate, endDate) => 
    request.get(`/centers/rooms/${roomId}/available`, { 
      params: { startDate, endDate } 
    })
}

export const bookingApi = {
  getList: (params) => request.get('/bookings', { params }),
  getById: (id) => request.get(`/bookings/${id}`),
  create: (data) => request.post('/bookings', data),
  confirm: (id) => request.post(`/bookings/${id}/confirm`),
  cancel: (id) => request.post(`/bookings/${id}/cancel`),
  reject: (id, reason) => request.post(`/bookings/${id}/reject`, { reason }),
  checkAvailability: (roomId, startDate, endDate) => 
    request.get('/bookings/check-availability', { 
      params: { roomId, startDate, endDate } 
    })
}

export const analyticsApi = {
  getOccupancyHeatmap: (year) => 
    request.get('/analytics/occupancy-heatmap', { params: { year } }),
  getPetTypePreference: () => request.get('/analytics/pet-type-preference'),
  getConflictAnalysis: (year, month) => 
    request.get('/analytics/conflict-analysis', { params: { year, month } })
}

export const matchingApi = {
  getRecommendations: (petId, startDate, endDate) => 
    request.get('/matching/recommend', { 
      params: { petId, startDate, endDate } 
    })
}

export const priceApi = {
  getSuggestions: (startDate, endDate) => 
    request.get('/price/suggestions', { params: { startDate, endDate } }),
  getSuggestionHistory: (status) => 
    request.get('/price/suggestions/history', { params: { status } }),
  applyAdjustment: (adjustmentId) => 
    request.post(`/price/suggestions/${adjustmentId}/apply`),
  cancelAdjustment: (adjustmentId) => 
    request.post(`/price/suggestions/${adjustmentId}/cancel`),
  batchApplyAdjustments: (adjustmentIds) => 
    request.post('/price/suggestions/batch-apply', { adjustmentIds }),
  getPriceTrend: (roomType, startDate, endDate) => 
    request.get(`/price/trend/${roomType}`, { params: { startDate, endDate } }),
  getRoomTypePrediction: (roomType, startDate, endDate) => 
    request.get(`/price/prediction/room-type/${roomType}`, { params: { startDate, endDate } })
}

export default request
