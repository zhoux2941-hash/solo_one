import React from 'react';
import { ChefHat, Search } from 'lucide-react';
import type { DishStats, TabType } from '@/types';
import { DishCard } from './DishCard';
import { cn } from '@/utils';

interface DishListProps {
  dishes: DishStats[];
  tabType: TabType;
  onDishClick: (dish: DishStats) => void;
}

const emptyMessages: Record<TabType, { title: string; description: string }> = {
  star: {
    title: '暂无明星菜品',
    description: '销量数据不足，无法确定明星菜品',
  },
  slow: {
    title: '暂无滞销菜品',
    description: '所有菜品销售表现良好',
  },
  problem: {
    title: '暂无问题菜品',
    description: '所有菜品毛利率均高于20%',
  },
};

export const DishList: React.FC<DishListProps> = ({ dishes, tabType, onDishClick }) => {
  if (dishes.length === 0) {
    const message = emptyMessages[tabType];
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Search className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{message.title}</h3>
        <p className="text-gray-500 text-center max-w-md">{message.description}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {dishes.map((dish, index) => (
        <div
          key={dish.dishName}
          className={cn(
            'opacity-0 animate-fade-in-up',
            `animation-delay-${Math.min(index % 4, 3) * 100}`
          )}
        >
          <DishCard
            dish={dish}
            rank={index + 1}
            tabType={tabType}
            onClick={() => onDishClick(dish)}
          />
        </div>
      ))}
    </div>
  );
};
