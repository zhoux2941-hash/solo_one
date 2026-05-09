import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const courseApi = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  getRemaining: (id) => api.get(`/courses/${id}/remaining`),
  getByCoach: (coachId) => api.get(`/courses/coach/${coachId}`)
}

export const bookingApi = {
  book: (data) => api.post('/bookings', data),
  checkin: (id) => api.post(`/bookings/${id}/checkin`),
  cancel: (id) => api.delete(`/bookings/${id}`),
  getByUser: (userId) => api.get(`/bookings/user/${userId}`),
  getByCourse: (courseId) => api.get(`/bookings/course/${courseId}`),
  getByUserAndCourse: (userId, courseId) => api.get(`/bookings/user/${userId}/course/${courseId}`)
}

export const analyticsApi = {
  getCoaches: () => api.get('/analytics/coaches'),
  getCoachCheckinRate: (coachId, days = 30) => 
    api.get(`/analytics/coach/${coachId}/checkin-rate?days=${days}`),
  getCheckinHeatmap: (weeks = 4) => 
    api.get(`/analytics/checkin-heatmap?weeks=${weeks}`),
  getTopNoShowCourses: (limit = 5) => 
    api.get(`/analytics/top-no-show-courses?limit=${limit}`)
}

export const recommendationApi = {
  getForUser: (userId, limit = 6) => 
    api.get(`/recommendations/user/${userId}?limit=${limit}`)
}

export default api
