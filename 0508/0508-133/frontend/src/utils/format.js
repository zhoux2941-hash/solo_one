import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

export const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss')
}

export const formatDate = (dateTime) => {
  if (!dateTime) return '-'
  return dayjs(dateTime).format('YYYY-MM-DD')
}

export const formatTime = (dateTime) => {
  if (!dateTime) return '-'
  return dayjs(dateTime).format('HH:mm:ss')
}

export const formatDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '-'
  const start = dayjs(startTime)
  const end = dayjs(endTime)
  const minutes = end.diff(start, 'minute')
  const seconds = end.diff(start, 'second') % 60
  
  if (minutes > 0) {
    return `${minutes}分${seconds}秒`
  }
  return `${seconds}秒`
}

export const getDurationMinutes = (startTime, endTime) => {
  if (!startTime || !endTime) return 0
  const start = dayjs(startTime)
  const end = dayjs(endTime)
  return end.diff(start, 'second') / 60
}
