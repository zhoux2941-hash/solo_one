import request from './request'

export const getMessages = () => {
  return request({
    url: '/messages',
    method: 'get'
  })
}

export const getMessagesPaginated = (params) => {
  return request({
    url: '/messages/page',
    method: 'get',
    params
  })
}

export const getUnreadCount = () => {
  return request({
    url: '/messages/unread-count',
    method: 'get'
  })
}

export const getUnreadMessages = () => {
  return request({
    url: '/messages/unread',
    method: 'get'
  })
}

export const markAsRead = (id) => {
  return request({
    url: `/messages/${id}/read`,
    method: 'post'
  })
}

export const markAllAsRead = () => {
  return request({
    url: '/messages/read-all',
    method: 'post'
  })
}
