import { useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import { formatTime } from '@/utils/audio';
import { useSpectrum } from '@/hooks/useSpectrum';

interface AudioPlayerProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onRestart: () => void;
  songTitle: string;
  highAnalyser: AnalyserNode | null;
  lowAnalyser: AnalyserNode | null;
}

export const AudioPlayer = ({
  isPlaying,
  currentTime,
  duration,
  isLoading,
  onTogglePlay,
  onSeek,
  onRestart,
  songTitle,
  highAnalyser,
  lowAnalyser,
}: AudioPlayerProps) => {
  const highCanvasRef = useRef<HTMLCanvasElement>(null);
  const lowCanvasRef = useRef<HTMLCanvasElement>(null);

  const { startAnimation: startHighSpectrum, stopAnimation: stopHighSpectrum } = useSpectrum({
    analyser: highAnalyser,
    canvasRef: highCanvasRef,
    type: 'bars',
    color: '#3F63A1',
    backgroundColor: '#F5F0E8',
  });

  const { startAnimation: startLowSpectrum, stopAnimation: stopLowSpectrum } = useSpectrum({
    analyser: lowAnalyser,
    canvasRef: lowCanvasRef,
    type: 'bars',
    color: '#A88B5A',
    backgroundColor: '#F5F0E8',
  });

  useEffect(() => {
    if (isPlaying && highAnalyser) {
      startHighSpectrum();
    } else {
      stopHighSpectrum();
    }
    if (isPlaying && lowAnalyser) {
      startLowSpectrum();
    } else {
      stopLowSpectrum();
    }
  }, [isPlaying, highAnalyser, lowAnalyser, startHighSpectrum, stopHighSpectrum, startLowSpectrum, stopLowSpectrum]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-wood-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-primary-600">{songTitle}</h3>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            加载中...
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg ${isPlaying ? 'animate-spin-slow' : ''}`}>
          <div className="w-16 h-16 rounded-full bg-heritage-bg flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary-600"></div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="text-sm text-gray-500">高音部频谱</div>
          <canvas
            ref={highCanvasRef}
            width={400}
            height={40}
            className="w-full h-10 rounded-lg bg-heritage-bg"
          />
          <div className="text-sm text-gray-500">低音部频谱</div>
          <canvas
            ref={lowCanvasRef}
            width={400}
            height={40}
            className="w-full h-10 rounded-lg bg-heritage-bg"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div
          className="relative h-2 bg-gray-200 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
        >
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-mono text-gray-500">
            {formatTime(currentTime)}
          </span>
          <span className="text-sm font-mono text-gray-500">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={onRestart}
          disabled={isLoading}
          className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <RotateCcw size={20} />
        </button>

        <button
          onClick={onTogglePlay}
          disabled={isLoading}
          className="p-5 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 active:scale-95"
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
        </button>

        <div className="w-[52px]"></div>
      </div>
    </div>
  );
};
