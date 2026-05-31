import { useEffect, useRef } from 'react';
import WordCloud from 'wordcloud';
import type { WordCount } from '../types';

interface WordCloudProps {
  words: WordCount[];
}

const COLORS = [
  '#FB7299',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
];

const EMOJI_RANGES = [
  [0x1f300, 0x1f5ff],
  [0x1f600, 0x1f64f],
  [0x1f680, 0x1f6ff],
  [0x1f900, 0x1f9ff],
  [0x1fa70, 0x1faff],
  [0x2600, 0x26ff],
  [0x2700, 0x27bf],
  [0x1f1e6, 0x1f1ff],
  [0x1f200, 0x1f2ff],
  [0x2b00, 0x2bff],
  [0x2300, 0x23ff],
];

function isEmojiWord(word: string): boolean {
  const code = word.codePointAt(0);
  if (code === undefined) return false;
  return EMOJI_RANGES.some(([start, end]) => code >= start && code <= end);
}

export default function WordCloudComponent({ words }: WordCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || words.length === 0) return;

    const maxCount = Math.max(...words.map((w) => w.count));
    const minCount = Math.min(...words.map((w) => w.count));

    const wordList: [string, number][] = words.map((w) => {
      const normalizedSize =
        minCount === maxCount
          ? 40
          : 20 + ((w.count - minCount) / (maxCount - minCount)) * 40;
      return [w.word, normalizedSize];
    });

    WordCloud(canvasRef.current, {
      list: wordList,
      gridSize: 8,
      weightFactor: 1.2,
      fontFamily: ((word: string) => {
        if (isEmojiWord(word)) {
          return '"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
        }
        return '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif';
      }) as unknown as string,
      color: ((word: string) => {
        if (isEmojiWord(word)) return '#333333';
        return COLORS[Math.floor(Math.random() * COLORS.length)];
      }) as unknown as string,
      rotateRatio: 0.3,
      rotationSteps: 2,
      backgroundColor: 'transparent',
      shuffle: true,
      drawOutOfBound: false,
    });
  }, [words]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
        弹幕词云
      </h3>
      <div
        ref={containerRef}
        className="flex items-center justify-center w-full h-80"
      >
        <canvas ref={canvasRef} width={500} height={300} />
      </div>
    </div>
  );
}
