import request from '@/utils/request'

export function submitAudition(formData) {
  return request.post('/audition/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function getTaskAuditions(taskId) {
  return request.get(`/audition/task/${taskId}`)
}

export function getMyAuditions() {
  return request.get('/audition/my')
}
