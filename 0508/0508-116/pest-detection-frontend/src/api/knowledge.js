import request from '@/utils/request'

export function createKnowledge(data) {
  return request({
    url: '/api/knowledge',
    method: 'post',
    data
  })
}

export function updateKnowledge(id, data) {
  return request({
    url: `/api/knowledge/${id}`,
    method: 'put',
    data
  })
}

export function deleteKnowledge(id) {
  return request({
    url: `/api/knowledge/${id}`,
    method: 'delete'
  })
}

export function getKnowledgeById(id) {
  return request({
    url: `/api/knowledge/${id}`,
    method: 'get'
  })
}

export function getKnowledgeByExpert(expertId) {
  return request({
    url: `/api/knowledge/expert/${expertId}`,
    method: 'get'
  })
}

export function searchKnowledge(keyword, cropType) {
  return request({
    url: '/api/knowledge/search',
    method: 'get',
    params: { keyword, cropType }
  })
}

export function getAllKnowledge() {
  return request({
    url: '/api/knowledge',
    method: 'get'
  })
}