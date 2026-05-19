import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: '',
  timeout: 15000
})

service.interceptors.request.use(
  config => {
    return config
  },
  error => {
    console.error(error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  error => {
    console.error('请求错误:', error)
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error)
  }
)

export default service