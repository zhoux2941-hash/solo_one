import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

request.interceptors.request.use(
  (config) => {
    const userId = localStorage.getItem('userId')
    if (userId) {
      config.headers['X-User-Id'] = userId
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 200) {
      return res.data
    }
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const templateApi = {
  getDefaultTemplates: () => request.get('/templates/default'),
  getTemplateById: (id) => request.get(`/templates/${id}`),
  uploadTemplate: (file, name, description, regions) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)
    if (description) formData.append('description', description)
    if (regions) formData.append('regions', regions)
    return request.post('/templates/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export const designApi = {
  saveDesign: (data) => request.post('/designs', data),
  updateDesign: (id, data) => request.put(`/designs/${id}`, data),
  getPublicDesigns: (page = 1, size = 12) => request.get('/designs/public', { params: { page, size } }),
  getUserDesigns: (userId) => request.get(`/designs/user/${userId}`),
  getDesignById: (id) => request.get(`/designs/${id}`),
  deleteDesign: (id, userId) => request.delete(`/designs/${id}`, { params: { userId } })
}

export const commentApi = {
  addComment: (data) => request.post('/comments', data),
  getComments: (designId) => request.get(`/comments/design/${designId}`),
  deleteComment: (id, userId) => request.delete(`/comments/${id}`, { params: { userId } })
}

export const favoriteApi = {
  toggleFavorite: (userId, designId) => request.post('/favorites/toggle', { userId, designId }),
  checkFavorite: (userId, designId) => request.get('/favorites/check', { params: { userId, designId } }),
  getUserFavorites: (userId) => request.get(`/favorites/user/${userId}`),
  getFavoriteCount: (designId) => request.get(`/favorites/count/${designId}`)
}

export default request
