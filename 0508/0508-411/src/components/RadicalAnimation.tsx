import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { getRadicalData, getRadicalColor, getStrokeColor, hasRadicalData } from '@/data/radicalData';
import type { WubiCharacter } from '@/types';

interface RadicalAnimationProps {
  character: WubiCharacter;
}

export default function RadicalAnimation({ character }: RadicalAnimationProps) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const radicalData = getRadicalData(character.char);
  const hasData = hasRadicalData(character.char);

  const playAnimation = useCallback(() => {
    if (!radicalData) return;
    
    setIsPlaying(true);
    setHighlightedIndex(-1);
    
    const strokes = radicalData.strokes;
    let currentIndex = 0;
    
    const animate = () => {
      if (currentIndex < strokes.length) {
        setHighlightedIndex(currentIndex);
        currentIndex++;
        setTimeout(animate, 700);
      } else {
        setIsPlaying(false);
      }
    };
    
    setTimeout(animate, 300);
  }, [radicalData]);

  useEffect(() => {
    if (hasData) {
      playAnimation();
    }
  }, [character.char, hasData, playAnimation]);

  if (!hasData || !radicalData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-dark-900/30 rounded-xl border border-dark-600/50">
        <div className="text-8xl font-serif text-white mb-4">{character.char}</div>
        <p className="text-dark-400 text-sm">该汉字暂无字根动画数据</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-6">
        <svg
          viewBox={radicalData.viewBox}
          className="w-64 h-64 md:w-80 md:h-80"
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {radicalData.strokes.map((stroke, index) => {
            const isHighlighted = index <= highlightedIndex;
            const isCurrent = index === highlightedIndex;
            
            return (
              <g key={index}>
                <path
                  d={stroke.path}
                  fill={isHighlighted ? getRadicalColor(index) : 'transparent'}
                  stroke={isHighlighted ? getStrokeColor(index) : '#475569'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-500"
                  style={{
                    filter: isCurrent ? 'url(#glow)' : 'none',
                    opacity: isHighlighted ? 1 : 0.3,
                  }}
                />
                
                {isHighlighted && (
                  <text
                    x={50}
                    y={95}
                    textAnchor="middle"
                    fill={getStrokeColor(index)}
                    fontSize="10"
                    fontWeight="bold"
                    className="animate-fade-in"
                  >
                    第{index + 1}字根: {stroke.radical}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-dark-800/90 px-2 py-1 rounded-lg text-xs text-dark-300">
          <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse-slow" />
          笔画顺序
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-4">
        {character.radicals.map((radical, index) => (
          <div
            key={index}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-300
              ${index <= highlightedIndex
                ? 'bg-accent-500/10 border-accent-500 text-accent-400'
                : 'bg-dark-800/50 border-dark-600 text-dark-400'}
            `}
          >
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-dark-700 text-xs font-bold">
              {index + 1}
            </span>
            <span className="font-serif text-lg">{radical}</span>
          </div>
        ))}
      </div>

      <button
        onClick={playAnimation}
        disabled={isPlaying}
        className="flex items-center gap-2 btn-secondary"
      >
        <RefreshCw className={`w-4 h-4 ${isPlaying ? 'animate-spin' : ''}`} />
        {isPlaying ? '播放中...' : '重新播放'}
      </button>

      <div className="mt-6 w-full">
        <h4 className="text-sm font-medium text-dark-300 mb-3">字根拆解说明</h4>
        <div className="flex flex-wrap items-center gap-2 text-lg">
          {character.radicals.map((radical, index) => (
            <span key={index} className="flex items-center">
              <span className="font-serif text-2xl text-accent-400">{radical}</span>
              {index < character.radicals.length - 1 && (
                <span className="mx-2 text-dark-500">+</span>
              )}
            </span>
          ))}
          <span className="mx-2 text-dark-500">=</span>
          <span className="font-serif text-3xl text-white">{character.char}</span>
        </div>
      </div>
    </div>
  );
}
