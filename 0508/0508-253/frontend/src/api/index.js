import axios from 'axios'

const API_BASE = 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
})

export const subjectApi = {
  getAll: () => api.get('/subjects'),
  getByCategory: (category) => api.get(`/subjects/category/${category}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`)
}

export const traineeApi = {
  getAll: () => api.get('/trainees'),
  getByPlatoon: (platoon) => api.get(`/trainees/platoon/${platoon}`),
  create: (data) => api.post('/trainees', data),
  batchCreate: (data) => api.post('/trainees/batch', data),
  update: (id, data) => api.put(`/trainees/${id}`, data),
  delete: (id) => api.delete(`/trainees/${id}`)
}

export const scoreApi = {
  getAll: () => api.get('/scores'),
  getByTrainee: (traineeId) => api.get(`/scores/trainee/${traineeId}`),
  getBySubject: (subjectId) => api.get(`/scores/subject/${subjectId}`),
  create: (data) => api.post('/scores', data),
  batchCreate: (data) => api.post('/scores/batch', data),
  update: (id, data) => api.put(`/scores/${id}`, data),
  delete: (id) => api.delete(`/scores/${id}`)
}

export const comprehensiveApi = {
  getRanking: () => api.get('/comprehensive/ranking'),
  getByTrainee: (traineeId) => api.get(`/comprehensive/trainee/${traineeId}`),
  calculate: () => api.post('/comprehensive/calculate'),
  getWeakness: (traineeId) => api.get(`/comprehensive/weakness/${traineeId}`)
}

export default api