import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color: 'primary' | 'gold' | 'accent' | 'green' | 'blue';
  delay?: number;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
}

const colorClasses: Record<StatsCardProps['color'], {
  bg: string;
  icon: string;
  border: string;
  gradient: string;
}> = {
  primary: {
    bg: 'bg-gradient-to-br from-primary-500 to-primary-700',
    icon: 'bg-white/20',
    border: 'border-primary-400/30',
    gradient: 'from-primary-50 to-white',
  },
  gold: {
    bg: 'bg-gradient-to-br from-gold-500 to-gold-700',
    icon: 'bg-white/20',
    border: 'border-gold-400/30',
    gradient: 'from-gold-50 to-white',
  },
  accent: {
    bg: 'bg-gradient-to-br from-accent-500 to-accent-700',
    icon: 'bg-white/20',
    border: 'border-accent-400/30',
    gradient: 'from-accent-50 to-white',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    icon: 'bg-white/20',
    border: 'border-emerald-400/30',
    gradient: 'from-emerald-50 to-white',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-700',
    icon: 'bg-white/20',
    border: 'border-blue-400/30',
    gradient: 'from-blue-50 to-white',
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  delay = 0,
  trend,
}) => {
  const colors = colorClasses[color];
  
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br p-6',
        colors.border,
        colors.gradient,
        'opacity-0 animate-fade-in-up',
        `animation-delay-${delay}`
      )}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-3 rounded-lg', colors.icon)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full',
              trend.isPositive ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value).toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 font-display tracking-tight">
          {value}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>
      
      <div className={cn(
        'absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-10',
        `bg-${color}-500`
      )} />
    </div>
  );
};
