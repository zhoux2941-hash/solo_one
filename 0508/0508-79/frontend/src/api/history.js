import request from './request'

export const getBrowseHistory = () => {
  return request({
    url: '/history',
    method: 'get'
  })
}

export const clearHistory = () => {
  return request({
    url: '/history',
    method: 'delete'
  })
}

export const getRecommendations = () => {
  return request({
    url: '/history/recommendations',
    method: 'get'
  })
}
