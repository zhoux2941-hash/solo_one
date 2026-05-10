import axios from 'axios'
import store from '../store'
import router from '../router'
import { Message } from 'element-ui'

const service = axios.create({
  baseURL: '/api',
  timeout: 30000
})

service.interceptors.request.use(
  config => {
    const token = store.state.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => {
    const res = response.data
    if (!res.success) {
      Message.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  error => {
    if (error.response && error.response.status === 401) {
      store.dispatch('logout')
      router.push('/login')
      Message.error('登录已过期，请重新登录')
    } else {
      Message.error(error.response?.data?.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => service.post('/auth/login', data),
  register: (data) => service.post('/auth/register', data),
  getCurrentUser: () => service.get('/auth/me')
}

export const projectAPI = {
  createProject: (data) => service.post('/projects', data),
  getProjects: () => service.get('/projects'),
  getProjectDetail: (id) => service.get(`/projects/${id}`),
  getProjectStages: (id) => service.get(`/projects/${id}/stages`),
  updatePlannedDays: (data) => service.put('/projects/stages/planned-days', data),
  startStage: (projectId, stageIndex) => service.post(`/projects/${projectId}/stages/${stageIndex}/start`)
}

export const messageAPI = {
  getMessages: (onlyUnread = false) => service.get('/messages', { params: { onlyUnread } }),
  getUnreadCount: () => service.get('/messages/unread-count'),
  markAsRead: (messageId) => service.put(`/messages/${messageId}/read`),
  markAllAsRead: () => service.put('/messages/read-all'),
  getWarningProjects: () => service.get('/messages/warnings'),
  checkOverdueNow: () => service.post('/messages/check-now')
}

export const checkInAPI = {
  createCheckIn: (data) => service.post('/checkins', data),
  getProjectTimeline: (projectId) => service.get(`/checkins/project/${projectId}`),
  getMyCheckIns: () => service.get('/checkins/my')
}

export const commentAPI = {
  createComment: (data) => service.post('/comments', data),
  getProjectComments: (projectId) => service.get(`/comments/project/${projectId}`),
  getMyComments: () => service.get('/comments/my'),
  markAsRead: (commentId) => service.put(`/comments/${commentId}/read`),
  getUnreadCount: (projectId) => service.get(`/comments/project/${projectId}/unread-count`)
}

export default service
