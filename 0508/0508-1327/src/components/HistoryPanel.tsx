import React from 'react';
import { RoundScore } from '@/types/game';
import { getScoreRating } from '@/game/scoring';
import { History, User, Bot } from 'lucide-react';

interface HistoryPanelProps {
  scores: RoundScore[];
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ scores }) => {
  const recentScores = [...scores].reverse().slice(0, 10);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 border-2 border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-gray-500" />
        历史记录
      </h3>

      {recentScores.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {recentScores.map((score, index) => {
            const rating = getScoreRating(score.total);
            return (
              <div
                key={`${score.round}-${score.player}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      score.player === 'player' ? 'bg-red-100' : 'bg-blue-100'
                    }`}
                  >
                    {score.player === 'player' ? (
                      <User className="w-4 h-4 text-red-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      第 {score.round} 轮
                    </div>
                    <div className="text-xs text-gray-500">
                      {score.player === 'player' ? '你' : 'AI'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: rating.color }}>
                    {score.total}
                  </div>
                  <div className="text-xs text-gray-500">
                    {score.poseScore} + {score.heightScore} + {score.landingScore}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          暂无记录，开始游戏吧！
        </div>
      )}
    </div>
  );
};
