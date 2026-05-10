import request from './axios'

export function getAllVaccines() {
  return request({
    url: '/vaccines',
    method: 'get'
  })
}

export function getVaccineStock() {
  return request({
    url: '/vaccines/stock',
    method: 'get'
  })
}

export function getExpiringBatches() {
  return request({
    url: '/vaccines/expiring',
    method: 'get'
  })
}

export function useVaccine(data) {
  return request({
    url: '/vaccines/use',
    method: 'post',
    data
  })
}

export function getExpiredBatches() {
  return request({
    url: '/vaccines/expired',
    method: 'get'
  })
}

export function scrapBatches(data) {
  return request({
    url: '/vaccines/scrap',
    method: 'post',
    data
  })
}

export function getScrapRecords() {
  return request({
    url: '/vaccines/scrap-records',
    method: 'get'
  })
}
