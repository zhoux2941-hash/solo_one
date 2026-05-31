export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

export function formatWeekLabel(date: Date): string {
  const weekStart = getWeekStart(date);
  const month = weekStart.getMonth() + 1;
  const day = weekStart.getDate();
  return `${month}/${day}`;
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateInput(date: Date | null): string {
  if (!date) return '';
  return formatDate(date);
}

export function parseDateInput(dateStr: string): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function getWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export function getHour(date: Date): number {
  return date.getHours();
}

export function isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (start && date < start) return false;
  if (end) {
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);
    if (date > endOfDay) return false;
  }
  return true;
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toLocaleString();
}

export function getDaysDiff(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatTimeSpan(days: number): string {
  if (days < 7) {
    return `${days} 天`;
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} 周`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} 个月`;
  }
  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  return remainingMonths > 0 ? `${years} 年 ${remainingMonths} 个月` : `${years} 年`;
}
