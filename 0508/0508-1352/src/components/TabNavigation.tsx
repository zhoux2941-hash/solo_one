import React from 'react';
import { Star, TrendingDown, AlertTriangle } from 'lucide-react';
import type { TabType } from '@/types';
import { cn } from '@/utils';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  counts: {
    star: number;
    slow: number;
    problem: number;
  };
}

const tabs: { id: TabType; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'star', label: '明星菜品', icon: Star, color: 'text-gold-600' },
  { id: 'slow', label: '滞销菜品', icon: TrendingDown, color: 'text-gray-500' },
  { id: 'problem', label: '问题菜品', icon: AlertTriangle, color: 'text-accent-500' },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-8" role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 pb-4 px-1 font-medium transition-all duration-200',
                isActive ? 'tab-active' : 'tab-inactive'
              )}
            >
              <Icon className={cn('w-5 h-5', tab.color)} />
              <span>{tab.label}</span>
              <span className={cn(
                'text-sm px-2 py-0.5 rounded-full',
                isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
              )}>
                {counts[tab.id]}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
