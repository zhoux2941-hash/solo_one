import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.response.use(
  response => response,
  error => {
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error)
  }
)

const api = {
  getBuildings: () => request.get('/buildings'),
  getBuildingsRanked: () => request.get('/buildings/ranked'),
  getBuilding: (id) => request.get(`/buildings/${id}`),

  getUsers: () => request.get('/users'),
  getUsersRanked: () => request.get('/users/ranked'),
  getUser: (id) => request.get(`/users/${id}`),
  getUserByUsername: (username) => request.get(`/users/username/${username}`),
  createUser: (data) => request.post('/users', data),

  getCleaningPoints: () => request.get('/cleaning-points'),
  getCleaningPointsByStatus: (status) => request.get(`/cleaning-points/status/${status}`),
  getCleaningPoint: (id) => request.get(`/cleaning-points/${id}`),
  markPointAsPending: (id) => request.post(`/cleaning-points/${id}/mark-pending`),

  getUserRecords: (userId) => request.get(`/cleaning-records/user/${userId}`),
  getPointRecords: (pointId) => request.get(`/cleaning-records/point/${pointId}`),
  createCleaningRecord: (data) => request.post('/cleaning-records', data),

  getUserNotifications: (userId) => request.get(`/notifications/user/${userId}`),
  getUnreadNotifications: (userId) => request.get(`/notifications/user/${userId}/unread`),
  getUnreadCount: (userId) => request.get(`/notifications/user/${userId}/unread-count`),
  markNotificationAsRead: (id) => request.post(`/notifications/${id}/read`),
  markAllNotificationsRead: (userId) => request.post(`/notifications/user/${userId}/read-all`),

  getCommunityStats: () => request.get('/community/stats'),
  getCommunityCleanliness: () => request.get('/community/cleanliness'),

  getRescuePoints: () => request.get('/rescue/points'),
  getRescuePointsByStatus: (status) => request.get(`/rescue/points/status/${status}`),
  getRescuePoint: (id) => request.get(`/rescue/points/${id}`),
  getRescuePointRecords: (id) => request.get(`/rescue/points/${id}/records`),
  getRescueStats: () => request.get('/rescue/stats'),
  reportStrayAnimal: (data) => request.post('/rescue/report', data),
  provideSupplies: (id, data) => request.post(`/rescue/points/${id}/supply`, data),
  markAsRescued: (id, data) => request.post(`/rescue/points/${id}/rescue`, data)
}

export default api
