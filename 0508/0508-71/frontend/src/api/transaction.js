import request from '@/utils/request'

export function withdraw(amount) {
  return request.post('/transaction/withdraw', null, {
    params: { amount }
  })
}

export function getMyTransactions() {
  return request.get('/transaction/my')
}
