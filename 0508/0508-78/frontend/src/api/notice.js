import request from '../utils/request'
import axios from 'axios'

export function createNotice(data) {
  return request.post('/notices', data)
}

export function getNoticesByDate(date) {
  return request.get('/notices/by-date', { params: { date } })
}

export function getMyNotices(date) {
  const params = date ? { date } : {}
  return request.get('/notices/my', { params })
}

export function getNoticeById(id) {
  return request.get(`/notices/${id}`)
}

export function confirmMaterials(id) {
  return request.put(`/notices/${id}/confirm-materials`)
}

export function getWeather(location, date) {
  const params = {}
  if (location) params.location = location
  if (date) params.date = date
  return request.get('/notices/weather', { params })
}

export function exportPdf(date, location) {
  const token = localStorage.getItem('token')
  let url = `/api/notices/export/pdf?date=${date}`
  if (location) {
    url += `&location=${encodeURIComponent(location)}`
  }
  
  return axios.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    responseType: 'blob'
  })
}