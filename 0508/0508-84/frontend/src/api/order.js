import request from '../utils/request'

export function createOrder(userId, goodsId, quantity) {
  return request({
    url: '/orders',
    method: 'post',
    data: { userId, goodsId, quantity }
  })
}

export function getOrdersByUser(userId) {
  return request({
    url: `/orders/user/${userId}`,
    method: 'get'
  })
}

export function getPendingOrders() {
  return request({
    url: '/orders/pending',
    method: 'get'
  })
}

export function getOrdersByStatus(status) {
  return request({
    url: `/orders/status/${status}`,
    method: 'get'
  })
}

export function deliverOrder(id, adminId) {
  return request({
    url: `/orders/deliver/${id}`,
    method: 'post',
    data: { adminId }
  })
}

export function completeOrder(id, adminId) {
  return request({
    url: `/orders/complete/${id}`,
    method: 'post',
    data: { adminId }
  })
}

export function cancelOrder(id) {
  return request({
    url: `/orders/cancel/${id}`,
    method: 'post'
  })
}
