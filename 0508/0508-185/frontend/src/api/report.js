import api from './index'

export default {
  getByDepartment(departmentId) {
    return api.get(`/reports/department/${departmentId}`)
  },
  getByQuarter(departmentId, year, quarter) {
    return api.get(`/reports/department/${departmentId}/quarter?year=${year}&quarter=${quarter}`)
  }
}
