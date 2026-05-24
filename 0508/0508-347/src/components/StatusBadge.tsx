import {
  getSpecimenStatusLabel,
  getSpecimenStatusColor,
  getSealStatusLabel,
  getSealStatusColor,
  getDiffStatusLabel,
  getDiffStatusColor,
  getConditionLabel,
  getConditionColor,
} from '../utils/format';
import type { SpecimenStatus, SealStatus, DiffStatus, ItemCondition } from '../../shared/types';

interface StatusBadgeProps {
  type: 'specimen' | 'seal' | 'diff' | 'condition';
  status: SpecimenStatus | SealStatus | DiffStatus | ItemCondition;
}

export default function StatusBadge({ type, status }: StatusBadgeProps) {
  let label: string;
  let colorClass: string;

  switch (type) {
    case 'specimen':
      label = getSpecimenStatusLabel(status as SpecimenStatus);
      colorClass = getSpecimenStatusColor(status as SpecimenStatus);
      break;
    case 'seal':
      label = getSealStatusLabel(status as SealStatus);
      colorClass = getSealStatusColor(status as SealStatus);
      break;
    case 'diff':
      label = getDiffStatusLabel(status as DiffStatus);
      colorClass = getDiffStatusColor(status as DiffStatus);
      break;
    case 'condition':
      label = getConditionLabel(status as ItemCondition);
      colorClass = getConditionColor(status as ItemCondition);
      break;
    default:
      label = String(status);
      colorClass = 'bg-gray-100 text-gray-700';
  }

  return (
    <span className={`status-badge ${colorClass}`}>
      {label}
    </span>
  );
}
