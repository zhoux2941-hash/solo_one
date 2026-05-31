import { useGameStore } from '@/store/gameStore';
import { useAudio } from '@/hooks/useAudio';
import { Play, Pause, RotateCcw, Music, SlidersHorizontal, Gauge } from 'lucide-react';
import { JUDGE_OFFSET_MIN, JUDGE_OFFSET_MAX, NOTE_SPEED_MIN, NOTE_SPEED_MAX, NOTE_SPEED_DEFAULT, BPM } from '@/constants/game';

export default function ControlPanel() {
  const {
    isPlaying,
    isPaused,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    judgeOffset,
    setJudgeOffset,
    noteSpeed,
    setNoteSpeed,
  } = useGameStore();
  const { initAudioContext } = useAudio();

  const handleStart = () => {
    initAudioContext();
    startGame();
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  };

  const handleReset = () => {
    resetGame();
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <Music className="w-5 h-5 text-pink-400" />
          <span className="text-slate-400 text-sm uppercase tracking-wider">Controls</span>
        </div>

        <div className="flex flex-col gap-3">
          {!isPlaying ? (
            <button
              onClick={handleStart}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
              style={{
                boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)',
              }}
            >
              <Play className="w-5 h-5" />
              开始游戏
            </button>
          ) : (
            <button
              onClick={handlePauseResume}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
              style={{
                boxShadow: '0 0 30px rgba(6, 182, 212, 0.4)',
              }}
            >
              {isPaused ? (
                <>
                  <Play className="w-5 h-5" />
                  继续
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5" />
                  暂停
                </>
              )}
            </button>
          )}

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-all duration-200 border border-slate-600 hover:border-slate-500"
          >
            <RotateCcw className="w-4 h-4" />
            重新开始
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
        <div className="flex items-center gap-3 mb-4">
          <SlidersHorizontal className="w-5 h-5 text-orange-400" />
          <span className="text-slate-400 text-sm uppercase tracking-wider">判定偏移校准</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-xs">{JUDGE_OFFSET_MIN}ms</span>
          <span
            className="font-bold text-orange-400 text-lg"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {judgeOffset > 0 ? `+${judgeOffset}` : judgeOffset}ms
          </span>
          <span className="text-slate-500 text-xs">+{JUDGE_OFFSET_MAX}ms</span>
        </div>
        <input
          type="range"
          min={JUDGE_OFFSET_MIN}
          max={JUDGE_OFFSET_MAX}
          step={5}
          value={judgeOffset}
          onChange={(e) => setJudgeOffset(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
        <div className="mt-2 flex justify-between">
          <span className="text-slate-600 text-xs">提前</span>
          <button
            onClick={() => setJudgeOffset(0)}
            className="text-orange-400/70 hover:text-orange-400 text-xs transition-colors"
          >
            重置为0
          </button>
          <span className="text-slate-600 text-xs">延后</span>
        </div>
        <p className="text-slate-600 text-xs mt-3 leading-relaxed">
          正值延后判定时机，负值提前判定时机。若感觉按键总是偏早，调大正值；若总是偏晚，调小负值。
        </p>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20">
        <div className="flex items-center gap-3 mb-4">
          <Gauge className="w-5 h-5 text-emerald-400" />
          <span className="text-slate-400 text-sm uppercase tracking-wider">下落速度</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-xs">{NOTE_SPEED_MIN}</span>
          <span
            className="font-bold text-emerald-400 text-lg"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            {noteSpeed}
          </span>
          <span className="text-slate-500 text-xs">{NOTE_SPEED_MAX}</span>
        </div>
        <input
          type="range"
          min={NOTE_SPEED_MIN}
          max={NOTE_SPEED_MAX}
          step={20}
          value={noteSpeed}
          onChange={(e) => setNoteSpeed(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="mt-2 flex justify-between">
          <span className="text-slate-600 text-xs">慢速</span>
          <button
            onClick={() => setNoteSpeed(NOTE_SPEED_DEFAULT)}
            className="text-emerald-400/70 hover:text-emerald-400 text-xs transition-colors"
          >
            重置默认
          </button>
          <span className="text-slate-600 text-xs">快速</span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-slate-500 text-xs">BPM:</span>
          <span className="text-emerald-400/70 text-xs font-mono">{BPM}</span>
          <span className="text-slate-600 text-xs">× 速度独立调节</span>
        </div>
        <p className="text-slate-600 text-xs mt-2 leading-relaxed">
          调节音符下落快慢，与BPM节拍完全独立。低速下也能体验高BPM节奏。
        </p>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/20">
        <h3 className="text-cyan-400 font-semibold mb-3">操作说明</h3>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full" />
            按 <kbd className="px-2 py-0.5 bg-slate-800 rounded text-xs font-mono">空格</kbd> 键判定
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full" />
            或点击游戏画面判定
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full" />
            Perfect: ±30ms (+100分)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-400 rounded-full" />
            Good: ±80ms (+50分)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-pink-400 rounded-full" />
            Miss: 超出范围 (连击中断)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full" />
            连击≥10: 得分×2
          </li>
        </ul>
      </div>
    </div>
  );
}
