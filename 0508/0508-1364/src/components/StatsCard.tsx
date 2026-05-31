import { memo, type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'primary' | 'accent' | 'success' | 'warning';
  delay?: number;
}

const colorClasses = {
  primary: 'from-primary-500/20 to-primary-600/5 border-primary-500/30',
  accent: 'from-accent-500/20 to-accent-600/5 border-accent-500/30',
  success: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
  warning: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
};

const iconColorClasses = {
  primary: 'text-primary-400',
  accent: 'text-accent-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
};

export const StatsCard = memo(function StatsCard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  delay = 0,
}: StatsCardProps) {
  return (
    <div
      className={`glass glass-hover rounded-2xl p-6 bg-gradient-to-br ${colorClasses[color]} opacity-0 animate-fade-in-up animate-fill-forwards`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-dark-400 mb-2 font-medium">{title}</p>
          <p className="text-3xl font-bold font-mono text-white mb-2">
            {value}
          </p>
          {trend && (
            <div className={`flex items-center gap-1.5 text-sm ${trend.isPositive ? 'text-emerald-400' : 'text-accent-400'}`}>
              {trend.isPositive ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              <span className="font-medium">{trend.value}%</span>
              <span className="text-dark-500">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-dark-900/50 ${iconColorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
});
