import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BambooSlip } from '../types';
import { useSlipsStore } from '../store/useSlipsStore';
import { RotateCcw } from 'lucide-react';
import { cn } from '../utils/cn';

interface BambooSlipItemProps {
  slip: BambooSlip;
  showOrderNumber?: boolean;
}

export const BambooSlipItem: React.FC<BambooSlipItemProps> = ({ slip, showOrderNumber = false }) => {
  const { selectSlip, flipSlip, selectedSlipId } = useSlipsStore();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: slip.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const isSelected = selectedSlipId === slip.id;

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      e.stopPropagation();
      selectSlip(slip.id);
    }
  };

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    flipSlip(slip.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 z-50',
        isSelected && 'z-10'
      )}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      {showOrderNumber && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-6 bg-stone-700 text-amber-100 rounded-full flex items-center justify-center text-xs font-bold z-10">
          {slip.currentIndex + 1}
        </div>
      )}
      
      <div
        className={cn(
          'relative w-12 h-96 transition-transform duration-500 preserve-3d',
          slip.isFlipped && 'rotate-y-180'
        )}
        style={{ perspective: '1000px' }}
      >
        <div
          className={cn(
            'absolute inset-0 backface-hidden rounded-sm',
            isSelected && 'ring-2 ring-red-700 ring-offset-2 ring-offset-amber-200'
          )}
          style={{ transform: slip.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          <div 
            className="w-full h-full rounded-sm shadow-lg overflow-hidden relative"
            style={{
              background: 'linear-gradient(90deg, #D4A574 0%, #C9975F 50%, #D4A574 100%)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(0,0,0,0.2)'
            }}
          >
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,90,43,0.3) 2px, rgba(139,90,43,0.3) 4px)'
              }}
            />
            
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-stone-800 bg-stone-900 shadow-inner" />
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-stone-800 bg-stone-900 shadow-inner" />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-stone-800 bg-stone-900 shadow-inner" />
            
            <div className="absolute inset-4 top-16 bottom-16 left-0 right-0 flex flex-col items-center justify-center">
              <div 
                className="text-stone-900 text-2xl font-bold writing-vertical-rl tracking-widest"
                style={{ 
                  fontFamily: "'Noto Serif SC', serif",
                  textShadow: '1px 1px 2px rgba(255,255,255,0.3)'
                }}
              >
                {slip.ancientText}
              </div>
            </div>

            <button
              onClick={handleFlip}
              className="absolute bottom-2 right-2 p-1 bg-stone-800 bg-opacity-50 rounded text-amber-100 hover:bg-opacity-70 transition-opacity z-20"
              title="翻转竹简"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <div
          className="absolute inset-0 w-full h-full rounded-sm backface-hidden"
          style={{ 
            transform: slip.isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
            backfaceVisibility: 'hidden'
          }}
        >
          <div 
            className="w-full h-full rounded-sm shadow-lg"
            style={{
              background: 'linear-gradient(90deg, #8B7355 0%, #7A6248 50%, #8B7355 100%)'
            }}
          >
            <div 
              className="absolute inset-0 opacity-40"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(90,60,30,0.4) 2px, rgba(90,60,30,0.4) 4px)'
              }}
            />
            
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-stone-800 bg-stone-900 shadow-inner" />
            <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-stone-800 bg-stone-900 shadow-inner" />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-stone-800 bg-stone-900 shadow-inner" />

            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-stone-600 text-sm">背面</span>
            </div>

            <button
              onClick={handleFlip}
              className="absolute bottom-2 right-2 p-1 bg-stone-600 bg-opacity-50 rounded text-amber-100 hover:bg-opacity-70 transition-opacity z-20"
              title="翻转竹简"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
