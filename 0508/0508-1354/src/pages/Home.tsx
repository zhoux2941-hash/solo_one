import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import BattleStatusPanel from '../components/BattleStatusPanel';
import GeneralsPanel from '../components/GeneralsPanel';
import DecisionOptions from '../components/DecisionOptions';
import BattleLog from '../components/BattleLog';
import GameEnding from '../components/GameEnding';

export default function Home() {
  const { getRandomOptions, gameStatus } = useGameStore();

  useEffect(() => {
    if (gameStatus === 'playing') {
      getRandomOptions();
    }
  }, [getRandomOptions, gameStatus]);

  return (
    <div className="min-h-screen relative">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 24px,
              #5C4033 24px,
              #5C4033 25px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 24px,
              #5C4033 24px,
              #5C4033 25px
            )
          `,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <header className="text-center mb-8 animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-black text-ancient-gold font-serif mb-2 drop-shadow-lg">
            🏯 长城守卫 🏯
          </h1>
          <p className="text-lg md:text-xl text-ancient-yellow font-serif">
            战略决策模拟
          </p>
          <div className="mt-4 w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-ancient-gold to-transparent" />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="animate-slideUp" style={{ animationDelay: '100ms' }}>
              <BattleStatusPanel />
            </div>
            <div className="animate-slideUp" style={{ animationDelay: '150ms' }}>
              <GeneralsPanel />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="animate-slideUp" style={{ animationDelay: '200ms' }}>
              <DecisionOptions />
            </div>
            <div className="animate-slideUp" style={{ animationDelay: '300ms' }}>
              <BattleLog />
            </div>
          </div>
        </div>
      </div>

      <GameEnding />
    </div>
  );
}
