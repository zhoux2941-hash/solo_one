import { memo, useMemo, useRef, useState, useEffect } from 'react';
import type { WordCloudData } from '../types';
import { WORD_CLOUD_COLORS } from '../utils/wordCloud';
import { Cloud, Info } from 'lucide-react';

interface WordCloudProps {
  data: WordCloudData[];
  height?: number;
}

interface PositionedWord extends WordCloudData {
  x: number;
  y: number;
  color: string;
  rotation: number;
}

export const WordCloud = memo(function WordCloud({ data, height = 350 }: WordCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [hoveredWord, setHoveredWord] = useState<PositionedWord | null>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const positionedWords = useMemo(() => {
    if (data.length === 0) return [];

    const words: PositionedWord[] = [];
    const centerX = containerWidth / 2;
    const centerY = height / 2;
    const placedRects: { x: number; y: number; width: number; height: number }[] = [];

    const checkCollision = (
      x: number,
      y: number,
      width: number,
      height: number
    ): boolean => {
      for (const rect of placedRects) {
        if (
          x < rect.x + rect.width + 8 &&
          x + width + 8 > rect.x &&
          y < rect.y + rect.height + 4 &&
          y + height + 4 > rect.y
        ) {
          return true;
        }
      }
      return false;
    };

    const sortedData = [...data].sort((a, b) => b.value - a.value);

    for (let i = 0; i < sortedData.length; i++) {
      const word = sortedData[i];
      const fontSize = word.value;
      const wordWidth = word.name.length * fontSize * 0.6;
      const wordHeight = fontSize * 1.2;
      const rotation = Math.random() > 0.7 ? (Math.random() > 0.5 ? 30 : -30) : 0;

      let placed = false;
      let angle = 0;
      let radius = 0;
      const maxRadius = Math.min(centerX, centerY) - 20;

      while (!placed && radius < maxRadius) {
        const x = centerX + radius * Math.cos(angle) - wordWidth / 2;
        const y = centerY + radius * Math.sin(angle) - wordHeight / 2;

        if (
          x > 10 &&
          x + wordWidth < containerWidth - 10 &&
          y > 10 &&
          y + wordHeight < height - 10 &&
          !checkCollision(x, y, wordWidth, wordHeight)
        ) {
          words.push({
            ...word,
            x,
            y,
            color: WORD_CLOUD_COLORS[i % WORD_CLOUD_COLORS.length],
            rotation,
          });
          placedRects.push({ x, y, width: wordWidth, height: wordHeight });
          placed = true;
        }

        angle += 0.3;
        if (angle > Math.PI * 2) {
          angle = 0;
          radius += 8;
        }
      }
    }

    return words;
  }, [data, containerWidth, height]);

  if (data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-dark-500"
        style={{ height }}
      >
        <Cloud size={48} className="mb-4 opacity-30" />
        <p>暂无词云数据</p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{ height }}
      >
        <svg width="100%" height="100%" className="overflow-visible">
          {positionedWords.map((word, index) => (
            <text
              key={`${word.name}-${index}`}
              x={word.x + word.name.length * word.value * 0.3}
              y={word.y + word.value * 0.6}
              fontSize={word.value}
              fill={word.color}
              fontFamily="Sora, ui-sans-serif, system-ui"
              fontWeight={word.value > 40 ? 700 : word.value > 25 ? 600 : 400}
              textAnchor="middle"
              dominantBaseline="middle"
              className="cursor-pointer transition-all duration-300 hover:opacity-80"
              style={{
                transform: `rotate(${word.rotation}deg)`,
                transformOrigin: 'center',
              }}
              onMouseEnter={() => setHoveredWord(word)}
              onMouseLeave={() => setHoveredWord(null)}
            >
              {word.name}
            </text>
          ))}
        </svg>

        {hoveredWord && (
          <div
            className="absolute z-10 px-3 py-2 bg-dark-800 border border-primary-500/30 rounded-lg shadow-lg pointer-events-none"
            style={{
              left: Math.min(hoveredWord.x, containerWidth - 150),
              top: hoveredWord.y + hoveredWord.value + 10,
            }}
          >
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: hoveredWord.color }} className="font-semibold">
                {hoveredWord.name}
              </span>
              <span className="text-dark-400">出现</span>
              <span className="text-primary-400 font-mono font-bold">
                {Math.round((hoveredWord.value - 12) / 50 * 50 + 1)}
              </span>
              <span className="text-dark-400">次</span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-dark-500">
        <Info size={12} />
        <span>字体大小代表出现频率</span>
      </div>
    </div>
  );
});
