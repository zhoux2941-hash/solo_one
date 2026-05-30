import React, { useRef } from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { ScorePanel } from './ScorePanel';
import { HistoryPanel } from './HistoryPanel';
import { Controls } from './Controls';
import { LAYOUT } from '@/constants/config';
import { Sparkles } from 'lucide-react';

export const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gameState, scores, lastScore, resetGame } = useGameEngine(canvasRef);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-amber-50 to-rose-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-500" />
            朝鲜族跳板游戏
            <Sparkles className="w-8 h-8 text-amber-500" />
          </h1>
          <p className="text-gray-600">
            控制下压时机，在空中摆出优美姿势，争取最高分！
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-2xl p-4 border-4 border-amber-100">
              <div className="relative rounded-2xl overflow-hidden">
                <div
                  className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)',
                  }}
                >
                  <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg">
                    <span className="text-sm font-semibold text-gray-700">
                      第 {gameState.round} 轮
                    </span>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-full shadow-lg font-semibold text-sm ${
                      gameState.currentTurn === 'player'
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {gameState.currentTurn === 'player' ? '你的回合' : 'AI回合'}
                  </div>
                </div>

                <canvas
                  ref={canvasRef}
                  width={LAYOUT.CANVAS_WIDTH}
                  height={LAYOUT.CANVAS_HEIGHT}
                  className="w-full rounded-2xl block"
                  style={{ aspectRatio: `${LAYOUT.CANVAS_WIDTH}/${LAYOUT.CANVAS_HEIGHT}` }}
                  tabIndex={0}
                />
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>你</span>
                </div>
                <div className="text-gray-300">VS</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>AI</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <HistoryPanel scores={scores} />
            </div>
          </div>

          <div className="space-y-6">
            <Controls gameState={gameState} onReset={resetGame} />
            <ScorePanel lastScore={lastScore} scores={scores} />
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>朝鲜族跳板是国家级非物质文化遗产，流行于吉林省延边朝鲜族自治州。</p>
          <p className="mt-1">游戏规则：在最佳时机按下空格键下压，在空中用方向键摆出姿势，落地越舒展得分越高。</p>
        </div>
      </div>
    </div>
  );
};
