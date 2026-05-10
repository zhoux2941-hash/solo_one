import request from '../utils/request'

export function getMyNotifications() {
  return request({
    url: '/notifications',
    method: 'get'
  })
}

export function getUnreadNotifications() {
  return request({
    url: '/notifications/unread',
    method: 'get'
  })
}

export function getUnreadCount() {
  return request({
    url: '/notifications/unread-count',
    method: 'get'
  })
}

export function markAsRead(id) {
  return request({
    url: `/notifications/${id}/read`,
    method: 'post'
  })
}

export function markAllAsRead() {
  return request({
    url: '/notifications/read-all',
    method: 'post'
  })
}
