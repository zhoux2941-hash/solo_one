import GameCanvas from '@/components/GameCanvas';
import WindIndicator from '@/components/WindIndicator';
import PowerIndicator from '@/components/PowerIndicator';
import ScoreBoard from '@/components/ScoreBoard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-amber-500 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-blue-500 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-red-500/30 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        <header className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              萨仁靶
            </span>
          </h1>
          <p className="text-amber-200/80 text-lg">
            蒙古族传统射箭模拟游戏
          </p>
          <div className="flex items-center justify-center gap-6 mt-3 text-sm text-amber-400/70">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-white border border-slate-400" />
              白环 2分
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              绿环 4分
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              蓝环 6分
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              黄环 8分
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              红心 10分
            </span>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          <div className="flex flex-col gap-4 order-2 lg:order-1">
            <PowerIndicator />
            <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-2 border-amber-500/50 rounded-xl p-4 shadow-xl">
              <h3 className="text-amber-300 font-bold mb-2 text-sm">操作说明</h3>
              <ul className="text-amber-200/70 text-xs space-y-1">
                <li>• 按住鼠标左键拖拽拉弓</li>
                <li>• 向后拖拽越远，力度越大</li>
                <li>• 松开鼠标射出箭矢</li>
                <li>• 注意风向对箭的影响</li>
                <li>• 每轮3箭，争取高分！</li>
              </ul>
            </div>
          </div>

          <div className="order-1 lg:order-2 w-full max-w-[1100px]">
            <GameCanvas />
          </div>

          <div className="flex flex-col gap-4 order-3">
            <WindIndicator />
            <ScoreBoard />
          </div>
        </div>

        <footer className="text-center mt-8 text-amber-400/50 text-sm">
          <p>按住鼠标向反方向拖拽拉弓，瞄准靶心，松手射箭！</p>
        </footer>
      </div>
    </div>
  );
}
