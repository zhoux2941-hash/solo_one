import request from '@/utils/request'

export function getComparisonData(beehiveIds, startDate, endDate) {
  return request({
    url: '/comparison',
    method: 'get',
    params: { beehiveIds, startDate, endDate }
  })
}
