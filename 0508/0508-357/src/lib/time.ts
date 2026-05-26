import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return dayjs(dateString).format('YYYY-MM-DD');
}

export function formatTime(dateString?: string): string {
  if (!dateString) return '-';
  return dayjs(dateString).format('HH:mm:ss');
}

export function formatDateTimeShort(dateString?: string): string {
  if (!dateString) return '-';
  return dayjs(dateString).format('MM-DD HH:mm');
}

export function formatFromNow(dateString?: string): string {
  if (!dateString) return '-';
  const now = dayjs();
  const target = dayjs(dateString);
  const diffMinutes = now.diff(target, 'minute');
  
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}小时前`;
  if (diffMinutes < 43200) return `${Math.floor(diffMinutes / 1440)}天前`;
  
  return formatDateTimeShort(dateString);
}

export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getCurrentLocalTime(): string {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}
