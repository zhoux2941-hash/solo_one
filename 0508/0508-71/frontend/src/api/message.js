import request from '@/utils/request'

export function getMyMessages() {
  return request.get('/message/my')
}

export function getUnreadCount() {
  return request.get('/message/unread-count')
}

export function markAsRead(messageId) {
  return request.post(`/message/read/${messageId}`)
}

export function markAllAsRead() {
  return request.post('/message/read-all')
}
