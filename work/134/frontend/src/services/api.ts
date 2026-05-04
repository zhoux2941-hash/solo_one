import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default api

// 日志相关 API
export const logApi = {
  // 上传日志文件
  uploadLog: (file: File, logType: string, parseRuleId?: number, source?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('logType', logType)
    if (parseRuleId) formData.append('parseRuleId', String(parseRuleId))
    if (source) formData.append('source', source)
    return api.post('/logs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 初始化分块上传会话
  initChunkUpload: (params: {
    fileName: string
    fileSize: number
    logType: string
    parseRuleId?: number
    source?: string
  }) => {
    return api.post('/logs/upload/chunk/init', params)
  },

  // 上传单个分块
  uploadChunk: (params: {
    chunk: Blob
    sessionId: string
    chunkIndex: number
    totalChunks: number
    logType: string
    parseRuleId?: number
    source?: string
    isLastChunk: boolean
  }) => {
    const formData = new FormData()
    formData.append('chunk', params.chunk)
    formData.append('sessionId', params.sessionId)
    formData.append('chunkIndex', String(params.chunkIndex))
    formData.append('totalChunks', String(params.totalChunks))
    formData.append('logType', params.logType)
    if (params.parseRuleId) formData.append('parseRuleId', String(params.parseRuleId))
    if (params.source) formData.append('source', params.source)
    formData.append('isLastChunk', String(params.isLastChunk))
    return api.post('/logs/upload/chunk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 批量上传日志文件
  uploadMultipleLogs: (files: File[], logType: string, parseRuleId?: number) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    formData.append('logType', logType)
    if (parseRuleId) formData.append('parseRuleId', String(parseRuleId))
    return api.post('/logs/upload/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 上传日志文本
  uploadLogText: (text: string, logType: string, parseRuleId?: number, source?: string) => {
    return api.post('/logs/upload/text', {
      text,
      logType,
      parseRuleId,
      source
    })
  },

  // 测试解析规则
  testParseRule: (logText: string, logType: string, ruleType?: string, pattern?: string, fieldMapping?: string) => {
    return api.post('/logs/parse/test', {
      logText,
      logType,
      ruleType,
      pattern,
      fieldMapping
    })
  },

  // 搜索日志
  searchLogs: (params: {
    startTime?: string
    endTime?: string
    keyword?: string
    level?: string
    logType?: string
    source?: string
    page?: number
    size?: number
  }) => {
    return api.post('/logs/search', params)
  },

  // 获取日志详情
  getLogById: (id: string) => {
    return api.get(`/logs/${id}`)
  },

  // 获取日志数量
  getLogCount: (params?: {
    startTime?: string
    endTime?: string
    level?: string
    logType?: string
  }) => {
    return api.get('/logs/count', { params })
  }
}

// 解析规则 API
export const parseRuleApi = {
  // 获取所有规则
  getAllRules: () => {
    return api.get('/rules')
  },

  // 获取所有启用的规则
  getActiveRules: () => {
    return api.get('/rules/active')
  },

  // 根据 ID 获取规则
  getRuleById: (id: number) => {
    return api.get(`/rules/${id}`)
  },

  // 根据日志类型获取规则
  getRulesByLogType: (logType: string) => {
    return api.get(`/rules/type/${logType}`)
  },

  // 创建规则
  createRule: (rule: {
    ruleName: string
    logType: string
    ruleType: string
    pattern: string
    fieldMapping?: string
    sampleLog?: string
    isActive?: boolean
  }) => {
    return api.post('/rules', rule)
  },

  // 更新规则
  updateRule: (id: number, rule: {
    ruleName: string
    logType: string
    ruleType: string
    pattern: string
    fieldMapping?: string
    sampleLog?: string
    isActive?: boolean
  }) => {
    return api.put(`/rules/${id}`, rule)
  },

  // 删除规则
  deleteRule: (id: number) => {
    return api.delete(`/rules/${id}`)
  },

  // 启用规则
  enableRule: (id: number) => {
    return api.put(`/rules/${id}/enable`)
  },

  // 禁用规则
  disableRule: (id: number) => {
    return api.put(`/rules/${id}/disable`)
  }
}

// 统计 API
export const statsApi = {
  // 获取日志级别分布
  getLevelDistribution: (params?: {
    startTime?: string
    endTime?: string
    logType?: string
  }) => {
    return api.get('/stats/levels', { params })
  },

  // 获取时间直方图
  getTimeHistogram: (params?: {
    startTime?: string
    endTime?: string
    interval?: string
    logType?: string
  }) => {
    return api.get('/stats/histogram', { params })
  },

  // 获取 Top 错误消息
  getTopErrorMessages: (params?: {
    startTime?: string
    endTime?: string
    topN?: number
    logType?: string
  }) => {
    return api.get('/stats/errors/top', { params })
  },

  // 获取仪表盘统计数据
  getDashboardStats: (params?: {
    startTime?: string
    endTime?: string
    interval?: string
    logType?: string
  }) => {
    return api.get('/stats/dashboard', { params })
  }
}

// 异常检测 API
export const anomalyApi = {
  // 获取异常记录列表
  getAnomalyList: (params?: {
    page?: number
    size?: number
    isAcknowledged?: boolean
    startTime?: string
    endTime?: string
  }) => {
    return api.get('/anomalies/list', { params })
  },

  // 获取时间范围内的异常记录
  getAnomaliesByRange: (params: {
    startTime: string
    endTime: string
    logType?: string
  }) => {
    return api.get('/anomalies/range', { params })
  },

  // 获取异常统计
  getAnomalyStats: () => {
    return api.get('/anomalies/stats')
  },

  // 手动触发异常检测
  detectAnomalies: (params?: {
    startTime?: string
    endTime?: string
    logType?: string
  }) => {
    return api.get('/anomalies/detect', { params })
  },

  // 检测时间范围内的异常
  detectAnomaliesInRange: (params: {
    startTime: string
    endTime: string
    logType?: string
  }) => {
    return api.get('/anomalies/detect-range', { params })
  },

  // 确认异常
  acknowledgeAnomaly: (id: number, acknowledgedBy?: string) => {
    return api.put(`/anomalies/${id}/acknowledge`, { acknowledgedBy })
  },

  // 测试钉钉报警
  testAlert: (message?: string) => {
    return api.post('/anomalies/test-alert', { message })
  },

  // 获取异常详情
  getAnomalyById: (id: number) => {
    return api.get(`/anomalies/${id}`)
  }
}
