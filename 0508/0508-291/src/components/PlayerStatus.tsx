import { Player, GameState } from '../types';

interface PlayerStatusProps {
  state: GameState | null;
  nodeId: string;
}

export function PlayerStatus({ state, nodeId }: PlayerStatusProps) {
  const player = state?.players[nodeId];
  const room = player ? state?.rooms[player.roomId] : null;
  const connectedPeers = Object.values(state?.players || {}).filter(
    (p) => p.isOnline && p.id !== nodeId
  ).length;

  if (!player) {
    return (
      <div className="p-4 border-b border-terminal-border">
        <div className="text-terminal-text">
          <h2 className="text-xl mb-2 text-terminal-prompt">=== 玩家状态 ===</h2>
          <p>尚未加入游戏</p>
          <p className="text-terminal-info mt-2">节点ID: {nodeId.slice(0, 8)}...</p>
        </div>
      </div>
    );
  }

  const hpPercentage = (player.hp / player.maxHp) * 100;

  return (
    <div className="p-4 border-b border-terminal-border">
      <h2 className="text-xl mb-3 text-terminal-prompt">=== 玩家状态 ===</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>名称:</span>
          <span className="text-terminal-info">{player.name}</span>
        </div>
        <div className="flex justify-between">
          <span>位置:</span>
          <span className="text-terminal-info">{room?.name || '未知'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>HP:</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-3 bg-gray-800 rounded overflow-hidden">
              <div
                className={`h-full transition-all ${
                  hpPercentage > 50
                    ? 'bg-green-500'
                    : hpPercentage > 25
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${hpPercentage}%` }}
              />
            </div>
            <span>{player.hp}/{player.maxHp}</span>
          </div>
        </div>
        <div className="flex justify-between">
          <span>攻击力:</span>
          <span className="text-terminal-error">{player.attack}</span>
        </div>
        <div className="flex justify-between">
          <span>防御力:</span>
          <span className="text-terminal-info">{player.defense}</span>
        </div>
        <div className="flex justify-between">
          <span>在线玩家:</span>
          <span className="text-terminal-info">{connectedPeers + 1}</span>
        </div>
        <div className="flex justify-between">
          <span>背包物品:</span>
          <span className="text-terminal-info">{player.inventory.length}</span>
        </div>
      </div>
    </div>
  );
}
