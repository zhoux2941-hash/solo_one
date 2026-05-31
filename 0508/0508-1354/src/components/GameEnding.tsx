import { useGameStore } from '../store/gameStore';

export default function GameEnding() {
  const { gameStatus, finalOutcome, resources, battleLogs, resetGame } = useGameStore();

  if (gameStatus !== 'ended' || !finalOutcome) return null;

  const getOutcomeConfig = () => {
    switch (finalOutcome) {
      case 'greatVictory':
        return {
          title: '大捷',
          subtitle: '敌寇溃逃，江山永固！',
          icon: '🏆',
          textColor: 'text-victory-gold',
          borderColor: 'border-victory-gold',
          bgGradient: 'from-victory-gold/20 via-ancient-gold/10 to-transparent',
          glowColor: 'rgba(255, 215, 0, 0.4)',
        };
      case 'victory':
        return {
          title: '惨胜',
          subtitle: '敌军暂退，然元气大伤...',
          icon: '⚔️',
          textColor: 'text-ancient-gold',
          borderColor: 'border-ancient-gold',
          bgGradient: 'from-ancient-gold/20 via-ancient-yellow/10 to-transparent',
          glowColor: 'rgba(212, 175, 55, 0.4)',
        };
      case 'defeat':
        return {
          title: '城破',
          subtitle: '江山易主，忠臣死战...',
          icon: '💔',
          textColor: 'text-defeat-red',
          borderColor: 'border-defeat-red',
          bgGradient: 'from-defeat-red/20 via-ancient-red/10 to-transparent',
          glowColor: 'rgba(220, 38, 38, 0.4)',
        };
      default:
        return {
          title: '战毕',
          subtitle: '战事已了',
          icon: '📜',
          textColor: 'text-ancient-yellow',
          borderColor: 'border-ancient-yellow',
          bgGradient: 'from-ancient-yellow/20 to-transparent',
          glowColor: 'rgba(196, 163, 90, 0.4)',
        };
    }
  };

  const config = getOutcomeConfig();

  const victoryCount = battleLogs.filter(l => l.result.outcome === 'victory').length;
  const defeatCount = battleLogs.filter(l => l.result.outcome === 'defeat').length;
  const drawCount = battleLogs.filter(l => l.result.outcome === 'draw').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`
          relative max-w-lg w-full mx-4 p-8 rounded-xl border-4 ${config.borderColor}
          bg-gradient-to-b ${config.bgGradient}
          bg-ancient-slate/95
          shadow-2xl
          animate-slideUp
        `}
        style={{
          boxShadow: `0 0 60px ${config.glowColor}, inset 0 0 30px ${config.glowColor}33`,
        }}
      >
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-ancient-gold/60 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-ancient-gold/60 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-ancient-gold/60 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-ancient-gold/60 rounded-br-xl" />

        <div className="text-center">
          <div className="text-6xl mb-4">{config.icon}</div>
          <h1 className={`text-5xl font-black font-serif mb-2 ${config.textColor}`}>
            {config.title}
          </h1>
          <p className="text-xl text-ancient-yellow font-serif mb-8">
            {config.subtitle}
          </p>

          <div className="mb-8 p-6 bg-ancient-slate/60 rounded-lg border border-ancient-gold/30">
            <h3 className="text-lg font-bold text-ancient-gold font-serif mb-4">战果统计</h3>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-ancient-yellow/70">存活兵力</span>
                  <span className="text-ancient-gold font-medium">{Math.round(resources.ownTroops)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ancient-yellow/70">剩余敌军</span>
                  <span className="text-defeat-red font-medium">{Math.round(resources.enemyTroops)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ancient-yellow/70">城墙耐久</span>
                  <span className="text-ancient-yellow font-medium">{Math.round(resources.wallDurability)}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-ancient-yellow/70">粮草储备</span>
                  <span className="text-ancient-yellow font-medium">{Math.round(resources.provisions)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ancient-yellow/70">士气</span>
                  <span className="text-victory-gold font-medium">{Math.round(resources.morale)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ancient-yellow/70">战斗回合</span>
                  <span className="text-ancient-gold font-medium">{battleLogs.length} 轮</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-ancient-gold/20">
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-victory-gold">{victoryCount}</div>
                  <div className="text-xs text-ancient-yellow/70">胜</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-defeat-red">{defeatCount}</div>
                  <div className="text-xs text-ancient-yellow/70">败</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-ancient-yellow">{drawCount}</div>
                  <div className="text-xs text-ancient-yellow/70">平</div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={resetGame}
            className={`
              px-8 py-3 rounded-lg border-2 ${config.borderColor}
              bg-gradient-to-r from-ancient-gold/20 to-ancient-yellow/20
              ${config.textColor} font-bold font-serif text-lg
              transition-all duration-300
              hover:scale-105 hover:shadow-lg
              active:scale-95
            `}
            style={{
              boxShadow: `0 0 20px ${config.glowColor}`,
            }}
          >
            再战一场
          </button>
        </div>
      </div>
    </div>
  );
}
