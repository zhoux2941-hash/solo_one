import request from '@/utils/request'

export function getTaskList(params) {
  return request.get('/task/list', { params })
}

export function getHotTasks() {
  return request.get('/task/hot')
}

export function getTaskDetail(taskId) {
  return request.get(`/task/detail/${taskId}`)
}

export function publishTask(formData) {
  return request.post('/task/publish', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function getMyPublishedTasks(params) {
  return request.get('/task/my-published', { params })
}

export function selectWinner(taskId, auditionId) {
  return request.post('/task/select-winner', null, {
    params: { taskId, auditionId }
  })
}
