import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import io from 'socket.io-client';
import GameCanvas from './GameCanvas';
import InventoryPanel from './InventoryPanel';
import EquipmentPanel from './EquipmentPanel';

const SERVER_URL = 'http://localhost:8080';

const TILES = {
  WALL: 0,
  FLOOR: 1
};

const ITEM_TYPES = {
  CONSUMABLE: 'consumable',
  EQUIPMENT: 'equipment',
  GOLD: 'gold'
};

const ACTION_TYPES = {
  MOVE: 'move',
  EQUIP: 'equip',
  UNEQUIP: 'unequip',
  USE: 'use',
  DROP: 'drop',
  SWAP: 'swap'
};

function createInitialDragState() {
  return {
    isDragging: false,
    draggedItem: null,
    sourceType: null,
    sourceSlot: null,
    sourceIndex: null
  };
}

function dragReducer(state, action) {
  switch (action.type) {
    case 'START_DRAG':
      return {
        isDragging: true,
        draggedItem: action.item,
        sourceType: action.sourceType,
        sourceSlot: action.sourceSlot,
        sourceIndex: action.sourceIndex
      };
    case 'END_DRAG':
      return createInitialDragState();
    default:
      return state;
  }
}

function Game({ playerName, gameId, playerId, onBackToMenu }) {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [error, setError] = useState('');
  const [dragState, dispatchDrag] = useReducer(dragReducer, createInitialDragState());
  
  const messageLogRef = useRef(null);
  const commandQueueRef = useRef([]);
  const isProcessingRef = useRef(false);
  const requestIdRef = useRef(0);
  const pendingRequestIdRef = useRef(null);
  const currentActionTypeRef = useRef(null);

  const processQueue = useCallback((currentSocket) => {
    if (isProcessingRef.current || commandQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const command = commandQueueRef.current.shift();
    
    pendingRequestIdRef.current = command.requestId;
    currentActionTypeRef.current = command.actionType;
    
    currentSocket.emit(command.eventName, command.data);
  }, []);

  const enqueueCommand = useCallback((eventName, data, actionType) => {
    if (!socket) return false;
    
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    
    commandQueueRef.current.push({
      eventName,
      data: { ...data, requestId },
      actionType,
      requestId
    });
    
    if (!isProcessingRef.current) {
      processQueue(socket);
    }
    
    return true;
  }, [socket, processQueue]);

  const handleMove = useCallback((direction) => {
    if (!socket || !gameState || gameState.gameOver) return;
    enqueueCommand('move_player', { direction }, ACTION_TYPES.MOVE);
  }, [socket, gameState, enqueueCommand]);

  const handleEquipItem = useCallback((inventoryIndex, targetSlot) => {
    if (!socket || !gameState) return;
    enqueueCommand('equip_item', { inventorySlot: inventoryIndex, targetSlot }, ACTION_TYPES.EQUIP);
  }, [socket, gameState, enqueueCommand]);

  const handleUnequipItem = useCallback((slot) => {
    if (!socket || !gameState) return;
    enqueueCommand('unequip_item', { slot }, ACTION_TYPES.UNEQUIP);
  }, [socket, gameState, enqueueCommand]);

  const handleUseItem = useCallback((inventoryIndex) => {
    if (!socket || !gameState) return;
    enqueueCommand('use_item', { inventorySlot: inventoryIndex }, ACTION_TYPES.USE);
  }, [socket, gameState, enqueueCommand]);

  const handleDropItem = useCallback((inventoryIndex) => {
    if (!socket || !gameState) return;
    enqueueCommand('drop_item', { inventorySlot: inventoryIndex }, ACTION_TYPES.DROP);
  }, [socket, gameState, enqueueCommand]);

  const handleSwapInventoryItems = useCallback((slot1, slot2) => {
    if (!socket || !gameState) return;
    enqueueCommand('swap_inventory_items', { slot1, slot2 }, ACTION_TYPES.SWAP);
  }, [socket, gameState, enqueueCommand]);

  const handleDragStart = useCallback((item, sourceType, sourceSlot, sourceIndex) => {
    dispatchDrag({
      type: 'START_DRAG',
      item,
      sourceType,
      sourceSlot,
      sourceIndex
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    dispatchDrag({ type: 'END_DRAG' });
  }, []);

  const handleDrop = useCallback((targetType, targetSlot, targetIndex) => {
    if (!dragState.isDragging) return;
    
    const { draggedItem, sourceType, sourceSlot, sourceIndex } = dragState;
    
    if (sourceType === 'inventory' && targetType === 'inventory') {
      if (sourceIndex !== targetIndex) {
        handleSwapInventoryItems(sourceIndex, targetIndex);
      }
    } else if (sourceType === 'inventory' && targetType === 'equipment') {
      if (draggedItem.type === ITEM_TYPES.EQUIPMENT) {
        const validSlots = [draggedItem.slot, ...(draggedItem.alternateSlots || [])];
        if (validSlots.includes(targetSlot)) {
          handleEquipItem(sourceIndex, targetSlot);
        }
      }
    } else if (sourceType === 'equipment' && targetType === 'inventory') {
      handleUnequipItem(sourceSlot);
    } else if (sourceType === 'equipment' && targetType === 'equipment') {
    }
    
    handleDragEnd();
  }, [dragState, handleSwapInventoryItems, handleEquipItem, handleUnequipItem, handleDragEnd]);

  const handleItemClick = useCallback((item, sourceType, slot, index) => {
    if (!item) return;

    if (sourceType === 'inventory') {
      if (item.type === ITEM_TYPES.CONSUMABLE) {
        handleUseItem(index);
      } else if (item.type === ITEM_TYPES.EQUIPMENT) {
        const validSlots = [item.slot, ...(item.alternateSlots || [])];
        for (const targetSlot of validSlots) {
          if (!gameState?.player?.equipment?.[targetSlot]) {
            handleEquipItem(index, targetSlot);
            return;
          }
        }
        handleEquipItem(index, item.slot);
      }
    } else if (sourceType === 'equipment') {
      handleUnequipItem(slot);
    }
  }, [gameState, handleUseItem, handleEquipItem, handleUnequipItem]);

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('get_game_state');
    });

    newSocket.on('game_state', (data) => {
      setGameState(data.gameState);
      setMessages(data.gameState.messages || []);
      setLoading(false);
    });

    newSocket.on('game_state_updated', (data) => {
      const responseRequestId = data.requestId;
      
      if (responseRequestId !== undefined && 
          pendingRequestIdRef.current !== null && 
          responseRequestId !== pendingRequestIdRef.current) {
        console.warn('Received response for outdated request, ignoring');
        return;
      }

      pendingRequestIdRef.current = null;
      isProcessingRef.current = false;
      currentActionTypeRef.current = null;

      setGameState(data.gameState);
      if (data.gameState.messages) {
        setMessages(data.gameState.messages);
      }
      if (data.gameState.gameOver) {
        setGameOver(true);
      }

      setTimeout(() => processQueue(newSocket), 0);
    });

    newSocket.on('move_failed', (data) => {
      console.log('Move failed:', data.message);
      
      pendingRequestIdRef.current = null;
      isProcessingRef.current = false;
      
      commandQueueRef.current = [];
    });

    newSocket.on('action_failed', (data) => {
      console.log('Action failed:', data.message);
      
      pendingRequestIdRef.current = null;
      isProcessingRef.current = false;
      currentActionTypeRef.current = null;
      
      setTimeout(() => processQueue(newSocket), 0);
    });

    newSocket.on('error', (data) => {
      setError(data.message || '发生错误');
      setLoading(false);
      
      pendingRequestIdRef.current = null;
      isProcessingRef.current = false;
      commandQueueRef.current = [];
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      isProcessingRef.current = false;
      commandQueueRef.current = [];
    });

    newSocket.on('connect_error', (err) => {
      setError('连接服务器失败: ' + err.message);
      setLoading(false);
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [gameId, playerId, processQueue]);

  useEffect(() => {
    if (messageLogRef.current) {
      messageLogRef.current.scrollTop = messageLogRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading || gameOver) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleMove('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleMove('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleMove('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleMove('right');
          break;
        case '7':
        case 'y':
        case 'Y':
          e.preventDefault();
          handleMove('up-left');
          break;
        case '9':
        case 'u':
        case 'U':
          e.preventDefault();
          handleMove('up-right');
          break;
        case '1':
        case 'b':
        case 'B':
          e.preventDefault();
          handleMove('down-left');
          break;
        case '3':
        case 'n':
        case 'N':
          e.preventDefault();
          handleMove('down-right');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, loading, gameOver]);

  if (loading) {
    return (
      <div className="connecting">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>正在连接游戏服务器...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="connecting">
        <div className="error-message" style={{ maxWidth: '400px' }}>
          <h3>连接错误</h3>
          <p>{error}</p>
          <button 
            className="btn" 
            style={{ marginTop: '20px' }}
            onClick={onBackToMenu}
          >
            返回菜单
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="connecting">
        <p>等待游戏状态...</p>
      </div>
    );
  }

  const { player, turn, level } = gameState;
  const hpPercent = (player.hp / player.maxHp) * 100;
  const xpNeeded = player.level * 100;
  const xpPercent = (player.xp / xpNeeded) * 100;

  const getEquipmentBonus = () => {
    let attackBonus = 0;
    let defenseBonus = 0;
    
    if (player.equipment) {
      for (const [slot, item] of Object.entries(player.equipment)) {
        if (item) {
          if (item.baseAttack) attackBonus += item.baseAttack;
          if (item.baseDefense) defenseBonus += item.baseDefense;
        }
      }
    }
    
    return { attackBonus, defenseBonus };
  };

  const bonuses = getEquipmentBonus();

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-info">
          <div className="info-item">
            <span className="info-label">玩家</span>
            <span className="info-value">{playerName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">等级</span>
            <span className="info-value">{player.level}</span>
          </div>
          <div className="info-item">
            <span className="info-label">回合</span>
            <span className="info-value">{turn}</span>
          </div>
          <div className="info-item">
            <span className="info-label">层数</span>
            <span className="info-value">{level}</span>
          </div>
        </div>
        <button className="btn back-btn" onClick={onBackToMenu}>
          返回菜单
        </button>
      </div>

      <div className="game-main">
        <div className="game-panel left-panel">
          <div className="panel-section">
            <h3 className="panel-title">装备</h3>
            <EquipmentPanel 
              equipment={player.equipment}
              playerStats={player}
              bonuses={bonuses}
              dragState={dragState}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onItemClick={handleItemClick}
            />
          </div>

          <div className="panel-section">
            <h3 className="panel-title">状态</h3>
            
            <div className="stat-bar">
              <div className="stat-label">
                <span>生命值</span>
                <span>{player.hp}/{player.maxHp}</span>
              </div>
              <div className="bar-container">
                <div 
                  className="bar-fill hp-bar" 
                  style={{ width: `${hpPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="stat-bar">
              <div className="stat-label">
                <span>经验值</span>
                <span>{player.xp}/{xpNeeded}</span>
              </div>
              <div className="bar-container">
                <div 
                  className="bar-fill xp-bar" 
                  style={{ width: `${Math.min(xpPercent, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h3 className="panel-title">属性</h3>
            <div className="player-stats">
              <div className="stat-item">
                <div className="stat-name">攻击力</div>
                <div className="stat-number">
                  {player.attack}
                  {bonuses.attackBonus > 0 && (
                    <span className="stat-bonus"> (+{bonuses.attackBonus})</span>
                  )}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-name">防御力</div>
                <div className="stat-number">
                  {player.defense}
                  {bonuses.defenseBonus > 0 && (
                    <span className="stat-bonus"> (+{bonuses.defenseBonus})</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="controls-hint">
            <h4>操作说明</h4>
            <p>
              <span className="key">↑</span><span className="key">↓</span>
              <span className="key">←</span><span className="key">→</span>
              或 <span className="key">W</span><span className="key">S</span>
              <span className="key">A</span><span className="key">D</span> 移动
            </p>
            <p>点击物品使用/装备</p>
            <p>拖拽物品交换位置</p>
          </div>
        </div>

        <div className="game-panel center-panel">
          <div className="canvas-container">
            <GameCanvas gameState={gameState} playerId={playerId} />
          </div>
        </div>

        <div className="game-panel right-panel">
          <div className="panel-section">
            <h3 className="panel-title">背包 ({player.inventory?.filter(i => i).length}/{player.inventory?.length || 20})</h3>
            <InventoryPanel 
              inventory={player.inventory}
              dragState={dragState}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onItemClick={handleItemClick}
              onDropItem={handleDropItem}
            />
          </div>

          <div className="panel-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <h3 className="panel-title">消息日志</h3>
            <div className="message-log" ref={messageLogRef}>
              {messages.map((msg, index) => (
                <div key={index} className={`message ${getMessageType(msg)}`}>
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <h2>游戏结束</h2>
            <p>你在第 {level} 层地城中倒下了</p>
            <p>存活了 {turn} 回合</p>
            <button className="btn" onClick={onBackToMenu}>
              返回菜单
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getMessageType(message) {
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('attack') || lowerMsg.includes('攻击') || 
      lowerMsg.includes('die') || lowerMsg.includes('死') ||
      lowerMsg.includes('damage') || lowerMsg.includes('伤害')) {
    return 'combat';
  }
  if (lowerMsg.includes('pick up') || lowerMsg.includes('拾取') ||
      lowerMsg.includes('item') || lowerMsg.includes('物品') ||
      lowerMsg.includes('装备') || lowerMsg.includes('equip')) {
    return 'item';
  }
  if (lowerMsg.includes('level') || lowerMsg.includes('等级') ||
      lowerMsg.includes('xp') || lowerMsg.includes('经验')) {
    return 'item';
  }
  return 'system';
}

export default Game;
