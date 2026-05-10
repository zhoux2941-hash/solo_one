import request from '@/utils/request'

export function getMyPortfolio() {
  return request.get('/portfolio/my')
}

export function getUserPortfolio(userId) {
  return request.get(`/portfolio/user/${userId}`)
}

export function addPortfolio(formData) {
  return request.post('/portfolio/add', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function updatePortfolio(id, title, description) {
  return request.post(`/portfolio/update/${id}`, null, {
    params: { title, description }
  })
}

export function deletePortfolio(id) {
  return request.post(`/portfolio/delete/${id}`)
}
