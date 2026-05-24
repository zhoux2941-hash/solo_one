import { format, differenceInMinutes, addMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatTime = (date: string | Date, fmt: string = 'HH:mm'): string => {
  return format(new Date(date), fmt, { locale: zhCN });
};

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'MM-dd HH:mm', { locale: zhCN });
};

export const getDuration = (start: string | Date, end: string | Date): number => {
  return differenceInMinutes(new Date(end), new Date(start));
};

export const calculatePosition = (
  time: string | Date,
  startTime: Date,
  endTime: Date,
  containerWidth: number
): number => {
  const totalMs = endTime.getTime() - startTime.getTime();
  const offsetMs = new Date(time).getTime() - startTime.getTime();
  return (offsetMs / totalMs) * containerWidth;
};

export const calculateWidth = (
  startTime: string | Date,
  endTime: string | Date,
  timelineStart: Date,
  timelineEnd: Date,
  containerWidth: number
): number => {
  const totalMs = timelineEnd.getTime() - timelineStart.getTime();
  const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
  return (durationMs / totalMs) * containerWidth;
};

export const addMinutesToTime = (time: string | Date, minutes: number): Date => {
  return addMinutes(new Date(time), minutes);
};

export const getPhaseColor = (phase: string): string => {
  const colors: Record<string, string> = {
    depart: '#3B82F6',
    approach: '#8B5CF6',
    berth: '#10B981',
    unberth: '#F59E0B',
    return: '#6B7280'
  };
  return colors[phase] || '#6B7280';
};

export const getPhaseLabel = (phase: string): string => {
  const labels: Record<string, string> = {
    depart: '出发',
    approach: '接近',
    berth: '靠泊',
    unberth: '离泊',
    return: '返航'
  };
  return labels[phase] || phase;
};

export const getTypeLabel = (type: string): string => {
  return type === 'berthing' ? '靠泊' : '离泊';
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    idle: '#10B981',
    busy: '#F59E0B',
    maintenance: '#EF4444'
  };
  return colors[status] || '#6B7280';
};
