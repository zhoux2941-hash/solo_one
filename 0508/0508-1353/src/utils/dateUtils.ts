import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd', { locale: zhCN });
}

export function formatDateTime(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
}

export function isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start && !end) return true;
  if (start && !end) return date >= startOfDay(start);
  if (!start && end) return date <= endOfDay(end);
  return isWithinInterval(date, { start: startOfDay(start!), end: endOfDay(end!) });
}

export function parseDate(dateStr: string): Date | null {
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return startOfDay(new Date(now.setDate(diff)));
}

export function getStartOfMonth(): Date {
  const now = new Date();
  return startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function getEndOfDay(): Date {
  return endOfDay(new Date());
}
