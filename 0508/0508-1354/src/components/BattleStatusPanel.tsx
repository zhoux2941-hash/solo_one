import { useGameStore } from '../store/gameStore';
import ProgressBar from './ProgressBar';

export default function BattleStatusPanel() {
  const { currentRound, maxRounds, resources } = useGameStore();

  return (
    <div className="bg-ancient-slate/90 backdrop-blur-sm rounded-lg border-2 border-ancient-gold/50 p-6 shadow-2xl animate-fadeIn">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-ancient-gold font-serif mb-2">战场态势</h2>
        <div className="inline-block px-4 py-1 bg-ancient-gold/20 rounded-full border border-ancient-gold/40">
          <span className="text-ancient-yellow font-serif text-lg">
            第 {currentRound} 轮 / 共 {maxRounds} 轮
          </span>
        </div>
      </div>

      <div className="mb-6 p-4 bg-ancient-red/20 rounded-lg border border-ancient-red/40">
        <h3 className="text-lg font-bold text-defeat-red font-serif mb-4 flex items-center gap-2">
          <span className="text-2xl">🏴</span>
          敌军态势
        </h3>
        <div className="space-y-4">
          <ProgressBar
            value={resources.enemyTroops}
            max={3000}
            color="#DC2626"
            label="敌军兵力"
            showValue={true}
          />
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-ancient-yellow font-serif">敌军距离</span>
              <span className="text-sm text-ancient-gold font-medium">
                {Math.round(resources.enemyDistance)} 里
              </span>
            </div>
            <div className="relative w-full h-3 bg-ancient-slate/60 rounded-full overflow-hidden border border-ancient-gold/30">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-defeat-red to-ancient-red"
                style={{
                  width: `${100 - resources.enemyDistance}%`,
                  boxShadow: '0 0 10px rgba(220, 38, 38, 0.4)',
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-ancient-yellow/60 mt-1">
              <span>城下</span>
              <span>远方</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-ancient-gold/10 rounded-lg border border-ancient-gold/40">
        <h3 className="text-lg font-bold text-ancient-gold font-serif mb-4 flex items-center gap-2">
          <span className="text-2xl">🏯</span>
          我方城防
        </h3>
        <div className="space-y-4">
          <ProgressBar
            value={resources.ownTroops}
            max={1500}
            color="#D4AF37"
            label="守城兵力"
            showValue={true}
          />
          <ProgressBar
            value={resources.provisions}
            max={100}
            color="#C4A35A"
            label="粮草储备"
            showValue={false}
          />
          <ProgressBar
            value={resources.wallDurability}
            max={100}
            color="#8B7355"
            label="城墙耐久"
            showValue={false}
          />
          <ProgressBar
            value={resources.morale}
            max={100}
            color="#FFD700"
            label="士气"
            showValue={false}
          />
        </div>
      </div>
    </div>
  );
}
