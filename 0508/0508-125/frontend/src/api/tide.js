import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const locationApi = {
  getAll: () => api.get('/locations'),
  
  create: (data) => api.post('/locations', data)
}

export const tideApi = {
  getDaily: (locationId, date) => 
    api.get(`/tide/daily/${locationId}`, { params: { date } }),
  
  getMonthly: (locationId, year, month) => 
    api.get(`/tide/monthly/${locationId}`, { params: { year, month } }),
  
  recordActual: (locationId, formData) => 
    api.post(`/tide/record/${locationId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  updateRecord: (recordId, formData) => 
    api.put(`/tide/record/${recordId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getMoonPhase: (date) => 
    api.get('/tide/moon-phase', { params: { date } })
}

export default api
