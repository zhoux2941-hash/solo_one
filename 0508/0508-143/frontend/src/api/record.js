import request from '@/utils/request'

export function getRecordsByBeehive(beehiveId) {
  return request({
    url: `/records/beehive/${beehiveId}`,
    method: 'get'
  })
}

export function getRecordsByDateRange(beehiveId, startDate, endDate) {
  return request({
    url: `/records/beehive/${beehiveId}/range`,
    method: 'get',
    params: { startDate, endDate }
  })
}

export function getTodayRecord(beehiveId) {
  return request({
    url: `/records/beehive/${beehiveId}/today`,
    method: 'get'
  })
}

export function createRecord(data) {
  return request({
    url: '/records',
    method: 'post',
    data
  })
}

export function updateRecord(id, data) {
  return request({
    url: `/records/${id}`,
    method: 'put',
    data
  })
}

export function deleteRecord(id) {
  return request({
    url: `/records/${id}`,
    method: 'delete'
  })
}
