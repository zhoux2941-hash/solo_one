import request from './request'

export const getMyBoxes = () => {
  return request({
    url: '/boxes/my',
    method: 'get'
  })
}

export const getMyAvailableBoxes = () => {
  return request({
    url: '/boxes/my/available',
    method: 'get'
  })
}

export const createBox = (data) => {
  return request({
    url: '/boxes',
    method: 'post',
    data
  })
}

export const updateBox = (id, data) => {
  return request({
    url: `/boxes/${id}`,
    method: 'put',
    data
  })
}

export const deleteBox = (id) => {
  return request({
    url: `/boxes/${id}`,
    method: 'delete'
  })
}

export const getBoxDetail = (id) => {
  return request({
    url: `/boxes/${id}`,
    method: 'get'
  })
}

export const searchBoxes = (params) => {
  return request({
    url: '/boxes/search',
    method: 'get',
    params
  })
}

export const getAllAvailableBoxes = (params) => {
  return request({
    url: '/boxes/all',
    method: 'get',
    params
  })
}

export const getAllSeries = () => {
  return request({
    url: '/boxes/series',
    method: 'get'
  })
}

export const getHotSeries = (limit = 10) => {
  return request({
    url: '/boxes/hot-series',
    method: 'get',
    params: { limit }
  })
}
