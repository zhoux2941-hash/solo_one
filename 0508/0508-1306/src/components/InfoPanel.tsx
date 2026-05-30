import React from 'react';
import { Game, Move, StoneColor, AISuggestion } from '../../shared/types';

interface InfoPanelProps {
  game: Game;
  currentPlayer: StoneColor;
  blackWinRate: number;
  whiteWinRate: number;
  suggestions: AISuggestion[];
  showSuggestions: boolean;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  game,
  currentPlayer,
  blackWinRate,
  whiteWinRate,
  suggestions,
  showSuggestions,
}) => {
  const lastMove = game.moves[game.moves.length - 1];

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const positionToLabel = (x: number, y: number) => {
    const colLabel = String.fromCharCode(65 + x);
    const rowLabel = 17 - y;
    return `${colLabel}${rowLabel}`;
  };

  return (
    <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-xl p-4 shadow-lg border border-amber-200">
      <h3 className="text-lg font-bold text-amber-900 mb-4 text-center" style={{ fontFamily: '"Ma Shan Zheng", serif' }}>
        对局信息
      </h3>

      <div className="space-y-4">
        <div className="text-center">
          <div className="text-sm text-amber-700">对局名称</div>
          <div className="font-semibold text-amber-900">{game.title}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg text-center ${
            currentPlayer === 'black' ? 'bg-gray-900 text-white ring-2 ring-amber-500' : 'bg-gray-100'
          }`}>
            <div className="text-xs opacity-80">黑方</div>
            <div className="font-bold">{game.blackPlayer}</div>
            <div className="text-xs mt-1">胜率: {blackWinRate}%</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${
            currentPlayer === 'white' ? 'bg-white text-gray-900 ring-2 ring-amber-500 border' : 'bg-gray-100'
          }`}>
            <div className="text-xs opacity-60">白方</div>
            <div className="font-bold">{game.whitePlayer}</div>
            <div className="text-xs mt-1">胜率: {whiteWinRate}%</div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-amber-700">当前手数</div>
          <div className="text-3xl font-bold text-amber-900" style={{ fontFamily: '"Ma Shan Zheng", serif' }}>
            {game.moves.length}
          </div>
        </div>

        {lastMove && (
          <div className="bg-amber-200/50 rounded-lg p-3">
            <div className="text-xs text-amber-700 mb-1">最后一手</div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">
                {lastMove.color === 'black' ? '黑' : '白'}
                {positionToLabel(lastMove.position.x, lastMove.position.y)}
              </span>
              <span className="text-sm text-amber-700">
                {formatTime(lastMove.timestamp)}
              </span>
            </div>
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-xs text-green-700 mb-2 font-semibold">
              💡 AI推荐着法
              {(suggestions as any[]).some((s: any) => s.source === 'mcts') && (
                <span className="ml-1 text-blue-600">(MCTS搜索)</span>
              )}
              {(suggestions as any[]).some((s: any) => s.source === 'opening') && (
                <span className="ml-1 text-amber-600">(开局库)</span>
              )}
            </div>
            <div className="space-y-2">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span>
                    {positionToLabel(suggestion.position.x, suggestion.position.y)}
                    {(suggestion as any).source === 'mcts' && (
                      <span className="ml-1 text-xs text-blue-500">MCTS</span>
                    )}
                  </span>
                  <span className="text-green-600 font-medium">{Math.round(suggestion.winRate)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {game.result && (
          <div className="bg-amber-800 text-amber-100 rounded-lg p-3 text-center">
            <div className="font-bold">对局结果</div>
            <div>{game.result}</div>
          </div>
        )}
      </div>
    </div>
  );
};
