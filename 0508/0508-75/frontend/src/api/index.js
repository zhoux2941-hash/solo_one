import request from '@/utils/request'

export const userApi = {
  login(data) {
    return request.post('/user/login', data)
  },
  register(data) {
    return request.post('/user/register', data)
  },
  getCurrentUser() {
    return request.get('/user/current')
  },
  logout() {
    return request.post('/user/logout')
  }
}

export const lostApi = {
  create(data) {
    return request.post('/lost', data)
  },
  page(params) {
    return request.get('/lost/page', { params })
  },
  my() {
    return request.get('/lost/my')
  },
  detail(id) {
    return request.get(`/lost/${id}`)
  }
}

export const foundApi = {
  create(data) {
    return request.post('/found', data)
  },
  page(params) {
    return request.get('/found/page', { params })
  },
  my() {
    return request.get('/found/my')
  },
  detail(id) {
    return request.get(`/found/${id}`)
  }
}

export const matchApi = {
  mySuggestions() {
    return request.get('/match/my-suggestions')
  },
  confirm(id) {
    return request.post(`/match/confirm/${id}`)
  },
  successCases(limit = 10) {
    return request.get('/match/success-cases', { params: { limit } })
  }
}

export const messageApi = {
  list() {
    return request.get('/message')
  },
  unreadCount() {
    return request.get('/message/unread-count')
  },
  markRead(id) {
    return request.post(`/message/read/${id}`)
  }
}

export const hotApi = {
  getTopKeywords(topN = 10) {
    return request.get('/hot', { params: { topN } })
  }
}
