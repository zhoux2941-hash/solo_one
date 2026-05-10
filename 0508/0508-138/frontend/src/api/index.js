import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: '/api',
  timeout: 30000
})

service.interceptors.response.use(
  response => {
    const res = response.data
    if (!res.success) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  error => {
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export const mineralApi = {
  getFeatureOptions() {
    return service.get('/minerals/feature-options')
  },
  
  identifyMinerals(params) {
    return service.post('/minerals/identify', params)
  },
  
  confirmIdentification(params) {
    return service.post('/minerals/confirm', params)
  },
  
  getAllMinerals() {
    return service.get('/minerals')
  },
  
  getMineralById(id) {
    return service.get(`/minerals/${id}`)
  }
}

export default service
