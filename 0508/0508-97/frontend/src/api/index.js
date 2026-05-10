import axios from 'axios'
import { Message } from 'element-ui'
import router from '../router'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        Message.error('登录已过期，请重新登录')
        router.push('/login')
      } else if (error.response.status === 403) {
        Message.error('没有权限访问')
      } else {
        Message.error('网络错误，请稍后重试')
      }
    } else {
      Message.error('网络连接失败')
    }
    return Promise.reject(error)
  }
)

export default api
