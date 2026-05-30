import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PeriodNavButtonsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onPrev: () => void;
  onNext: () => void;
  currentPeriodName: string;
}

export function PeriodNavButtons({ 
  canGoBack, 
  canGoForward, 
  onPrev, 
  onNext,
  currentPeriodName 
}: PeriodNavButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-6 py-4">
      <button
        onClick={onPrev}
        disabled={!canGoBack}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
          canGoBack
            ? 'bg-gradient-to-r from-stone-700 to-stone-800 text-white hover:from-stone-600 hover:to-stone-700 shadow-lg hover:shadow-xl active:scale-95'
            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
        }`}
      >
        <ChevronLeft size={20} />
        <span>上一个时期</span>
      </button>
      
      <div className="px-6 py-2 bg-amber-100 rounded-full">
        <span className="text-amber-800 font-bold text-lg" style={{ fontFamily: 'serif' }}>
          {currentPeriodName}
        </span>
      </div>
      
      <button
        onClick={onNext}
        disabled={!canGoForward}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
          canGoForward
            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-500 hover:to-amber-600 shadow-lg hover:shadow-xl active:scale-95'
            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
        }`}
      >
        <span>下一个时期</span>
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
