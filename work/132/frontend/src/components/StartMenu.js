import React, { useState } from 'react';
import io from 'socket.io-client';

const SERVER_URL = 'http://localhost:8080';

function StartMenu({ onCreateGame, onJoinGame }) {
  const [playerName, setPlayerName] = useState('');
  const [joinGameId, setJoinGameId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const connectSocket = () => {
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    return socket;
  };

  const handleCreateGame = async (e) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('请输入玩家名称');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const socket = connectSocket();
      
      socket.on('connect', () => {
        socket.emit('create_game', { playerName: playerName.trim() });
      });

      socket.on('game_created', (data) => {
        socket.disconnect();
        onCreateGame(playerName.trim(), data.gameId, data.playerId);
      });

      socket.on('error', (data) => {
        socket.disconnect();
        setError(data.message || '创建游戏失败');
        setLoading(false);
      });

      socket.on('connect_error', () => {
        socket.disconnect();
        setError('无法连接到服务器，请确保后端服务正在运行');
        setLoading(false);
      });

      setTimeout(() => {
        if (socket.connected) {
          socket.disconnect();
          setError('连接超时');
          setLoading(false);
        }
      }, 5000);

    } catch (err) {
      setError('发生错误: ' + err.message);
      setLoading(false);
    }
  };

  const handleJoinGame = async (e) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('请输入玩家名称');
      return;
    }

    if (!joinGameId.trim()) {
      setError('请输入游戏ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const socket = connectSocket();
      
      socket.on('connect', () => {
        socket.emit('join_game', { 
          gameId: joinGameId.trim(), 
          playerName: playerName.trim() 
        });
      });

      socket.on('game_joined', (data) => {
        socket.disconnect();
        onJoinGame(playerName.trim(), data.gameId, data.playerId);
      });

      socket.on('error', (data) => {
        socket.disconnect();
        setError(data.message || '加入游戏失败');
        setLoading(false);
      });

      socket.on('connect_error', () => {
        socket.disconnect();
        setError('无法连接到服务器，请确保后端服务正在运行');
        setLoading(false);
      });

    } catch (err) {
      setError('发生错误: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="start-menu">
      <h1>⚔️ Roguelike</h1>
      <h2>地牢探险</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="menu-section">
        <h3>玩家信息</h3>
        <div className="form-group">
          <label>玩家名称</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="输入你的名字..."
            disabled={loading}
            maxLength={20}
          />
        </div>
      </div>

      <div className="menu-section">
        <h3>创建新游戏</h3>
        <button 
          className="btn" 
          onClick={handleCreateGame}
          disabled={loading}
        >
          {loading ? '连接中...' : '🎮 开始新游戏'}
        </button>
      </div>

      <div className="menu-section">
        <h3>加入已有游戏</h3>
        <div className="form-group">
          <label>游戏ID</label>
          <input
            type="text"
            value={joinGameId}
            onChange={(e) => setJoinGameId(e.target.value)}
            placeholder="输入游戏ID..."
            disabled={loading}
          />
        </div>
        <button 
          className="btn" 
          onClick={handleJoinGame}
          disabled={loading}
        >
          {loading ? '加入中...' : '🚪 加入游戏'}
        </button>
      </div>
    </div>
  );
}

export default StartMenu;
