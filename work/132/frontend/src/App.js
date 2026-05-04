import React, { useState } from 'react';
import Game from './components/Game';
import StartMenu from './components/StartMenu';
import './App.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState(null);
  const [playerId, setPlayerId] = useState(null);

  const handleCreateGame = (name, newGameId, newPlayerId) => {
    setPlayerName(name);
    setGameId(newGameId);
    setPlayerId(newPlayerId);
    setGameStarted(true);
  };

  const handleJoinGame = (name, joinGameId, newPlayerId) => {
    setPlayerName(name);
    setGameId(joinGameId);
    setPlayerId(newPlayerId);
    setGameStarted(true);
  };

  return (
    <div className="app">
      {!gameStarted ? (
        <StartMenu 
          onCreateGame={handleCreateGame}
          onJoinGame={handleJoinGame}
        />
      ) : (
        <Game 
          playerName={playerName}
          gameId={gameId}
          playerId={playerId}
          onBackToMenu={() => {
            setGameStarted(false);
            setGameId(null);
            setPlayerId(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
