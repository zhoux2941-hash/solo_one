import request from '../utils/request'

export function getGoodsList() {
  return request({
    url: '/goods',
    method: 'get'
  })
}

export function getHotGoods() {
  return request({
    url: '/goods/hot',
    method: 'get'
  })
}

export function getAllGoods() {
  return request({
    url: '/goods/all',
    method: 'get'
  })
}

export function getGoodsById(id) {
  return request({
    url: `/goods/${id}`,
    method: 'get'
  })
}

export function createGoods(data) {
  return request({
    url: '/goods',
    method: 'post',
    data
  })
}

export function updateGoods(id, data) {
  return request({
    url: `/goods/${id}`,
    method: 'put',
    data
  })
}

export function deleteGoods(id) {
  return request({
    url: `/goods/${id}`,
    method: 'delete'
  })
}

export function getGoodsStock(id) {
  return request({
    url: `/goods/${id}/stock`,
    method: 'get'
  })
}
