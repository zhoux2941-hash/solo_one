import React from 'react';
import { X, Play, Trash2 } from 'lucide-react';
import { Game } from '../../shared/types';

interface GameHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  onLoadGame: (game: Game) => void;
  onDeleteGame: (id: string) => void;
}

export const GameHistoryModal: React.FC<GameHistoryModalProps> = ({
  isOpen,
  onClose,
  games,
  onLoadGame,
  onDeleteGame,
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-amber-200">
          <h2 className="text-xl font-bold text-amber-900" style={{ fontFamily: '"Ma Shan Zheng", serif' }}>
            对局历史
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-amber-200 rounded-full transition-colors"
          >
            <X size={20} className="text-amber-800" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {games.length === 0 ? (
            <div className="text-center py-8 text-amber-700">
              暂无保存的对局
            </div>
          ) : (
            <div className="space-y-3">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="bg-white rounded-lg p-4 shadow border border-amber-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-amber-900">{game.title}</div>
                      <div className="text-sm text-amber-700 mt-1">
                        {game.blackPlayer} vs {game.whitePlayer}
                      </div>
                      <div className="text-xs text-amber-600 mt-1">
                        {formatDate(game.createdAt)} · {game.moves.length} 手
                      </div>
                      {game.result && (
                        <div className="text-xs text-green-700 mt-1 font-medium">
                          结果: {game.result}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          onLoadGame(game);
                          onClose();
                        }}
                        className="p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                        title="加载对局"
                      >
                        <Play size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteGame(game.id)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="删除对局"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
