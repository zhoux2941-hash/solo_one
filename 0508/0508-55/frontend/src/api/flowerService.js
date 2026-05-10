import axios from 'axios'

const API_BASE = '/api'
const SESSION_KEY = 'flower_preservative_session_id'

const getSessionId = () => {
  return localStorage.getItem(SESSION_KEY) || ''
}

const setSessionId = (id) => {
  if (id) {
    localStorage.setItem(SESSION_KEY, id)
  }
}

const getHeaders = () => {
  const headers = {}
  const sessionId = getSessionId()
  if (sessionId) {
    headers['X-Session-Id'] = sessionId
  }
  return headers
}

const handleResponse = (response) => {
  if (response.data.sessionId) {
    setSessionId(response.data.sessionId)
  }
  if (response.data.success) {
    return response.data
  }
  throw new Error(response.data.message || '请求失败')
}

export const flowerService = {
  async getOrCreateSession() {
    const response = await axios.get(`${API_BASE}/session`, {
      params: { sessionId: getSessionId() }
    })
    return handleResponse(response)
  },

  async getFlowerTypes() {
    const response = await axios.get(`${API_BASE}/flower-types`)
    if (response.data.success) {
      return response.data.data
    }
    throw new Error(response.data.message || '获取鲜花类型失败')
  },

  async getAllFormulas() {
    const response = await axios.get(`${API_BASE}/formulas`)
    if (response.data.success) {
      return response.data.data
    }
    throw new Error(response.data.message || '获取配方失败')
  },

  async getRecommendations(flowerType) {
    const response = await axios.get(`${API_BASE}/recommendations`, {
      params: { flowerType }
    })
    if (response.data.success) {
      return response.data.data
    }
    throw new Error(response.data.message || '获取推荐失败')
  },

  async runSimulation(flowerType, experimentDays) {
    const response = await axios.get(`${API_BASE}/simulate`, {
      params: { flowerType, experimentDays }
    })
    if (response.data.success) {
      return response.data.data
    }
    throw new Error(response.data.message || '模拟失败')
  },

  async getRadarData(flowerType) {
    const params = { sessionId: getSessionId() }
    if (flowerType) {
      params.flowerType = flowerType
    }
    const response = await axios.get(`${API_BASE}/radar-data-v2`, {
      params,
      headers: getHeaders()
    })
    return handleResponse(response)
  },

  async runSimulationV2(flowerType, experimentDays, note = '') {
    const params = { 
      sessionId: getSessionId(),
      flowerType,
      experimentDays
    }
    if (note) {
      params.note = note
    }
    const response = await axios.get(`${API_BASE}/simulate-v2`, {
      params,
      headers: getHeaders()
    })
    return handleResponse(response)
  },

  async saveCustomFormula(formulaData) {
    const response = await axios.post(`${API_BASE}/custom-formula`, formulaData, {
      params: { sessionId: getSessionId() },
      headers: getHeaders()
    })
    return handleResponse(response)
  },

  async getCustomFormula() {
    const response = await axios.get(`${API_BASE}/custom-formula`, {
      params: { sessionId: getSessionId() },
      headers: getHeaders()
    })
    return handleResponse(response)
  },

  async deleteCustomFormula() {
    const response = await axios.delete(`${API_BASE}/custom-formula`, {
      params: { sessionId: getSessionId() },
      headers: getHeaders()
    })
    return handleResponse(response)
  },

  async getExperimentRecords() {
    const response = await axios.get(`${API_BASE}/experiment-records`, {
      params: { sessionId: getSessionId() },
      headers: getHeaders()
    })
    return handleResponse(response)
  },

  async getExperimentRecord(id) {
    const response = await axios.get(`${API_BASE}/experiment-records/${id}`, {
      params: { sessionId: getSessionId() },
      headers: getHeaders()
    })
    return handleResponse(response)
  },

  async deleteExperimentRecord(id) {
    const response = await axios.delete(`${API_BASE}/experiment-records/${id}`, {
      params: { sessionId: getSessionId() },
      headers: getHeaders()
    })
    return handleResponse(response)
  }
}
