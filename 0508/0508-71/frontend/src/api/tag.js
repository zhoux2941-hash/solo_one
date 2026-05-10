import request from '@/utils/request'

export function getAllTags() {
  return request.get('/tag/all')
}

export function getMyTags() {
  return request.get('/tag/my')
}

export function getUserTags(userId) {
  return request.get(`/tag/user/${userId}`)
}

export function getTaskTags(taskId) {
  return request.get(`/tag/task/${taskId}`)
}

export function updateMyTags(tagIds) {
  return request.post('/tag/update-my', tagIds)
}
