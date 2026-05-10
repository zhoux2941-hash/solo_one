import request from '@/utils/request'

export function getOverview() {
  return request({
    url: '/statistics/overview',
    method: 'get'
  })
}

export function getDailyUsage(days = 7) {
  return request({
    url: '/statistics/daily',
    method: 'get',
    params: { days }
  })
}

export function getAllPileStatistics(days = 7) {
  return request({
    url: '/statistics/piles',
    method: 'get',
    params: { days }
  })
}

export function getPileStatistics(pileId, days = 7) {
  return request({
    url: `/statistics/piles/${pileId}`,
    method: 'get',
    params: { days }
  })
}

export function getHeatmapData(days = 7) {
  return request({
    url: '/statistics/heatmap',
    method: 'get',
    params: { days }
  })
}
