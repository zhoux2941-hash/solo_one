
import axios from 'axios'

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => response.data,
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 古琴相关API
export const guqinApi = {
  // 获取所有古琴列表
  getList: () => request.get('/guqin/list'),
  
  // 根据ID获取古琴详情
  getById: (id) => request.get(`/guqin/${id}`),
  
  // 创建古琴
  create: (data) => request.post('/guqin', data),
  
  // 更新古琴
  update: (id, data) => request.put(`/guqin/${id}`, data),
  
  // 删除古琴
  delete: (id) => request.delete(`/guqin/${id}`)
}

// 调音记录相关API
export const tuningRecordApi = {
  // 获取某张琴的所有调音记录
  getByGuqinId: (guqinId) => request.get(`/tuning-record/list/${guqinId}`),
  
  // 获取记录详情（包含徽位音准数据）
  getById: (id) => request.get(`/tuning-record/${id}`),
  
  // 创建调音记录
  create: (data) => request.post('/tuning-record', data),
  
  // 删除调音记录
  delete: (id) => request.delete(`/tuning-record/${id}`)
}

// 音准对比相关API
export const comparisonApi = {
  // 对比多张琴的音准偏差曲线
  compareInstruments: (guqinIds) => request.post('/comparison/compare', { guqinIds }),
  
  // 获取某张琴的音准偏差曲线历史
  getHistory: (guqinId) => request.get(`/comparison/history/${guqinId}`),
  
  // 统计分析
  getStatistics: (guqinId) => request.get(`/comparison/statistics/${guqinId}`)
}

export default request
