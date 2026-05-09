import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { GameManager } from './GameManager';
import { DefenseLayout, BattleResult } from './types';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const gameManager = new GameManager(io);

app.get('/', (req, res) => {
  res.json({ status: 'running', message: '异步塔防游戏服务器运行中' });
});

app.get('/leaderboard', (req, res) => {
  res.json(gameManager.getLeaderboard());
});

io.on('connection', (socket: Socket) => {
  console.log('新客户端连接:', socket.id);

  socket.on('join', (data: { playerName?: string }) => {
    const player = gameManager.handlePlayerConnect(socket, data.playerName || '');
    socket.emit('join_success', {
      playerId: player.id,
      playerName: player.name,
      leaderboard: gameManager.getLeaderboard(),
    });
  });

  socket.on('start_matchmaking', (data: { playerId: string }) => {
    gameManager.startMatchmaking(socket, data.playerId);
  });

  socket.on('cancel_matchmaking', (data: { playerId: string }) => {
    gameManager.cancelMatchmaking(data.playerId);
    socket.emit('matchmaking_cancelled', { message: '已取消匹配' });
  });

  socket.on('submit_layout', (data: { playerId: string; layout: DefenseLayout }) => {
    gameManager.submitLayout(data.playerId, data.layout);
  });

  socket.on('submit_battle_result', (data: { playerId: string; result: BattleResult }) => {
    gameManager.submitBattleResult(data.playerId, data.result);
  });

  socket.on('get_leaderboard', () => {
    socket.emit('leaderboard_update', {
      leaderboard: gameManager.getLeaderboard(),
    });
  });

  socket.on('disconnect', () => {
    console.log('客户端断开连接:', socket.id);
    gameManager.handlePlayerDisconnect(socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`HTTP服务器: http://localhost:${PORT}`);
});
