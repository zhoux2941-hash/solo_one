import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

const userId = 'user_' + Math.random().toString(36).substr(2, 9)
const userName = '用户' + Math.floor(Math.random() * 1000)

export const getCurrentUser = () => ({ userId, userName })

request.interceptors.response.use(
  response => response,
  error => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

export const scriptApi = {
  getAll: () => request.get('/scripts'),
  getById: (id) => request.get(`/scripts/${id}`),
  create: (data) => request.post('/scripts', data),
  update: (id, data) => request.put(`/scripts/${id}`, data),
  delete: (id) => request.delete(`/scripts/${id}`),
  export: (id) => {
    window.open(`/api/scripts/${id}/export`, '_blank')
  }
}

export const sceneApi = {
  add: (scriptId, data) => request.post(`/scenes?scriptId=${scriptId}`, data),
  update: (sceneId, data) => request.put(`/scenes/${sceneId}`, data),
  delete: (sceneId) => request.delete(`/scenes/${sceneId}`)
}

export const puzzleApi = {
  add: (sceneId, data) => request.post(`/puzzles?sceneId=${sceneId}`, data),
  update: (puzzleId, data) => request.put(`/puzzles/${puzzleId}?userId=${userId}&userName=${userName}`, data),
  forceUpdate: (puzzleId, data) => request.put(`/puzzles/${puzzleId}/force?userId=${userId}`, data),
  delete: (puzzleId) => request.delete(`/puzzles/${puzzleId}`),
  startEditing: (puzzleId) => request.post(`/puzzles/${puzzleId}/start-editing?userId=${userId}&userName=${userName}`),
  stopEditing: (puzzleId) => request.post(`/puzzles/${puzzleId}/stop-editing?userId=${userId}`),
  getEditingStatus: (puzzleId) => request.get(`/puzzles/${puzzleId}/editing-status`)
}

export const testApi = {
  start: (scriptId) => request.post(`/test/${scriptId}/start`),
  submitAnswer: (scriptId, data) => request.post(`/test/${scriptId}/submit-answer`, data),
  skipPuzzle: (scriptId, data) => request.post(`/test/${scriptId}/skip-puzzle`, data),
  getReport: (scriptId) => request.get(`/test/${scriptId}/report`)
}

export default request
