import { Server, Socket } from 'socket.io';
import { roomManager, gameRecordManager } from '../core';
import { MahjongTile } from '../models/MahjongTile';
import { logger } from '../utils';
import { GAME_STATES } from '../config';

interface PlayerInfo {
  id: string;
  name: string;
  socket: Socket;
}

export class SocketHandler {
  private io: Server;
  private players: Map<string, PlayerInfo>;

  constructor(io: Server) {
    this.io = io;
    this.players = new Map();
  }

  handleConnection(socket: Socket): void {
    logger.info(`New connection: ${socket.id}`);

    socket.on('player:join', (data: { name: string }, callback: any) => {
      this.handlePlayerJoin(socket, data, callback);
    });

    socket.on('player:leave', (callback: any) => {
      this.handlePlayerLeave(socket, callback);
    });

    socket.on('room:create', (data: { name?: string }, callback: any) => {
      this.handleCreateRoom(socket, data, callback);
    });

    socket.on('room:join', (data: { roomId: string }, callback: any) => {
      this.handleJoinRoom(socket, data, callback);
    });

    socket.on('room:list', (callback: any) => {
      this.handleListRooms(socket, callback);
    });

    socket.on('room:leave', (callback: any) => {
      this.handleLeaveRoom(socket, callback);
    });

    socket.on('game:ready', (data: { ready: boolean }, callback: any) => {
      this.handleReady(socket, data, callback);
    });

    socket.on('game:start', (callback: any) => {
      this.handleStartGame(socket, callback);
    });

    socket.on('game:discard', (data: { tileId: string }, callback: any) => {
      this.handleDiscard(socket, data, callback);
    });

    socket.on('game:action', (data: { action: string; tileType?: string; tileRank?: number }, callback: any) => {
      this.handleAction(socket, data, callback);
    });

    socket.on('game:next_round', (callback: any) => {
      this.handleNextRound(socket, callback);
    });

    socket.on('history:list', (data: { limit?: number; offset?: number }, callback: any) => {
      this.handleHistoryList(socket, data, callback);
    });

    socket.on('history:get', (data: { recordId: string }, callback: any) => {
      this.handleHistoryGet(socket, data, callback);
    });

    socket.on('stats:get', (callback: any) => {
      this.handleStatsGet(socket, callback);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private async handleHistoryList(
    socket: Socket, 
    data: { limit?: number; offset?: number }, 
    callback: any
  ): Promise<void> {
    const player = this.players.get(socket.id);
    if (!player) {
      callback({ success: false, message: '玩家未登录' });
      return;
    }

    try {
      const result = await gameRecordManager.queryRecords({
        playerId: socket.id,
        limit: data.limit || 20,
        offset: data.offset || 0,
        includeOperations: false,
      });

      callback({
        success: true,
        records: result.records,
        total: result.total,
        hasMore: result.hasMore,
      });
    } catch (error) {
      logger.error('Failed to query history:', error);
      callback({ success: false, message: '查询历史记录失败' });
    }
  }

  private async handleHistoryGet(
    socket: Socket, 
    data: { recordId: string }, 
    callback: any
  ): Promise<void> {
    const player = this.players.get(socket.id);
    if (!player) {
      callback({ success: false, message: '玩家未登录' });
      return;
    }

    try {
      const record = await gameRecordManager.getRecord(data.recordId, true);
      
      if (!record) {
        callback({ success: false, message: '记录不存在' });
        return;
      }

      const isParticipant = record.players.some(p => p.playerId === socket.id);
      if (!isParticipant) {
        callback({ success: false, message: '无权查看此记录' });
        return;
      }

      callback({
        success: true,
        record,
      });
    } catch (error) {
      logger.error('Failed to get record:', error);
      callback({ success: false, message: '获取记录详情失败' });
    }
  }

  private async handleStatsGet(
    socket: Socket, 
    callback: any
  ): Promise<void> {
    const player = this.players.get(socket.id);
    if (!player) {
      callback({ success: false, message: '玩家未登录' });
      return;
    }

    try {
      const stats = await gameRecordManager.getPlayerStatistics(socket.id);
      
      callback({
        success: true,
        stats: stats || {
          playerId: socket.id,
          playerName: player.name,
          totalGames: 0,
          wins: 0,
          losses: 0,
          totalScore: 0,
          highestScore: 0,
          lowestScore: 0,
          totalFan: 0,
          highestFan: 0,
          maxWinStreak: 0,
          currentWinStreak: 0,
          lastPlayed: 0,
        },
      });
    } catch (error) {
      logger.error('Failed to get stats:', error);
      callback({ success: false, message: '获取统计信息失败' });
    }
  }

  private handlePlayerJoin(socket: Socket, data: { name: string }, callback: any): void {
    const playerName = data.name || `玩家${socket.id.slice(0, 4)}`;
    const playerInfo: PlayerInfo = {
      id: socket.id,
      name: playerName,
      socket: socket,
    };
    
    this.players.set(socket.id, playerInfo);
    logger.info(`Player joined: ${playerName} (${socket.id})`);
    
    callback({
      success: true,
      player: {
        id: socket.id,
        name: playerName,
      },
    });
  }

  private handlePlayerLeave(socket: Socket, callback: any): void {
    this.players.delete(socket.id);
    
    callback({
      success: true,
    });
  }

  private async handleCreateRoom(socket: Socket, data: { name?: string }, callback: any): Promise<void> {
    const player = this.players.get(socket.id);
    if (!player) {
      callback({ success: false, message: '玩家未登录' });
      return;
    }

    const existingRoom = roomManager.getPlayerRoom(socket.id);
    if (existingRoom) {
      callback({ success: false, message: '已经在房间中' });
      return;
    }

    try {
      const room = await roomManager.createRoom(socket.id, player.name, data.name);
      
      socket.join(room.id);
      
      callback({
        success: true,
        room: room.getPlayerView(socket.id),
      });

      this.broadcastRoomUpdate(room.id);
    } catch (error) {
      logger.error('Create room error:', error);
      callback({ success: false, message: '创建房间失败' });
    }
  }

  private async handleJoinRoom(socket: Socket, data: { roomId: string }, callback: any): Promise<void> {
    const player = this.players.get(socket.id);
    if (!player) {
      callback({ success: false, message: '玩家未登录' });
      return;
    }

    const existingRoom = roomManager.getPlayerRoom(socket.id);
    if (existingRoom) {
      callback({ success: false, message: '已经在房间中' });
      return;
    }

    const room = roomManager.getRoom(data.roomId);
    if (!room) {
      callback({ success: false, message: '房间不存在' });
      return;
    }

    if (room.isFull()) {
      callback({ success: false, message: '房间已满' });
      return;
    }

    await roomManager.joinRoom(data.roomId, socket.id, player.name);
    socket.join(room.id);
    
    callback({
      success: true,
      room: room.getPlayerView(socket.id),
    });

    this.broadcastRoomUpdate(room.id);
  }

  private handleListRooms(socket: Socket, callback: any): void {
    const rooms = roomManager.listAvailableRooms().map(room => room.getPublicState());
    
    callback({
      success: true,
      rooms,
    });
  }

  private async handleLeaveRoom(socket: Socket, callback: any): Promise<void> {
    const room = roomManager.getPlayerRoom(socket.id);
    if (!room) {
      callback({ success: false, message: '不在房间中' });
      return;
    }

    const roomId = room.id;
    await roomManager.leaveRoom(roomId, socket.id);
    socket.leave(roomId);
    
    callback({
      success: true,
    });

    const remainingRoom = roomManager.getRoom(roomId);
    if (remainingRoom) {
      this.broadcastRoomUpdate(roomId);
    }
  }

  private async handleReady(socket: Socket, data: { ready: boolean }, callback: any): Promise<void> {
    const room = roomManager.getPlayerRoom(socket.id);
    if (!room) {
      callback({ success: false, message: '不在房间中' });
      return;
    }

    if (room.gameState !== GAME_STATES.WAITING) {
      callback({ success: false, message: '游戏已开始' });
      return;
    }

    room.setPlayerReady(socket.id, data.ready);
    
    callback({
      success: true,
    });

    this.broadcastRoomUpdate(room.id);
  }

  private handleStartGame(socket: Socket, callback: any): void {
    const room = roomManager.getPlayerRoom(socket.id);
    if (!room) {
      callback({ success: false, message: '不在房间中' });
      return;
    }

    const player = room.getPlayer(socket.id);
    if (!player?.isHost) {
      callback({ success: false, message: '只有房主可以开始游戏' });
      return;
    }

    if (!room.isFull()) {
      callback({ success: false, message: '人数不足' });
      return;
    }

    if (!room.allReady()) {
      callback({ success: false, message: '还有玩家未准备' });
      return;
    }

    room.startGame();
    
    callback({
      success: true,
    });

    this.broadcastGameStart(room.id);
  }

  private handleDiscard(socket: Socket, data: { tileId: string }, callback: any): void {
    const room = roomManager.getPlayerRoom(socket.id);
    if (!room) {
      callback({ success: false, message: '不在房间中' });
      return;
    }

    if (!room.validateDiscard(socket.id, data.tileId)) {
      callback({ success: false, message: '非法操作' });
      return;
    }

    const success = room.discardTile(socket.id, data.tileId);
    if (!success) {
      callback({ success: false, message: '出牌失败' });
      return;
    }
    
    callback({
      success: true,
    });

    this.broadcastDiscard(room.id, socket.id, data.tileId);
  }

  private handleAction(socket: Socket, data: { action: string; tileType?: string; tileRank?: number }, callback: any): void {
    const room = roomManager.getPlayerRoom(socket.id);
    if (!room) {
      callback({ success: false, message: '不在房间中' });
      return;
    }

    if (!room.validateAction(socket.id, data.action)) {
      callback({ success: false, message: '非法操作' });
      return;
    }

    let tile: MahjongTile | null = null;
    if (data.tileType && data.tileRank) {
      tile = new MahjongTile(
        data.tileType as any,
        data.tileRank as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
      );
    }

    const success = room.respondAction(socket.id, data.action, tile);
    if (!success) {
      callback({ success: false, message: '操作失败' });
      return;
    }
    
    callback({
      success: true,
    });

    this.broadcastAction(room.id, socket.id, data.action);
  }

  private handleNextRound(socket: Socket, callback: any): void {
    const room = roomManager.getPlayerRoom(socket.id);
    if (!room) {
      callback({ success: false, message: '不在房间中' });
      return;
    }

    const player = room.getPlayer(socket.id);
    if (!player?.isHost) {
      callback({ success: false, message: '只有房主可以开始下一局' });
      return;
    }

    const success = room.nextRound();
    if (!success) {
      callback({ success: false, message: '游戏未结束' });
      return;
    }
    
    callback({
      success: true,
    });

    this.broadcastRoomUpdate(room.id);
  }

  private handleDisconnect(socket: Socket): void {
    logger.info(`Player disconnected: ${socket.id}`);
    
    const player = this.players.get(socket.id);
    if (!player) return;
    
    const room = roomManager.getPlayerRoom(socket.id);
    if (room) {
      const roomId = room.id;
      roomManager.leaveRoom(roomId, socket.id).then(() => {
        const remainingRoom = roomManager.getRoom(roomId);
        if (remainingRoom) {
          this.broadcastRoomUpdate(roomId);
        }
      });
    }
    
    this.players.delete(socket.id);
  }

  private broadcastRoomUpdate(roomId: string): void {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    for (const player of room.players) {
      const playerView = room.getPlayerView(player.id);
      this.io.to(player.id).emit('room:update', {
        room: playerView,
      });
    }
  }

  private broadcastGameStart(roomId: string): void {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    this.io.to(roomId).emit('game:started', {
      gameState: 'playing',
    });

    for (const player of room.players) {
      const playerView = room.getPlayerView(player.id);
      this.io.to(player.id).emit('game:initial_state', playerView);
    }
  }

  private broadcastDiscard(roomId: string, playerId: string, tileId: string): void {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const player = room.getPlayer(playerId);
    if (!player || !player.lastActionTile) return;

    this.io.to(roomId).emit('game:discarded', {
      playerId: playerId,
      playerSeat: player.seatIndex,
      tile: {
        type: player.lastActionTile.type,
        rank: player.lastActionTile.rank,
      },
    });

    for (const p of room.players) {
      const playerView = room.getPlayerView(p.id);
      this.io.to(p.id).emit('game:state_update', playerView);
    }
  }

  private broadcastAction(roomId: string, playerId: string, action: string): void {
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const player = room.getPlayer(playerId);
    if (!player) return;

    this.io.to(roomId).emit('game:action_taken', {
      playerId: playerId,
      playerSeat: player.seatIndex,
      action: action,
      tile: player.lastActionTile ? {
        type: player.lastActionTile.type,
        rank: player.lastActionTile.rank,
      } : null,
    });

    for (const p of room.players) {
      const playerView = room.getPlayerView(p.id);
      this.io.to(p.id).emit('game:state_update', playerView);
    }
  }
}
