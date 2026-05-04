import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('Response error:', error)
    if (error.response) {
      switch (error.response.status) {
        case 404:
          console.error('Resource not found')
          break
        case 500:
          console.error('Server error')
          break
        default:
          console.error(`Error: ${error.response.status}`)
      }
    }
    return Promise.reject(error)
  }
)

export const fetchDiseasesBySymptoms = async (symptoms) => {
  const response = await api.post('/diseases/by-symptoms', {
    symptoms,
  })
  return response
}

export const fetchDiseaseDetails = async (diseaseName) => {
  const response = await api.get(`/diseases/details/${encodeURIComponent(diseaseName)}`)
  return response
}

export const fetchDrugSideEffects = async (drugName) => {
  const response = await api.get(`/drugs/side-effects/${encodeURIComponent(drugName)}`)
  return response
}

export const fetchDrugDetails = async (drugName) => {
  const response = await api.get(`/drugs/details/${encodeURIComponent(drugName)}`)
  return response
}

export const searchDrugs = async (drugName) => {
  const response = await api.get('/drugs/search', {
    params: { name: drugName },
  })
  return response
}

export const fetchNodeExpand = async (label, name) => {
  const response = await api.get('/graph/expand', {
    params: { label, name },
  })
  return response
}

export const fetchPath = async (startLabel, startName, endLabel, endName) => {
  const response = await api.get('/graph/path', {
    params: { startLabel, startName, endLabel, endName },
  })
  return response
}

export const getAllDiseases = async () => {
  const response = await api.get('/diseases')
  return response
}

export const getAllDrugs = async () => {
  const response = await api.get('/drugs')
  return response
}

export default api