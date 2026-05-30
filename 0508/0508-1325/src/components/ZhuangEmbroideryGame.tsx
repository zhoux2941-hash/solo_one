import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getHighScore } from '@/utils/storageUtils';
import { GameCanvas } from './GameCanvas';
import { ControlPanel } from './ControlPanel';
import { GameResult } from './GameResult';
import { DrumDecoration } from './GameDecorations';

export function ZhuangEmbroideryGame() {
  const { resetGame } = useGameStore();

  useEffect(() => {
    const highScore = getHighScore();
    useGameStore.setState({ highScore });
  }, []);

  return (
    <div className="min-h-screen py-8 px-4 zhuang-pattern">
      <div className="absolute top-4 left-4">
        <DrumDecoration className="opacity-60" />
      </div>
      <div className="absolute top-4 right-4">
        <DrumDecoration className="opacity-60" />
      </div>
      <div className="absolute bottom-4 left-4">
        <DrumDecoration className="opacity-60" />
      </div>
      <div className="absolute bottom-4 right-4">
        <DrumDecoration className="opacity-60" />
      </div>

      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-5xl font-display text-zhuang-yellow mb-2 drop-shadow-lg">
            🏮 壮族抛绣球 🏮
          </h1>
          <p className="text-zhuang-cream text-lg">
            瞄准背篓，抛出绣球，挑战最高分！
          </p>
        </header>

        <GameCanvas />
        <ControlPanel />

        <footer className="text-center mt-8 text-zhuang-cream/70 text-sm">
          <p>🎯 近区 +5分 | 🎯 中区 +10分 | 🎯 远区 +20分</p>
          <p className="mt-1">每轮5次机会，看看你能得多少分！</p>
        </footer>
      </div>

      <GameResult />
    </div>
  );
}
