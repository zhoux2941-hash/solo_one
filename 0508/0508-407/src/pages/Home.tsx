import { useState, useCallback } from 'react';
import StatusPanel from '../components/StatusPanel';
import FoodSelector from '../components/FoodSelector';
import HistoryLog from '../components/HistoryLog';
import EndingScreen from '../components/EndingScreen';
import { FOOD_OPTIONS, getFoodById } from '../data/foodOptions';
import { getInitialState, processFoodSelection } from '../utils/gameLogic';
import { GameState } from '../types/game';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(getInitialState());
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectFood = useCallback((foodId: string) => {
    setGameState(prev => ({
      ...prev,
      selectedFood: prev.selectedFood === foodId ? null : foodId
    }));
  }, []);

  const handleConfirmChoice = useCallback(() => {
    if (!gameState.selectedFood || isProcessing) return;
    
    const food = getFoodById(gameState.selectedFood);
    if (!food) return;

    setIsProcessing(true);
    
    setTimeout(() => {
      const { newState } = processFoodSelection(gameState, food);
      setGameState(newState);
      setIsProcessing(false);
    }, 500);
  }, [gameState, isProcessing]);

  const handleRestart = useCallback(() => {
    setGameState(getInitialState());
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="grain-overlay" />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <header className="text-center mb-8 animate-fade-in">
          <div className="text-6xl mb-4">🏕️</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 font-display">
            <span className="bg-gradient-to-r from-emerald-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
              野外生存挑战
            </span>
          </h1>
          <p className="text-white/60 text-lg">
            你被困在山林中，需要在5天内做出明智的食物选择以等待救援
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <StatusPanel
              round={gameState.round}
              maxRounds={gameState.maxRounds}
              satiety={gameState.satiety}
              health={gameState.health}
              debuffs={gameState.debuffs}
              timeRemaining={gameState.timeRemaining}
              maxTime={gameState.maxTime}
            />
          </div>

          <div className="lg:col-span-6">
            <FoodSelector
              options={FOOD_OPTIONS}
              selectedId={gameState.selectedFood}
              onSelect={handleSelectFood}
              disabled={isProcessing || gameState.isGameOver}
            />
            
            <div className="mt-6 text-center">
              <button
                onClick={handleConfirmChoice}
                disabled={!gameState.selectedFood || isProcessing || gameState.isGameOver}
                className={`btn-primary text-lg ${
                  !gameState.selectedFood || isProcessing || gameState.isGameOver
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> 处理中...
                  </span>
                ) : (
                  <span>✅ 确认选择 (第 {gameState.round} 天)</span>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-3">
            <HistoryLog records={gameState.history} />
          </div>
        </div>

        <footer className="mt-12 text-center text-white/40 text-sm">
          <p>🌲 合理规划，平衡风险与收益，祝你好运！</p>
        </footer>
      </div>

      {gameState.isGameOver && gameState.ending && (
        <EndingScreen
          ending={gameState.ending}
          finalSatiety={gameState.satiety}
          finalHealth={gameState.health}
          debuffs={gameState.debuffs}
          timeRemaining={gameState.timeRemaining}
          maxTime={gameState.maxTime}
          history={gameState.history}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}