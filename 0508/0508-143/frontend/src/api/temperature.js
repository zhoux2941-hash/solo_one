import request from '@/utils/request'

export function getTemperatureRecords(startDate, endDate) {
  return request({
    url: '/temperature/range',
    method: 'get',
    params: { startDate, endDate }
  })
}

export function getTemperatureRecordByDate(date) {
  return request({
    url: `/temperature/${date}`,
    method: 'get'
  })
}

export function createTemperatureRecord(data) {
  return request({
    url: '/temperature',
    method: 'post',
    data
  })
}

export function upsertTemperatureRecord(data) {
  return request({
    url: '/temperature/upsert',
    method: 'post',
    data
  })
}

export function batchCreateTemperatureRecords(data) {
  return request({
    url: '/temperature/batch',
    method: 'post',
    data
  })
}

export function updateTemperatureRecord(id, data) {
  return request({
    url: `/temperature/${id}`,
    method: 'put',
    data
  })
}

export function deleteTemperatureRecord(id) {
  return request({
    url: `/temperature/${id}`,
    method: 'delete'
  })
}
