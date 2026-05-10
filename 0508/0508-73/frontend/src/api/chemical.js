import request from '../utils/request'

export function getChemicals() {
  return request({
    url: '/chemicals',
    method: 'get'
  })
}

export function getChemicalById(id) {
  return request({
    url: `/chemicals/${id}`,
    method: 'get'
  })
}

export function createChemical(data) {
  return request({
    url: '/chemicals',
    method: 'post',
    data
  })
}

export function updateChemical(id, data) {
  return request({
    url: `/chemicals/${id}`,
    method: 'put',
    data
  })
}
