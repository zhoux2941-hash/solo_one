interface ControlPanelProps {
  wpm: number;
  onWpmChange: (value: number) => void;
  frequency: number;
  onFrequencyChange: (value: number) => void;
}

export function ControlPanel({ wpm, onWpmChange, frequency, onFrequencyChange }: ControlPanelProps) {
  return (
    <div className="bg-morse-bg/50 rounded-xl p-6 border border-morse-primary/10">
      <h3 className="text-sm font-medium text-morse-text/70 mb-4">音频设置</h3>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-morse-text/70">播放速度</label>
            <span className="text-sm font-mono text-morse-primary">{wpm} WPM</span>
          </div>
          <input
            type="range"
            min="5"
            max="20"
            value={wpm}
            onChange={(e) => onWpmChange(Number(e.target.value))}
            className="w-full h-2 bg-morse-bg/50 rounded-lg appearance-none cursor-pointer accent-morse-primary"
          />
          <div className="flex justify-between text-xs text-morse-text/50 mt-1">
            <span>5 WPM</span>
            <span>20 WPM</span>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-morse-text/70">音调频率</label>
            <span className="text-sm font-mono text-morse-secondary">{frequency} Hz</span>
          </div>
          <input
            type="range"
            min="200"
            max="1500"
            value={frequency}
            onChange={(e) => onFrequencyChange(Number(e.target.value))}
            className="w-full h-2 bg-morse-bg/50 rounded-lg appearance-none cursor-pointer accent-morse-secondary"
          />
          <div className="flex justify-between text-xs text-morse-text/50 mt-1">
            <span>200 Hz</span>
            <span>1500 Hz</span>
          </div>
        </div>
      </div>
    </div>
  );
}
