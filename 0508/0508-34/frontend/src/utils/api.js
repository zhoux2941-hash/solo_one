import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const formatDateToISO = (date) => {
  if (!date) return null
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    return formatDateToISO(d)
  }
  if (date instanceof Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return null
}

export const getDetectionPoints = (date) => {
  const params = date ? { date: formatDateToISO(date) } : {}
  return api.get('/detection-points', { params })
    .then(response => response.data)
}

export const getWearPrediction = () => {
  return api.get('/wear/predict')
    .then(response => response.data)
}

export default api
