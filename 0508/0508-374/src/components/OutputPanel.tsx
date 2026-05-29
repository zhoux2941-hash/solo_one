interface OutputPanelProps {
  value: string;
  onPlay: () => void;
  onStop: () => void;
  isPlaying: boolean;
  mode: 'encode' | 'decode';
}

export function OutputPanel({ value, onPlay, onStop, isPlaying, mode }: OutputPanelProps) {
  const handleCopy = async () => {
    if (value) {
      await navigator.clipboard.writeText(value);
    }
  };

  return (
    <div className="bg-morse-bg/50 rounded-xl p-6 border border-morse-secondary/10">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-morse-text/70">
          {mode === 'encode' ? '摩尔斯电码' : '解码结果'}
        </label>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={!value}
            className="px-3 py-1.5 text-xs font-medium text-morse-text/70 hover:text-morse-text bg-morse-bg/50 rounded-lg border border-morse-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            复制
          </button>
          <button
            onClick={isPlaying ? onStop : onPlay}
            disabled={!value}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isPlaying
                ? 'bg-morse-error/20 text-morse-error border-morse-error/50'
                : 'bg-morse-primary/20 text-morse-primary border-morse-primary/50 hover:bg-morse-primary/30 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isPlaying ? '⏹ 停止' : '▶ 播放'}
          </button>
        </div>
      </div>
      <div className="min-h-[100px] bg-morse-bg/50 border border-morse-secondary/20 rounded-lg p-4 font-mono text-lg text-morse-secondary overflow-auto">
        {value || <span className="text-morse-text/30">等待输入...</span>}
      </div>
    </div>
  );
}
