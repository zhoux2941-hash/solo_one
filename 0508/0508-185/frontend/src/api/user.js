import api from './index'

export default {
  getAll() {
    return api.get('/users')
  },
  getById(id) {
    return api.get(`/users/${id}`)
  },
  getByDepartment(departmentId) {
    return api.get(`/users/department/${departmentId}`)
  },
  getEmployeesByDepartment(departmentId) {
    return api.get(`/users/department/${departmentId}/employees`)
  },
  create(user) {
    return api.post('/users', user)
  }
}
