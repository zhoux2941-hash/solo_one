import request from '@/utils/request'

export function getEquipmentList(params) {
  return request({
    url: '/equipment/list',
    method: 'get',
    params
  })
}

export function getEquipment(id) {
  return request({
    url: `/equipment/${id}`,
    method: 'get'
  })
}

export function addEquipment(data) {
  return request({
    url: '/equipment',
    method: 'post',
    data
  })
}

export function updateEquipment(data) {
  return request({
    url: '/equipment',
    method: 'put',
    data
  })
}

export function deleteEquipment(id) {
  return request({
    url: `/equipment/${id}`,
    method: 'delete'
  })
}

export function exportEquipment(params) {
  return request({
    url: '/equipment/export',
    method: 'get',
    params
  })
}
