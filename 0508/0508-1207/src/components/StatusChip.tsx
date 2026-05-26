import { Check, Clock, X, Ban } from 'lucide-react';
import type { ApplicationStatus } from '@/types';

const MAP: Record<
  ApplicationStatus,
  { label: string; color: string; icon: any }
> = {
  submitted: { label: '已提交', color: 'bg-ink-500/10 text-ink-700', icon: Clock },
  approved: { label: '已通过筛选', color: 'bg-gold-500/20 text-ink-800', icon: Check },
  rejected: { label: '未通过', color: 'bg-rose-100 text-rose-700', icon: X },
  interview: { label: '面试待定', color: 'bg-sky-100 text-sky-700', icon: Clock },
  admitted: { label: '已录取', color: 'bg-emerald-100 text-emerald-700', icon: Check },
  pending: { label: '待定', color: 'bg-amber-100 text-amber-700', icon: Clock },
  failed: { label: '未录取', color: 'bg-rose-100 text-rose-700', icon: Ban },
};

export default function StatusChip({ status }: { status: ApplicationStatus }) {
  const info = MAP[status];
  const Icon = info.icon;
  return (
    <span className={`chip ${info.color}`}>
      <Icon size={12} />
      {info.label}
    </span>
  );
}
