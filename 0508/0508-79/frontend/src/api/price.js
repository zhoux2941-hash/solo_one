import request from '@/api/request'

export function submitValuation(data) {
  return request({
    url: '/prices/valuations',
    method: 'post',
    data
  })
}

export function getMyValuation(boxId) {
  return request({
    url: `/prices/valuations/my/${boxId}`,
    method: 'get'
  })
}

export function getBoxValuationStats(boxId) {
  return request({
    url: `/prices/valuations/stats/${boxId}`,
    method: 'get'
  })
}

export function getSeriesValuationStats(seriesName, styleName) {
  return request({
    url: '/prices/valuations/stats-series',
    method: 'get',
    params: { seriesName, styleName }
  })
}

export function getTransactionStats(seriesName, styleName, months = 3) {
  return request({
    url: '/prices/transactions/stats',
    method: 'get',
    params: { seriesName, styleName, months }
  })
}

export function getRecentTransactions(seriesName, styleName, limit = 10) {
  return request({
    url: '/prices/transactions/recent',
    method: 'get',
    params: { seriesName, styleName, limit }
  })
}

export function acceptRequestWithPrice(requestId, data) {
  return request({
    url: `/requests/${requestId}/accept-with-price`,
    method: 'post',
    data
  })
}
