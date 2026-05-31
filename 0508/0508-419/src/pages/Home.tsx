import GameCanvas from '@/components/GameCanvas';
import ScorePanel from '@/components/ScorePanel';
import ControlPanel from '@/components/ControlPanel';
import { BPM } from '@/constants/game';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4">
      <div className="text-center mb-8">
        <h1
          className="text-5xl md:text-6xl font-black mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          RHYTHM GAME
        </h1>
        <p className="text-slate-400 text-lg">
          音乐节奏模拟 · BPM {BPM} · 按下空格或点击屏幕
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-start justify-center gap-8 w-full max-w-6xl">
        <div className="order-2 lg:order-1 w-full lg:w-auto">
          <ScorePanel />
        </div>

        <div className="order-1 lg:order-2 flex justify-center w-full lg:w-auto">
          <GameCanvas />
        </div>

        <div className="order-3 w-full lg:w-auto">
          <ControlPanel />
        </div>
      </div>

      <div className="mt-8 text-center text-slate-500 text-sm">
        <p>提示：音符下落到判定线时按下空格键或点击屏幕</p>
        <p className="mt-1">连击达到10次可获得双倍得分！</p>
      </div>
    </div>
  );
}
