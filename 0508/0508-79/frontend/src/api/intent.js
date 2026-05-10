import request from './request'

export const getMyIntents = () => {
  return request({
    url: '/intents/my',
    method: 'get'
  })
}

export const getMyActiveIntents = () => {
  return request({
    url: '/intents/my/active',
    method: 'get'
  })
}

export const getMyIntentsPaginated = (params) => {
  return request({
    url: '/intents/my/page',
    method: 'get',
    params
  })
}

export const createIntent = (data) => {
  return request({
    url: '/intents',
    method: 'post',
    data
  })
}

export const cancelIntent = (id) => {
  return request({
    url: `/intents/${id}/cancel`,
    method: 'post'
  })
}

export const getIntentDetail = (id) => {
  return request({
    url: `/intents/${id}`,
    method: 'get'
  })
}
