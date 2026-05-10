export const PositionType = {
  TICKET_CHECKING: { value: 'TICKET_CHECKING', label: '检票' },
  GUIDE: { value: 'GUIDE', label: '引导' },
  STAGE_ASSIST: { value: 'STAGE_ASSIST', label: '舞台协助' },
  LOGISTICS: { value: 'LOGISTICS', label: '后勤' },
  SECURITY: { value: 'SECURITY', label: '安保' },
  FIRST_AID: { value: 'FIRST_AID', label: '急救' },
  OTHER: { value: 'OTHER', label: '其他' }
}

export const PositionStatus = {
  ACTIVE: { value: 'ACTIVE', label: '招募中', type: 'success' },
  FULL: { value: 'FULL', label: '已满员', type: 'warning' },
  INACTIVE: { value: 'INACTIVE', label: '已停止', type: 'info' }
}

export const ApplicationStatus = {
  PENDING: { value: 'PENDING', label: '待审核', type: 'warning' },
  APPROVED: { value: 'APPROVED', label: '已通过', type: 'success' },
  REJECTED: { value: 'REJECTED', label: '已拒绝', type: 'danger' },
  ASSIGNED: { value: 'ASSIGNED', label: '已分配', type: 'primary' }
}

export const ScheduleStatus = {
  PENDING: { value: 'PENDING', label: '待签到', type: 'warning' },
  CHECKED_IN: { value: 'CHECKED_IN', label: '已签到', type: 'success' },
  COMPLETED: { value: 'COMPLETED', label: '已完成', type: 'primary' },
  CANCELLED: { value: 'CANCELLED', label: '已取消', type: 'info' }
}

export const CheckInMethod = {
  CODE: { value: 'CODE', label: '签到码' },
  GPS: { value: 'GPS', label: 'GPS定位' },
  MANUAL: { value: 'MANUAL', label: '手动签到' }
}

export const UserRole = {
  VOLUNTEER: { value: 'VOLUNTEER', label: '志愿者' },
  LEADER: { value: 'LEADER', label: '组长' },
  ADMIN: { value: 'ADMIN', label: '管理员' }
}

export const positionTypeOptions = Object.values(PositionType).map(item => ({
  value: item.value,
  label: item.label
}))

export const applicationStatusOptions = Object.values(ApplicationStatus).map(item => ({
  value: item.value,
  label: item.label
}))

export function getPositionTypeLabel(type) {
  return PositionType[type]?.label || type
}

export function getPositionStatusLabel(status) {
  return PositionStatus[status]?.label || status
}

export function getApplicationStatusLabel(status) {
  return ApplicationStatus[status]?.label || status
}

export function getScheduleStatusLabel(status) {
  return ScheduleStatus[status]?.label || status
}

export function getCheckInMethodLabel(method) {
  return CheckInMethod[method]?.label || method
}

export function getRoleLabel(role) {
  return UserRole[role]?.label || role
}
