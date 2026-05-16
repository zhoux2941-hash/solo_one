import api from './index'

export default {
  getByDepartment(departmentId) {
    return api.get(`/bonus-pools/department/${departmentId}`)
  },
  getById(id) {
    return api.get(`/bonus-pools/${id}`)
  },
  create(pool) {
    return api.post('/bonus-pools', pool)
  },
  updateStatus(id, status) {
    return api.put(`/bonus-pools/${id}/status?status=${status}`)
  }
}
