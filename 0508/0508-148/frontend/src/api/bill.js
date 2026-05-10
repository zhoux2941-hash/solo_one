import request from '@/utils/request'

export const createBill = (data) => {
  return request.post('/bills', data)
}

export const getDormBills = () => {
  return request.get('/bills')
}

export const getBillDetail = (billId) => {
  return request.get(`/bills/${billId}`)
}

export const payBill = (billId) => {
  return request.post(`/bills/${billId}/pay`)
}

export const getUnpaidList = () => {
  return request.get('/bills/unpaid')
}

export const getMyBills = () => {
  return request.get('/bills/my')
}

export const getMonthlyTrend = () => {
  return request.get('/bills/trend')
}
