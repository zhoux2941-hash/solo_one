const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('redis');
const GameManager = require('./GameManager');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8080;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient;
let gameManager;

async function init() {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
    console.log('Connected to Redis');

    gameManager = new GameManager(redisClient);

    io.on('connection', handleConnection);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
}

function handleConnection(socket) {
  console.log(`Player connected: ${socket.id}`);
  let playerId = null;
  let gameId = null;

  socket.on('create_game', async (data) => {
    try {
      const { playerName } = data;
      playerId = uuidv4();
      gameId = uuidv4();

      await gameManager.createGame(gameId, playerId, playerName);
      
      socket.join(gameId);
      
      const gameState = await gameManager.getGameState(gameId);
      
      socket.emit('game_created', {
        gameId,
        playerId,
        gameState
      });
      
      console.log(`Game created: ${gameId} by ${playerName}`);
    } catch (error) {
      console.error('Create game error:', error);
      socket.emit('error', { message: 'Failed to create game' });
    }
  });

  socket.on('join_game', async (data) => {
    try {
      const { gameId: joinGameId, playerName } = data;
      playerId = uuidv4();
      gameId = joinGameId;

      const exists = await gameManager.gameExists(gameId);
      if (!exists) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      socket.join(gameId);
      
      const gameState = await gameManager.getGameState(gameId);
      
      socket.emit('game_joined', {
        gameId,
        playerId,
        gameState
      });
      
      console.log(`Player ${playerName} joined game: ${gameId}`);
    } catch (error) {
      console.error('Join game error:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  socket.on('move_player', async (data) => {
    try {
      const { direction, requestId } = data;
      if (!gameId || !playerId) {
        socket.emit('error', { message: 'Game not initialized', requestId });
        return;
      }

      const result = await gameManager.processPlayerMove(gameId, playerId, direction);
      
      if (result.success) {
        io.to(gameId).emit('game_state_updated', {
          gameState: result.gameState,
          requestId
        });
      } else {
        socket.emit('move_failed', { message: result.message, requestId });
      }
    } catch (error) {
      console.error('Move player error:', error);
      socket.emit('error', { message: 'Failed to process move', requestId: data?.requestId });
    }
  });

  socket.on('get_game_state', async () => {
    try {
      if (!gameId) {
        socket.emit('error', { message: 'Game not initialized' });
        return;
      }
      
      const gameState = await gameManager.getGameState(gameId);
      socket.emit('game_state', { gameState });
    } catch (error) {
      console.error('Get game state error:', error);
      socket.emit('error', { message: 'Failed to get game state' });
    }
  });

  socket.on('equip_item', async (data) => {
    try {
      const { inventorySlot, targetSlot, requestId } = data;
      if (!gameId || !playerId) {
        socket.emit('error', { message: 'Game not initialized', requestId });
        return;
      }

      const result = await gameManager.handleEquipItem(gameId, playerId, inventorySlot, targetSlot);
      
      if (result.success) {
        io.to(gameId).emit('game_state_updated', {
          gameState: result.gameState,
          requestId
        });
      } else {
        socket.emit('action_failed', { message: result.message, requestId });
      }
    } catch (error) {
      console.error('Equip item error:', error);
      socket.emit('error', { message: 'Failed to equip item', requestId: data?.requestId });
    }
  });

  socket.on('unequip_item', async (data) => {
    try {
      const { slot, requestId } = data;
      if (!gameId || !playerId) {
        socket.emit('error', { message: 'Game not initialized', requestId });
        return;
      }

      const result = await gameManager.handleUnequipItem(gameId, playerId, slot);
      
      if (result.success) {
        io.to(gameId).emit('game_state_updated', {
          gameState: result.gameState,
          requestId
        });
      } else {
        socket.emit('action_failed', { message: result.message, requestId });
      }
    } catch (error) {
      console.error('Unequip item error:', error);
      socket.emit('error', { message: 'Failed to unequip item', requestId: data?.requestId });
    }
  });

  socket.on('use_item', async (data) => {
    try {
      const { inventorySlot, requestId } = data;
      if (!gameId || !playerId) {
        socket.emit('error', { message: 'Game not initialized', requestId });
        return;
      }

      const result = await gameManager.handleUseItem(gameId, playerId, inventorySlot);
      
      if (result.success) {
        io.to(gameId).emit('game_state_updated', {
          gameState: result.gameState,
          requestId
        });
      } else {
        socket.emit('action_failed', { message: result.message, requestId });
      }
    } catch (error) {
      console.error('Use item error:', error);
      socket.emit('error', { message: 'Failed to use item', requestId: data?.requestId });
    }
  });

  socket.on('drop_item', async (data) => {
    try {
      const { inventorySlot, requestId } = data;
      if (!gameId || !playerId) {
        socket.emit('error', { message: 'Game not initialized', requestId });
        return;
      }

      const result = await gameManager.handleDropItem(gameId, playerId, inventorySlot);
      
      if (result.success) {
        io.to(gameId).emit('game_state_updated', {
          gameState: result.gameState,
          requestId
        });
      } else {
        socket.emit('action_failed', { message: result.message, requestId });
      }
    } catch (error) {
      console.error('Drop item error:', error);
      socket.emit('error', { message: 'Failed to drop item', requestId: data?.requestId });
    }
  });

  socket.on('swap_inventory_items', async (data) => {
    try {
      const { slot1, slot2, requestId } = data;
      if (!gameId || !playerId) {
        socket.emit('error', { message: 'Game not initialized', requestId });
        return;
      }

      const result = await gameManager.handleSwapInventoryItems(gameId, playerId, slot1, slot2);
      
      if (result.success) {
        io.to(gameId).emit('game_state_updated', {
          gameState: result.gameState,
          requestId
        });
      } else {
        socket.emit('action_failed', { message: result.message, requestId });
      }
    } catch (error) {
      console.error('Swap items error:', error);
      socket.emit('error', { message: 'Failed to swap items', requestId: data?.requestId });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
  });
}

init();
