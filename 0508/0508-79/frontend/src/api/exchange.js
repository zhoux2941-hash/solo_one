import request from './request'

export const getMyRequests = () => {
  return request({
    url: '/requests/my',
    method: 'get'
  })
}

export const getMyRequestsPaginated = (params) => {
  return request({
    url: '/requests/my/page',
    method: 'get',
    params
  })
}

export const getPendingRequests = () => {
  return request({
    url: '/requests/pending',
    method: 'get'
  })
}

export const createRequest = (data) => {
  return request({
    url: '/requests',
    method: 'post',
    data
  })
}

export const acceptRequest = (id) => {
  return request({
    url: `/requests/${id}/accept`,
    method: 'post'
  })
}

export const rejectRequest = (id) => {
  return request({
    url: `/requests/${id}/reject`,
    method: 'post'
  })
}

export const cancelRequest = (id) => {
  return request({
    url: `/requests/${id}/cancel`,
    method: 'post'
  })
}

export const getRequestDetail = (id) => {
  return request({
    url: `/requests/${id}`,
    method: 'get'
  })
}
