import { useFractalStore } from '../store/fractalStore';

export function ProgressBar() {
  const { renderProgress } = useFractalStore();
  const { percentage, isRendering } = renderProgress;

  if (!isRendering && percentage >= 100) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-100 ease-out"
        style={{ width: `${percentage}%` }}
      />
      {isRendering && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      )}
    </div>
  );
}
