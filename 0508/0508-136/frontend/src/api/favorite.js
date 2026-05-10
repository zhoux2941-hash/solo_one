import request from '@/utils/request'

export function getFavorites() {
  return request({
    url: '/favorites',
    method: 'get'
  })
}

export function getFavorite(id) {
  return request({
    url: `/favorites/${id}`,
    method: 'get'
  })
}

export function createFavorite(data) {
  return request({
    url: '/favorites',
    method: 'post',
    data
  })
}

export function updateFavorite(id, data) {
  return request({
    url: `/favorites/${id}`,
    method: 'put',
    data
  })
}

export function deleteFavorite(id) {
  return request({
    url: `/favorites/${id}`,
    method: 'delete'
  })
}