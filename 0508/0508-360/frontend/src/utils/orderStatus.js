const ORDER_STATUS = {
  PENDING_PAYMENT: {
    code: 'PENDING_PAYMENT',
    description: '待支付',
    tagType: 'warning',
    canPay: true,
    canSort: false,
    canReceive: false,
    canCancel: true
  },
  PENDING_SORTING: {
    code: 'PENDING_SORTING',
    description: '已支付',
    tagType: 'primary',
    canPay: false,
    canSort: true,
    canReceive: false,
    canCancel: true,
    sortingDescription: '待分拣'
  },
  PENDING_RECEIVE: {
    code: 'PENDING_RECEIVE',
    description: '待提货',
    tagType: 'success',
    canPay: false,
    canSort: false,
    canReceive: true,
    canCancel: false
  },
  COMPLETED: {
    code: 'COMPLETED',
    description: '已完成',
    tagType: 'info',
    canPay: false,
    canSort: false,
    canReceive: false,
    canCancel: false
  },
  CANCELLED: {
    code: 'CANCELLED',
    description: '已取消',
    tagType: 'danger',
    canPay: false,
    canSort: false,
    canReceive: false,
    canCancel: false
  }
}

export function getStatusInfo(statusCode) {
  return ORDER_STATUS[statusCode] || {
    code: statusCode,
    description: '未知状态(' + statusCode + ')',
    tagType: 'info',
    canPay: false,
    canSort: false,
    canReceive: false,
    canCancel: false
  }
}

export function getStatusDescription(statusCode) {
  return getStatusInfo(statusCode).description
}

export function getStatusTagType(statusCode) {
  return getStatusInfo(statusCode).tagType
}

export function canPay(statusCode) {
  return getStatusInfo(statusCode).canPay
}

export function canSort(statusCode) {
  return getStatusInfo(statusCode).canSort
}

export function canReceive(statusCode) {
  return getStatusInfo(statusCode).canReceive
}

export function getSortingDescription(statusCode) {
  const info = getStatusInfo(statusCode)
  return info.sortingDescription || (info.canSort ? '待分拣' : (info.canReceive ? '已分拣' : '-'))
}

export default {
  ORDER_STATUS,
  getStatusInfo,
  getStatusDescription,
  getStatusTagType,
  canPay,
  canSort,
  canReceive,
  getSortingDescription
}
