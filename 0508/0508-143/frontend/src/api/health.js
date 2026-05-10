import request from '@/utils/request'

export function getAllHealthScores() {
  return request({
    url: '/health',
    method: 'get'
  })
}

export function getHealthScore(beehiveId) {
  return request({
    url: `/health/${beehiveId}`,
    method: 'get'
  })
}
