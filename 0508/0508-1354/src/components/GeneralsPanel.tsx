import { useGameStore } from '../store/gameStore';
import type { General } from '../types/game';

const getLoyaltyColor = (loyalty: number, isDefected: boolean) => {
  if (isDefected) return 'text-defeat-red';
  if (loyalty >= 70) return 'text-victory-gold';
  if (loyalty >= 40) return 'text-ancient-gold';
  return 'text-defeat-red';
};

const getLoyaltyBarColor = (loyalty: number, isDefected: boolean) => {
  if (isDefected) return 'bg-defeat-red';
  if (loyalty >= 70) return 'bg-gradient-to-r from-victory-gold to-ancient-gold';
  if (loyalty >= 40) return 'bg-gradient-to-r from-ancient-gold to-ancient-yellow';
  return 'bg-gradient-to-r from-defeat-red to-ancient-red';
};

const GeneralCard = ({ general }: { general: General }) => {
  const loyaltyColorClass = getLoyaltyColor(general.loyalty, general.isDefected);
  const loyaltyBarColorClass = getLoyaltyBarColor(general.loyalty, general.isDefected);

  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-300
        ${general.isDefected
          ? 'bg-defeat-red/10 border-defeat-red/50 opacity-70'
          : 'bg-ancient-gold/5 border-ancient-gold/30 hover:border-ancient-gold/60'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`text-4xl ${general.isDefected ? 'grayscale' : ''}`}>
          {general.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-ancient-gold font-serif text-lg">
              {general.name}
            </h4>
            {general.isDefected && (
              <span className="text-xs px-2 py-0.5 bg-defeat-red/30 text-defeat-red rounded-full font-serif">
                已投敌
              </span>
            )}
          </div>
          <p className="text-xs text-ancient-yellow/80 font-serif mb-2">
            {general.title} · {general.trait}
          </p>
          <p className="text-xs text-ancient-yellow/60 mb-3 leading-relaxed">
            {general.traitDescription}
          </p>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-ancient-yellow/70">忠诚度</span>
              <span className={`text-sm font-bold font-serif ${loyaltyColorClass}`}>
                {general.isDefected ? '0' : general.loyalty}
              </span>
            </div>
            <div className="w-full h-2 bg-ancient-slate/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${loyaltyBarColorClass}`}
                style={{
                  width: `${general.isDefected ? 0 : general.loyalty}%`,
                  boxShadow: general.loyalty >= 70 && !general.isDefected
                    ? '0 0 8px rgba(255, 215, 0, 0.5)'
                    : general.loyalty < 40 && !general.isDefected
                      ? '0 0 8px rgba(220, 38, 38, 0.5)'
                      : 'none',
                }}
              />
            </div>
            {general.loyalty <= 25 && !general.isDefected && (
              <p className="text-xs text-defeat-red mt-2 animate-pulse font-serif">
                ⚠️ 忠诚度过低，有叛变风险！
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function GeneralsPanel() {
  const { generals } = useGameStore();

  const activeCount = generals.filter(g => !g.isDefected).length;
  const avgLoyalty = activeCount > 0
    ? Math.round(generals.filter(g => !g.isDefected).reduce((sum, g) => sum + g.loyalty, 0) / activeCount)
    : 0;

  return (
    <div className="bg-ancient-slate/90 backdrop-blur-sm rounded-lg border-2 border-ancient-gold/50 p-6 shadow-2xl animate-fadeIn">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-ancient-gold font-serif mb-2">
          麾下将领
        </h2>
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="text-ancient-yellow/80 font-serif">
            可用：{activeCount}/{generals.length}
          </span>
          <span className="text-ancient-yellow/60">|</span>
          <span className={`font-serif font-bold ${getLoyaltyColor(avgLoyalty, false)}`}>
            平均忠诚度：{avgLoyalty}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {generals.map(general => (
          <GeneralCard key={general.id} general={general} />
        ))}
      </div>
    </div>
  );
}
