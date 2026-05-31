import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { GameLog } from '../types/game';

export default function BattleLog() {
  const { battleLogs } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [battleLogs]);

  const getOutcomeStyle = (outcome: 'victory' | 'defeat' | 'draw') => {
    switch (outcome) {
      case 'victory':
        return {
          text: '胜',
          bgClass: 'bg-victory-gold/20 border-victory-gold/50',
          textClass: 'text-victory-gold',
        };
      case 'defeat':
        return {
          text: '败',
          bgClass: 'bg-defeat-red/20 border-defeat-red/50',
          textClass: 'text-defeat-red',
        };
      case 'draw':
        return {
          text: '平',
          bgClass: 'bg-ancient-yellow/20 border-ancient-yellow/50',
          textClass: 'text-ancient-yellow',
        };
    }
  };

  const getResourceChangeText = (log: GameLog) => {
    const changes = log.result.resourceChanges;
    const texts: string[] = [];
    
    if (changes.enemyTroops !== undefined && changes.enemyTroops !== 0) {
      texts.push(`敌军${changes.enemyTroops > 0 ? '+' : ''}${changes.enemyTroops}`);
    }
    if (changes.ownTroops !== undefined && changes.ownTroops !== 0) {
      texts.push(`我军${changes.ownTroops > 0 ? '+' : ''}${changes.ownTroops}`);
    }
    if (changes.wallDurability !== undefined && changes.wallDurability !== 0) {
      texts.push(`城墙${changes.wallDurability > 0 ? '+' : ''}${changes.wallDurability}`);
    }
    if (changes.morale !== undefined && changes.morale !== 0) {
      texts.push(`士气${changes.morale > 0 ? '+' : ''}${changes.morale}`);
    }
    if (changes.provisions !== undefined && changes.provisions !== 0) {
      texts.push(`粮草${changes.provisions > 0 ? '+' : ''}${changes.provisions}`);
    }
    
    return texts.join(' | ');
  };

  return (
    <div className="bg-ancient-slate/90 backdrop-blur-sm rounded-lg border-2 border-ancient-gold/50 p-6 shadow-2xl animate-fadeIn">
      <h2 className="text-2xl font-bold text-ancient-gold font-serif mb-4 text-center">
        战报记录
      </h2>
      
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto pr-2 space-y-3 custom-scrollbar"
      >
        {battleLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-ancient-yellow/50 text-center font-serif">
              战事未起，静候军令...
            </p>
          </div>
        ) : (
          battleLogs.map((log, index) => {
            const style = getOutcomeStyle(log.result.outcome);
            return (
              <div
                key={`${log.round}-${index}`}
                className={`
                  p-4 rounded-lg border-2 ${style.bgClass}
                  animate-slideUp
                `}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-ancient-gold/20 rounded text-ancient-gold text-sm font-serif font-bold">
                      第 {log.round} 轮
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold font-serif ${style.textClass} bg-current/10 border border-current/30`}>
                      {style.text}
                    </span>
                    <span className="text-ancient-yellow font-serif font-medium">
                      {log.result.decision.icon} {log.result.decision.name}
                    </span>
                  </div>
                </div>
                <p className="text-ancient-yellow/90 text-sm mb-2 leading-relaxed">
                  {log.result.message}
                </p>
                <p className="text-xs text-ancient-gold/70">
                  {getResourceChangeText(log)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
