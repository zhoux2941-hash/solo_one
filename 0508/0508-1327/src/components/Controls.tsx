import React from 'react';
import { GameState, POSE_NAMES, POSE_MAP, DirectionKey } from '@/types/game';
import { Keyboard, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface ControlsProps {
  gameState: GameState;
  onReset: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ gameState, onReset }) => {
  const activePlayer = gameState.currentTurn === 'player' ? 'player' : 'ai';
  const currentPose = gameState[activePlayer].pose;

  const phaseMessages: Record<string, string> = {
    idle: '准备开始',
    waiting: '等待时机... 按空格键下压',
    pressing: '下压中...',
    airborne: '在空中！按方向键摆姿势',
    landing: '落地中...',
    scoring: '计算得分...',
    aiTurn: 'AI 回合...',
    gameOver: '游戏结束',
  };

  const poseIcons: Record<string, React.ReactNode> = {
    ArrowUp: <ArrowUp className="w-4 h-4" />,
    ArrowDown: <ArrowDown className="w-4 h-4" />,
    ArrowLeft: <ArrowLeft className="w-4 h-4" />,
    ArrowRight: <ArrowRight className="w-4 h-4" />,
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 border-2 border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Keyboard className="w-5 h-5 text-gray-500" />
        操作说明
      </h3>

      <div className="space-y-4">
        <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <div className="text-xs text-amber-600 font-medium mb-1">当前状态</div>
          <div className="text-base font-semibold text-amber-800">
            {phaseMessages[gameState.phase]}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            当前姿势: <span className="font-semibold">{POSE_NAMES[currentPose]}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">按键控制</div>
          
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
            <kbd className="px-3 py-1 bg-gray-800 text-white text-sm font-mono rounded-md">
              Space
            </kbd>
            <span className="text-sm text-gray-600">下压跳板</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            <div />
            <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded-lg">
              <kbd className="px-2 py-1 bg-gray-800 text-white text-sm font-mono rounded-md flex items-center justify-center w-8 h-8">
                {poseIcons.ArrowUp}
              </kbd>
            </div>
            <div />
            
            <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded-lg">
              <kbd className="px-2 py-1 bg-gray-800 text-white text-sm font-mono rounded-md flex items-center justify-center w-8 h-8">
                {poseIcons.ArrowLeft}
              </kbd>
            </div>
            <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded-lg">
              <kbd className="px-2 py-1 bg-gray-800 text-white text-sm font-mono rounded-md flex items-center justify-center w-8 h-8">
                {poseIcons.ArrowDown}
              </kbd>
            </div>
            <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded-lg">
              <kbd className="px-2 py-1 bg-gray-800 text-white text-sm font-mono rounded-md flex items-center justify-center w-8 h-8">
                {poseIcons.ArrowRight}
              </kbd>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-2 space-y-1">
            {(Object.keys(POSE_MAP) as DirectionKey[]).map((key) => (
              <div key={key} className="flex justify-between">
                <span>{key === 'ArrowUp' ? '↑ 上' : key === 'ArrowDown' ? '↓ 下' : key === 'ArrowLeft' ? '← 左' : '→ 右'}</span>
                <span className="font-medium">{POSE_NAMES[POSE_MAP[key]]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">
            第 {gameState.round} 轮 · {gameState.currentTurn === 'player' ? '你的回合' : 'AI回合'}
          </div>
          <button
            onClick={onReset}
            className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
          >
            重新开始
          </button>
        </div>
      </div>
    </div>
  );
};
