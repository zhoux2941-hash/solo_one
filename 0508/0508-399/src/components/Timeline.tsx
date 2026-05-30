import React, { useRef } from 'react';
import type { Period } from '../types';

interface TimelineProps {
  periods: Period[];
  currentPeriodId: string;
  onPeriodChange: (periodId: string) => void;
}

export function Timeline({ periods, currentPeriodId, onPeriodChange }: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = (periodId: string, index: number) => {
    onPeriodChange(periodId);
    if (scrollRef.current) {
      const nodes = scrollRef.current.querySelectorAll('.timeline-node');
      const targetNode = nodes[index] as HTMLElement;
      if (targetNode) {
        targetNode.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  };

  return (
    <div className="relative w-full py-8">
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-800 transform -translate-y-1/2 opacity-30" />
      
      <div 
        ref={scrollRef}
        className="relative flex gap-16 px-8 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {periods.map((period, index) => {
          const isActive = currentPeriodId === period.id;
          return (
            <div
              key={period.id}
              className="timeline-node flex flex-col items-center cursor-pointer flex-shrink-0 group"
              onClick={() => handleNodeClick(period.id, index)}
            >
              <div className={`relative mb-4 transition-all duration-500 ${isActive ? 'scale-125' : 'scale-100'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-500 ${
                  isActive 
                    ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/50 ring-4 ring-amber-300/50' 
                    : 'bg-gradient-to-br from-stone-600 to-stone-800 text-stone-300 group-hover:from-stone-500 group-hover:to-stone-700'
                }`}>
                  {period.name.charAt(0)}
                </div>
                {isActive && (
                  <div className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-20" />
                )}
              </div>
              
              <span className={`text-lg font-bold transition-all duration-300 whitespace-nowrap ${
                isActive ? 'text-amber-700 scale-110' : 'text-stone-600 group-hover:text-stone-800'
              }`}>
                {period.name}
              </span>
              
              <span className={`text-xs transition-all duration-300 whitespace-nowrap ${
                isActive ? 'text-amber-600' : 'text-stone-400'
              }`}>
                {period.yearRange}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="absolute top-1/2 left-0 w-12 h-12 bg-gradient-to-r from-stone-100 to-transparent transform -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-12 h-12 bg-gradient-to-l from-stone-100 to-transparent transform -translate-y-1/2 pointer-events-none" />
    </div>
  );
}
