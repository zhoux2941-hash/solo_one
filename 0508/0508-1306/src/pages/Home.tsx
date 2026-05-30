import React, { useState, useEffect } from 'react';
import { Board } from '../components/Board';
import { ControlPanel } from '../components/ControlPanel';
import { InfoPanel } from '../components/InfoPanel';
import { WinRateChart } from '../components/WinRateChart';
import { GameHistoryModal } from '../components/GameHistoryModal';
import { useGameStore } from '../store/gameStore';
import { downloadSGF, sgfToMoves } from '../utils/sgf';
import { calculateWinRate, calculateWinRateHistory } from '../utils/winRate';
import { Position, Game, WinRateData } from '../../shared/types';
import { initAudio } from '../utils/audio';

const Home: React.FC = () => {
  const {
    game,
    board,
    currentPlayer,
    lastMove,
    aiSuggestions,
    showSuggestions,
    gameHistory,
    newGame,
    makeMove,
    undoMove,
    toggleSuggestions,
    setSuggestions,
    loadGame,
    fetchGameHistory,
  } = useGameStore();

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [winRate, setWinRate] = useState({ blackWinRate: 50, whiteWinRate: 50 });
  const [winRateHistory, setWinRateHistory] = useState<WinRateData[]>([]);

  useEffect(() => {
    initAudio();
    fetchGameHistory();
  }, [fetchGameHistory]);

  useEffect(() => {
    const rates = calculateWinRate(game.moves);
    setWinRate(rates);
    setWinRateHistory(calculateWinRateHistory(game.moves));
  }, [game.moves]);

  useEffect(() => {
    if (showSuggestions) {
      fetchAISuggestions();
    }
  }, [showSuggestions, game.moves.length]);

  const fetchAISuggestions = async () => {
    try {
      const response = await fetch('/api/openings/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentMoves: game.moves.map((m) => m.position),
          color: currentPlayer,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const occupiedPositions = new Set(
          game.moves.map((m) => `${m.position.x},${m.position.y}`)
        );
        const filteredSuggestions = (data.suggestions || []).filter(
          (s: any) => !occupiedPositions.has(`${s.position.x},${s.position.y}`)
        );
        setSuggestions(filteredSuggestions);
      }
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleMove = (position: Position) => {
    makeMove(position);
  };

  const handleExportSGF = () => {
    downloadSGF(game);
  };

  const handleImportSGF = async (file: File) => {
    const text = await file.text();
    const { moves, gameInfo } = sgfToMoves(text);
    
    const importedGame: Game = {
      id: game.id,
      title: gameInfo.title || file.name.replace('.sgf', ''),
      blackPlayer: gameInfo.blackPlayer || '黑方',
      whitePlayer: gameInfo.whitePlayer || '白方',
      date: gameInfo.date || new Date().toISOString().split('T')[0],
      result: gameInfo.result || '',
      moves,
      createdAt: Date.now(),
    };
    
    loadGame(importedGame);
  };

  const handleSaveGame = async () => {
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game),
      });
      if (response.ok) {
        await fetchGameHistory();
        alert('对局保存成功！');
      }
    } catch (error) {
      console.error('Failed to save game:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (confirm('确定要删除这个对局吗？')) {
      try {
        await fetch(`/api/games/${id}`, { method: 'DELETE' });
        await fetchGameHistory();
      } catch (error) {
        console.error('Failed to delete game:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-amber-100">
      <header className="py-6 text-center">
        <h1 
          className="text-4xl font-bold text-amber-900"
          style={{ fontFamily: '"Ma Shan Zheng", serif' }}
        >
          藏棋 · 密芒
        </h1>
        <p className="text-amber-700 mt-2">17×17 棋谱记录与分析工具</p>
      </header>

      <main className="container mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row justify-center items-start gap-6">
          <div className="w-full lg:w-64 space-y-4">
            <ControlPanel
              onNewGame={newGame}
              onUndo={undoMove}
              onExportSGF={handleExportSGF}
              onImportSGF={handleImportSGF}
              onToggleSuggestions={toggleSuggestions}
              onSaveGame={handleSaveGame}
              onShowHistory={() => setShowHistoryModal(true)}
              canUndo={game.moves.length > 0}
              showSuggestions={showSuggestions}
            />
          </div>

          <div className="flex-shrink-0">
            <Board
              board={board}
              lastMove={lastMove}
              currentPlayer={currentPlayer}
              onMove={handleMove}
              showSuggestions={showSuggestions}
              suggestions={aiSuggestions}
            />
          </div>

          <div className="w-full lg:w-64 space-y-4">
            <InfoPanel
              game={game}
              currentPlayer={currentPlayer}
              blackWinRate={winRate.blackWinRate}
              whiteWinRate={winRate.whiteWinRate}
              suggestions={aiSuggestions}
              showSuggestions={showSuggestions}
            />
            <WinRateChart winRateHistory={winRateHistory} />
          </div>
        </div>
      </main>

      <GameHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        games={gameHistory}
        onLoadGame={loadGame}
        onDeleteGame={handleDeleteGame}
      />
    </div>
  );
};

export default Home;
