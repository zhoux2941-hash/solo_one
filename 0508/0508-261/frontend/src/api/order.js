import request from '@/utils/request'

export function createOrder(data) {
  return request({
    url: '/api/orders',
    method: 'post',
    data
  })
}

export function getOrder(orderNo) {
  return request({
    url: `/api/orders/${orderNo}`,
    method: 'get'
  })
}

export function queryOrders(params) {
  return request({
    url: '/api/orders',
    method: 'get',
    params
  })
}

export function queryOrdersByCursor(params) {
  return request({
    url: '/api/orders/cursor',
    method: 'get',
    params
  })
}

export function payOrder(orderNo) {
  return request({
    url: `/api/orders/${orderNo}/pay`,
    method: 'post'
  })
}

export function shipOrder(orderNo) {
  return request({
    url: `/api/orders/${orderNo}/ship`,
    method: 'post'
  })
}

export function deliverOrder(orderNo) {
  return request({
    url: `/api/orders/${orderNo}/deliver`,
    method: 'post'
  })
}

export function cancelOrder(orderNo, reason) {
  return request({
    url: `/api/orders/${orderNo}/cancel`,
    method: 'post',
    params: { reason }
  })
}

export function getOrderLogs(orderNo) {
  return request({
    url: `/api/orders/${orderNo}/logs`,
    method: 'get'
  })
}

export function getProduct(productId) {
  return request({
    url: `/api/orders/products/${productId}`,
    method: 'get'
  })
}