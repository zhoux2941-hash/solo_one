import api from './index'

export default {
  getAll() {
    return api.get('/departments')
  },
  getById(id) {
    return api.get(`/departments/${id}`)
  },
  create(dept) {
    return api.post('/departments', dept)
  }
}
