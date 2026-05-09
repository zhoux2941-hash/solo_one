import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  Player,
  GameRoom,
  DefenseLayout,
  BattleResult,
  LeaderboardEntry,
  RoomStatus,
  GameState,
} from './types';

export class GameManager {
  private io: Server;
  private gameState: GameState;

  constructor(io: Server) {
    this.io = io;
    this.gameState = {
      players: new Map(),
      rooms: new Map(),
      matchingQueue: [],
      leaderboard: this.loadLeaderboard(),
    };
  }

  private loadLeaderboard(): LeaderboardEntry[] {
    const mockLeaderboard: LeaderboardEntry[] = [
      { playerId: 'bot_1', playerName: '战神', wins: 99, losses: 1, rating: 2800 },
      { playerId: 'bot_2', playerName: '塔王', wins: 85, losses: 15, rating: 2600 },
      { playerId: 'bot_3', playerName: '防御大师', wins: 70, losses: 30, rating: 2400 },
      { playerId: 'bot_4', playerName: '守家小能手', wins: 50, losses: 50, rating: 2000 },
      { playerId: 'bot_5', playerName: '新手玩家', wins: 10, losses: 90, rating: 1200 },
    ];
    return mockLeaderboard;
  }

  public handlePlayerConnect(socket: Socket, playerName: string): Player {
    const playerId = uuidv4();
    const player: Player = {
      id: playerId,
      socketId: socket.id,
      name: playerName || `玩家_${playerId.substring(0, 4)}`,
      ready: false,
    };

    this.gameState.players.set(playerId, player);
    console.log(`玩家 ${player.name} 连接，ID: ${playerId}`);

    return player;
  }

  public handlePlayerDisconnect(socket: Socket): void {
    let disconnectedPlayer: Player | undefined;
    for (const [, player] of this.gameState.players) {
      if (player.socketId === socket.id) {
        disconnectedPlayer = player;
        break;
      }
    }

    if (disconnectedPlayer) {
      console.log(`玩家 ${disconnectedPlayer.name} 断开连接`);
      this.removeFromQueue(disconnectedPlayer);
      this.gameState.players.delete(disconnectedPlayer.id);

      for (const [roomId, room] of this.gameState.rooms) {
        if (room.players.has(disconnectedPlayer.id)) {
          const remainingPlayer: Player | undefined = Array.from(room.players.values()).find(
            (p) => p.id !== disconnectedPlayer!.id
          );

          if (remainingPlayer) {
            this.io.to(remainingPlayer.socketId).emit('opponent_disconnected', {
              message: '对手断开连接，你获得胜利！',
            });

            this.updateLeaderboard(remainingPlayer.id, true);
            this.updateLeaderboard(disconnectedPlayer.id, false);
          }

          this.gameState.rooms.delete(roomId);
          break;
        }
      }
    }
  }

  public startMatchmaking(socket: Socket, playerId: string): void {
    const player = this.gameState.players.get(playerId);
    if (!player) return;

    if (this.isInRoom(playerId) || this.isInQueue(playerId)) {
      return;
    }

    this.gameState.matchingQueue.push(player);
    console.log(`玩家 ${player.name} 加入匹配队列，当前队列长度: ${this.gameState.matchingQueue.length}`);

    this.io.to(socket.id).emit('matchmaking_started', {
      message: '正在寻找对手...',
    });

    this.tryMatchPlayers();
  }

  public cancelMatchmaking(playerId: string): void {
    const player = this.gameState.players.get(playerId);
    if (!player) return;

    this.removeFromQueue(player);
  }

  private isInQueue(playerId: string): boolean {
    return this.gameState.matchingQueue.some((p) => p.id === playerId);
  }

  private isInRoom(playerId: string): boolean {
    for (const [, room] of this.gameState.rooms) {
      if (room.players.has(playerId)) {
        return true;
      }
    }
    return false;
  }

  private removeFromQueue(player: Player): void {
    const index = this.gameState.matchingQueue.findIndex((p) => p.id === player.id);
    if (index !== -1) {
      this.gameState.matchingQueue.splice(index, 1);
    }
  }

  private tryMatchPlayers(): void {
    if (this.gameState.matchingQueue.length < 2) return;

    const player1 = this.gameState.matchingQueue.shift()!;
    const player2 = this.gameState.matchingQueue.shift()!;

    this.createRoom(player1, player2);
  }

  private createRoom(player1: Player, player2: Player): GameRoom {
    const roomId = uuidv4();
    const room: GameRoom = {
      id: roomId,
      players: new Map(),
      status: 'waiting',
      createdAt: Date.now(),
    };

    room.players.set(player1.id, player1);
    room.players.set(player2.id, player2);

    this.gameState.rooms.set(roomId, room);

    console.log(`房间 ${roomId} 创建成功，玩家: ${player1.name} vs ${player2.name}`);

    for (const player of room.players.values()) {
      const opponent = Array.from(room.players.values()).find((p) => p.id !== player.id)!;
      this.io.to(player.socketId).emit('match_found', {
        roomId: roomId,
        opponent: {
          id: opponent.id,
          name: opponent.name,
        },
        message: '找到对手！准备开始布防',
      });
    }

    return room;
  }

  public submitLayout(playerId: string, layout: DefenseLayout): void {
    const player = this.gameState.players.get(playerId);
    if (!player) return;

    let targetRoom: GameRoom | undefined;
    for (const [, room] of this.gameState.rooms) {
      if (room.players.has(playerId)) {
        targetRoom = room;
        break;
      }
    }

    if (!targetRoom) return;

    player.layout = layout;
    player.ready = true;

    const allReady = Array.from(targetRoom.players.values()).every((p) => p.ready);

    if (allReady) {
      targetRoom.status = 'ready';
      this.startBattle(targetRoom);
    } else {
      this.io.to(player.socketId).emit('layout_submitted', {
        message: '阵型已保存，等待对手...',
      });
    }
  }

  private startBattle(room: GameRoom): void {
    const players = Array.from(room.players.values());
    const player1 = players[0];
    const player2 = players[1];

    room.status = 'playing';

    this.io.to(player1.socketId).emit('battle_start', {
      myLayout: player1.layout,
      opponentLayout: player2.layout,
    });

    this.io.to(player2.socketId).emit('battle_start', {
      myLayout: player2.layout,
      opponentLayout: player1.layout,
    });

    console.log(`房间 ${room.id} 战斗开始!`);
  }

  public submitBattleResult(playerId: string, result: BattleResult): void {
    const player = this.gameState.players.get(playerId);
    if (!player) return;

    let targetRoom: GameRoom | undefined;
    for (const [roomId, room] of this.gameState.rooms) {
      if (room.players.has(playerId)) {
        targetRoom = room;
        break;
      }
    }

    if (!targetRoom) return;

    targetRoom.status = 'finished';

    const players = Array.from(targetRoom.players.values());
    const winnerId = result.winnerId;
    const loserId = players.find((p) => p.id !== winnerId)?.id;

    if (winnerId) this.updateLeaderboard(winnerId, true);
    if (loserId) this.updateLeaderboard(loserId, false);

    for (const p of players) {
      this.io.to(p.socketId).emit('battle_finished', {
        result: result,
        leaderboard: this.gameState.leaderboard.slice(0, 10),
      });
    }

    for (const p of players) {
      p.ready = false;
      p.layout = undefined;
    }

    setTimeout(() => {
      this.gameState.rooms.delete(targetRoom!.id);
    }, 5000);
  }

  private updateLeaderboard(playerId: string, isWin: boolean): void {
    let entry = this.gameState.leaderboard.find((e) => e.playerId === playerId);
    const player = this.gameState.players.get(playerId);

    if (!entry) {
      if (!player) return;
      entry = {
        playerId: playerId,
        playerName: player.name,
        wins: 0,
        losses: 0,
        rating: 1500,
      };
      this.gameState.leaderboard.push(entry);
    }

    if (isWin) {
      entry.wins++;
      entry.rating += 25;
    } else {
      entry.losses++;
      entry.rating = Math.max(1000, entry.rating - 15);
    }

    this.gameState.leaderboard.sort((a, b) => b.rating - a.rating);
  }

  public getLeaderboard(): LeaderboardEntry[] {
    return this.gameState.leaderboard.slice(0, 10);
  }

  public getRoom(playerId: string): GameRoom | undefined {
    for (const [, room] of this.gameState.rooms) {
      if (room.players.has(playerId)) {
        return room;
      }
    }
    return undefined;
  }
}
