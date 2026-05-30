import React, { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { BambooSlipItem } from './BambooSlipItem';
import { useSlipsStore } from '../store/useSlipsStore';
import { checkAlignment, getAlignmentQuality, AlignmentResult } from '../utils/alignment';
import { CircleDot, Layers, Target, Scroll, Brain, BarChart3 } from 'lucide-react';

export const BambooWorkspace: React.FC = () => {
  const { slips, setSlips, isStarted } = useSlipsStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = slips.findIndex((s) => s.id === active.id);
      const newIndex = slips.findIndex((s) => s.id === over.id);

      const newSlips = arrayMove(slips, oldIndex, newIndex).map((slip, idx) => ({
        ...slip,
        currentIndex: idx
      }));

      setSlips(newSlips);
    }
  };

  const alignmentResults = useMemo(() => {
    return slips.map((slip, index) => {
      if (index === slips.length - 1) return null;
      return checkAlignment(slip, slips[index + 1]);
    });
  }, [slips]);

  const totalQuality = useMemo(() => {
    if (alignmentResults.length <= 1) return 0;
    const validResults = alignmentResults.filter((r): r is AlignmentResult => r !== null);
    if (validResults.length === 0) return 0;
    return validResults.reduce((sum, r) => sum + r.overallScore, 0) / validResults.length;
  }, [alignmentResults]);

  if (!isStarted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-amber-50 rounded-lg border-2 border-dashed border-amber-300">
        <div className="text-center text-amber-700">
          <div className="text-6xl mb-4">📜</div>
          <p className="text-xl font-medium">选择竹简数量并点击开始</p>
          <p className="text-sm mt-2 opacity-70">体验古代竹简编联的乐趣</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="bamboo-workspace" 
      className="flex-1 relative overflow-hidden rounded-lg bg-gradient-to-b from-amber-100 to-amber-200 p-8"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at center, transparent 0%, rgba(139,90,43,0.1) 100%)
        `
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-800 to-transparent opacity-30" />
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-amber-800 to-transparent opacity-30" />
      
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-white bg-opacity-95 rounded-xl px-4 py-3 shadow-lg border border-stone-200">
          <div className="text-xs text-stone-500 mb-2 font-medium">整体匹配度</div>
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner"
              style={{ 
                background: `conic-gradient(${getAlignmentQuality(totalQuality).color} ${totalQuality * 360}deg, #e5e7eb 0deg)` 
              }}
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <span style={{ color: getAlignmentQuality(totalQuality).color }} className="text-sm font-bold">
                  {Math.round(totalQuality * 100)}%
                </span>
              </div>
            </div>
            <div>
              <div 
                className="font-bold text-lg"
                style={{ color: getAlignmentQuality(totalQuality).color }}
              >
                {getAlignmentQuality(totalQuality).label}
              </div>
              <div className="text-xs text-stone-500">
                {slips.length - 1} 处接缝检测
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={slips.map((s) => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="relative flex items-center justify-center gap-1 min-h-full py-8 pt-24">
            <svg 
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
              style={{ top: '24px' }}
            >
              <line 
                x1="5%" 
                y1="32px" 
                x2="95%" 
                y2="32px" 
                stroke="#8B5A2B" 
                strokeWidth="3"
                strokeDasharray="8,4"
                opacity="0.6"
              />
              <line 
                x1="5%" 
                y1="50%" 
                x2="95%" 
                y2="50%" 
                stroke="#8B5A2B" 
                strokeWidth="3"
                strokeDasharray="8,4"
                opacity="0.6"
              />
              <line 
                x1="5%" 
                y1="calc(100% - 32px)" 
                x2="95%" 
                y2="calc(100% - 32px)" 
                stroke="#8B5A2B" 
                strokeWidth="3"
                strokeDasharray="8,4"
                opacity="0.6"
              />
            </svg>

            {slips.map((slip, index) => (
              <React.Fragment key={slip.id}>
                <div className="relative z-10">
                  <BambooSlipItem slip={slip} showOrderNumber />
                </div>
                {index < slips.length - 1 && alignmentResults[index] && (
                  <AlignmentIndicator result={alignmentResults[index]!} />
                )}
              </React.Fragment>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 text-sm bg-white bg-opacity-90 rounded-lg px-4 py-3 shadow-md border border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-600" />
          <span className="text-stone-700">极佳匹配</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-stone-700">部分匹配</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-stone-700">不匹配</span>
        </div>
        <div className="border-l border-stone-300 h-5 mx-1" />
        <div className="flex items-center gap-2">
          <CircleDot className="w-4 h-4 text-amber-600" />
          <span className="text-stone-700">编绳孔</span>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="text-stone-700">纹理</span>
        </div>
        <div className="flex items-center gap-2">
          <Scroll className="w-4 h-4 text-purple-600" />
          <span className="text-stone-700">字形</span>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-emerald-600" />
          <span className="text-stone-700">语义</span>
        </div>
      </div>
    </div>
  );
};

interface AlignmentIndicatorProps {
  result: AlignmentResult;
}

const AlignmentIndicator: React.FC<AlignmentIndicatorProps> = ({ result }) => {
  const quality = getAlignmentQuality(result.overallScore);
  
  const getScoreColor = (score: number, threshold: number = 0.6) => {
    if (score >= threshold + 0.15) return '#22c55e';
    if (score >= threshold) return '#84cc16';
    if (score >= threshold - 0.15) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="flex flex-col items-center gap-4 relative z-0 py-2">
      <div className="flex flex-col items-center">
        <div 
          className="w-5 h-5 rounded-full border-2 shadow-sm transition-all duration-300"
          style={{ 
            backgroundColor: getScoreColor(result.holesScore, 0.8),
            borderColor: result.holesScore >= 0.8 ? '#15803d' : '#b91c1c'
          }}
        />
        <div className="flex items-center gap-1 mt-1">
          <CircleDot className="w-3 h-3 text-amber-600" />
          <span className="text-xs text-stone-600 font-medium">
            {Math.round(result.holesScore * 100)}%
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div 
          className="w-5 h-5 rounded-full border-2 shadow-sm transition-all duration-300"
          style={{ 
            backgroundColor: getScoreColor(result.textureScore, 0.7),
            borderColor: result.textureScore >= 0.7 ? '#1d4ed8' : '#b91c1c'
          }}
        />
        <div className="flex items-center gap-1 mt-1">
          <Layers className="w-3 h-3 text-blue-600" />
          <span className="text-xs text-stone-600 font-medium">
            {Math.round(result.textureScore * 100)}%
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div 
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md transition-all duration-300"
          style={{ backgroundColor: quality.color }}
        >
          <Target className="w-4 h-4" />
        </div>
        <div className="text-xs font-bold mt-1 whitespace-nowrap" style={{ color: quality.color }}>
          {Math.round(result.overallScore * 100)}%
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div 
          className="w-5 h-5 rounded-full border-2 shadow-sm transition-all duration-300"
          style={{ 
            backgroundColor: getScoreColor(result.glyphScore, 0.5),
            borderColor: result.glyphScore >= 0.5 ? '#7c3aed' : '#b91c1c'
          }}
        />
        <div className="flex items-center gap-1 mt-1">
          <Scroll className="w-3 h-3 text-purple-600" />
          <span className="text-xs text-stone-600 font-medium">
            {Math.round(result.glyphScore * 100)}%
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div 
          className="w-5 h-5 rounded-full border-2 shadow-sm transition-all duration-300"
          style={{ 
            backgroundColor: getScoreColor(result.semanticScore, 0.5),
            borderColor: result.semanticScore >= 0.5 ? '#059669' : '#b91c1c'
          }}
        />
        <div className="flex items-center gap-1 mt-1">
          <Brain className="w-3 h-3 text-emerald-600" />
          <span className="text-xs text-stone-600 font-medium">
            {Math.round(result.semanticScore * 100)}%
          </span>
        </div>
        {result.details.matchedPairs > 0 && (
          <div className="text-xs text-emerald-600 font-medium mt-0.5">
            +{result.details.matchedPairs}词
          </div>
        )}
      </div>
    </div>
  );
};
