import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const getRootstocks = () => api.get('/plants/rootstocks')
export const getScions = () => api.get('/plants/scions')
export const getCompatibilityScore = (rootstockId, scionId) => 
  api.get('/compatibility/score', { params: { rootstockId, scionId } })
export const createRecord = (data) => api.post('/records', data)
export const updateSurvival = (id, survivalCount) => 
  api.put(`/records/${id}/survival`, null, { params: { survivalCount } })
export const getAllRecords = () => api.get('/records')
export const getSeasonAnalysis = (rootstockId, scionId) => 
  api.get('/records/season-analysis', { params: { rootstockId, scionId } })

export const getPhenologyStages = () => api.get('/reminders/stages')
export const getCareReminders = () => api.get('/reminders/care')
export const generateReminders = (recordId) => api.post(`/reminders/generate/${recordId}`)
export const getRemindersByRecord = (recordId) => api.get(`/reminders/record/${recordId}`)
export const getPendingReminders = (recordId) => api.get(`/reminders/pending/${recordId}`)
export const getTodayReminders = () => api.get('/reminders/today')
export const getUpcomingReminders = (days = 7) => api.get('/reminders/upcoming', { params: { days } })
export const completeReminder = (id, notes) => 
  api.put(`/reminders/${id}/complete`, null, { params: { notes } })
export const dismissReminder = (id) => api.put(`/reminders/${id}/dismiss`)
export const getCurrentStage = (graftingDate) => 
  api.get('/reminders/current-stage', { params: { graftingDate } })

export default api
