import type { SpecimenStatus, SealStatus, DiffStatus, ItemCondition, Position } from '../../shared/types';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatPosition = (pos: Position): string => {
  return `${pos.row}行${pos.col}列`;
};

export const getSpecimenStatusLabel = (status: SpecimenStatus): string => {
  const labels: Record<SpecimenStatus, string> = {
    'in-storage': '在库',
    'lent-out': '已借出',
    'in-transit': '运输中',
    'returned': '已返馆',
    'verified': '已核对',
  };
  return labels[status];
};

export const getSpecimenStatusColor = (status: SpecimenStatus): string => {
  const colors: Record<SpecimenStatus, string> = {
    'in-storage': 'bg-forest-100 text-forest-700',
    'lent-out': 'bg-amber-100 text-amber-700',
    'in-transit': 'bg-museum-100 text-museum-700',
    'returned': 'bg-blue-100 text-blue-700',
    'verified': 'bg-forest-100 text-forest-700',
  };
  return colors[status];
};

export const getSealStatusLabel = (status: SealStatus): string => {
  const labels: Record<SealStatus, string> = {
    sealed: '已封箱',
    'in-transit': '运输中',
    unsealed: '已解封',
  };
  return labels[status];
};

export const getSealStatusColor = (status: SealStatus): string => {
  const colors: Record<SealStatus, string> = {
    sealed: 'bg-museum-100 text-museum-700',
    'in-transit': 'bg-amber-100 text-amber-700',
    unsealed: 'bg-forest-100 text-forest-700',
  };
  return colors[status];
};

export const getDiffStatusLabel = (status: DiffStatus): string => {
  const labels: Record<DiffStatus, string> = {
    pending: '待处理',
    resolved: '已解决',
    approved: '已批准',
  };
  return labels[status];
};

export const getDiffStatusColor = (status: DiffStatus): string => {
  const colors: Record<DiffStatus, string> = {
    pending: 'bg-red-100 text-red-700',
    resolved: 'bg-amber-100 text-amber-700',
    approved: 'bg-forest-100 text-forest-700',
  };
  return colors[status];
};

export const getConditionLabel = (condition: ItemCondition): string => {
  const labels: Record<ItemCondition, string> = {
    good: '完好',
    damaged: '有破损',
    'needs-repair': '需修复',
  };
  return labels[condition];
};

export const getConditionColor = (condition: ItemCondition): string => {
  const colors: Record<ItemCondition, string> = {
    good: 'bg-forest-100 text-forest-700',
    damaged: 'bg-red-100 text-red-700',
    'needs-repair': 'bg-amber-100 text-amber-700',
  };
  return colors[condition];
};

export const positionsMatch = (pos1?: Position, pos2?: Position): boolean => {
  if (!pos1 || !pos2) return false;
  return pos1.row === pos2.row && pos1.col === pos2.col;
};
