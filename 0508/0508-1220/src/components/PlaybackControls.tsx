import { useECGStore } from '@/store/ecgStore'
import { Play, Pause, FastForward, Rewind, RotateCcw } from 'lucide-react'

export default function PlaybackControls() {
  const { config, togglePlaying, setSpeed, currentTime } = useECGStore()

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeed(parseFloat(e.target.value))
  }

  const speedOptions = [0.25, 0.5, 1, 2, 4]

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
        播放控制
      </h3>

      <div className="flex items-center gap-2">
        <button
          onClick={togglePlaying}
          className="flex-1 p-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 text-white font-medium"
        >
          {config.isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              暂停
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              播放
            </>
          )}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-400">
          <span>播放速度</span>
          <span className="font-mono text-emerald-400">{config.speed}x</span>
        </div>
        <input
          type="range"
          min="0.25"
          max="4"
          step="0.25"
          value={config.speed}
          onChange={handleSpeedChange}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between gap-1">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              onClick={() => setSpeed(speed)}
              className={`flex-1 py-1 text-xs rounded transition-colors ${
                config.speed === speed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-500 font-mono text-center py-2 bg-slate-800/30 rounded">
        时间: {currentTime.toFixed(2)}s
      </div>
    </div>
  )
}
