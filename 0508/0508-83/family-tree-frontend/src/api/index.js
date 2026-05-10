import request from '../utils/request'

export const familySpaceApi = {
  getAll() {
    return request.get('/api/family-spaces')
  },
  getById(id) {
    return request.get(`/api/family-spaces/${id}`)
  },
  create(data) {
    return request.post('/api/family-spaces', data)
  },
  update(id, data) {
    return request.put(`/api/family-spaces/${id}`, data)
  },
  delete(id) {
    return request.delete(`/api/family-spaces/${id}`)
  }
}

export const personApi = {
  getAll(familySpaceId) {
    return request.get(`/api/family-spaces/${familySpaceId}/persons`)
  },
  getById(familySpaceId, id) {
    return request.get(`/api/family-spaces/${familySpaceId}/persons/${id}`)
  },
  create(familySpaceId, data) {
    return request.post(`/api/family-spaces/${familySpaceId}/persons`, data)
  },
  update(familySpaceId, id, data) {
    return request.put(`/api/family-spaces/${familySpaceId}/persons/${id}`, data)
  },
  delete(familySpaceId, id, newParentId = null) {
    const params = newParentId ? { params: { newParentId } } : {}
    return request.delete(`/api/family-spaces/${familySpaceId}/persons/${id}`, params)
  }
}

export const treeApi = {
  getTree(familySpaceId) {
    return request.get(`/api/family-spaces/${familySpaceId}/tree`)
  },
  refreshTree(familySpaceId) {
    return request.post(`/api/family-spaces/${familySpaceId}/tree/refresh`)
  }
}

export const gedcomApi = {
  import(familySpaceId, file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post(`/api/family-spaces/${familySpaceId}/gedcom/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  export(familySpaceId) {
    return request.get(`/api/family-spaces/${familySpaceId}/gedcom/export`, {
      responseType: 'blob'
    })
  }
}

export const fileApi = {
  uploadAvatar(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/api/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export const eventApi = {
  getByPerson(familySpaceId, personId) {
    return request.get(`/api/family-spaces/${familySpaceId}/events/person/${personId}`)
  },
  getByFamilySpace(familySpaceId) {
    return request.get(`/api/family-spaces/${familySpaceId}/events`)
  },
  getTimeline(familySpaceId) {
    return request.get(`/api/family-spaces/${familySpaceId}/events/timeline`)
  },
  create(familySpaceId, data) {
    return request.post(`/api/family-spaces/${familySpaceId}/events`, data)
  },
  update(familySpaceId, eventId, data) {
    return request.put(`/api/family-spaces/${familySpaceId}/events/${eventId}`, data)
  },
  delete(familySpaceId, eventId) {
    return request.delete(`/api/family-spaces/${familySpaceId}/events/${eventId}`)
  }
}
