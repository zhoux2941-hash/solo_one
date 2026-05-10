import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import router from '../router'
import { ElMessage } from 'element-plus'

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true
})

instance.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      const url = error.config?.url || ''
      const isAudienceRequest = url.includes('/audience/')

      switch (error.response.status) {
        case 401:
          if (!isAudienceRequest) {
            const authStore = useAuthStore()
            authStore.logout()
            router.push('/login')
            ElMessage.error('登录已过期，请重新登录')
          }
          break
        case 403:
          ElMessage.error('没有权限执行此操作')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          if (!isAudienceRequest) {
            ElMessage.error(error.response.data?.message || '请求失败')
          }
      }
    } else {
      ElMessage.error('网络错误')
    }
    return Promise.reject(error)
  }
)

export default instance
