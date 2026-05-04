import { Room, RoomState } from '../models/Room';
import { PlayerState } from '../models/Player';
import { redisManager, logger } from '../utils';
import { v4 as uuidv4 } from 'uuid';

class RoomManager {
  private rooms: Map<string, Room>;
  private readonly ROOM_KEY_PREFIX = 'mahjong:room:';
  private readonly PLAYER_ROOM_PREFIX = 'mahjong:player:';

  constructor() {
    this.rooms = new Map();
  }

  async createRoom(hostId: string, hostName: string, roomName?: string): Promise<Room> {
    const roomId = this.generateRoomId();
    const name = roomName || `房间 ${roomId.slice(0, 6)}`;
    
    const room = new Room(roomId, name, hostId);
    room.addPlayer(hostId, hostName);
    
    this.rooms.set(roomId, room);
    await this.saveRoom(room);
    await this.setPlayerRoom(hostId, roomId);
    
    logger.logGame(roomId, `Created by ${hostName}`);
    return room;
  }

  async joinRoom(roomId: string, playerId: string, playerName: string): Promise<Room | null> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }
    
    if (!room.addPlayer(playerId, playerName)) {
      return null;
    }
    
    await this.saveRoom(room);
    await this.setPlayerRoom(playerId, roomId);
    
    return room;
  }

  async leaveRoom(roomId: string, playerId: string): Promise<Room | null> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }
    
    const player = room.getPlayer(playerId);
    if (!player) {
      return null;
    }
    
    room.removePlayer(playerId);
    await this.removePlayerRoom(playerId);
    
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      await this.deleteRoom(roomId);
      logger.logGame(roomId, 'Room deleted - no players left');
      return null;
    }
    
    await this.saveRoom(room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getPlayerRoom(playerId: string): Room | null {
    for (const room of this.rooms.values()) {
      if (room.getPlayer(playerId)) {
        return room;
      }
    }
    return null;
  }

  listRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  listAvailableRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(r => !r.isFull() && r.gameState === 'waiting');
  }

  private generateRoomId(): string {
    return uuidv4().replace(/-/g, '').slice(0, 8);
  }

  private async saveRoom(room: Room): Promise<void> {
    const key = `${this.ROOM_KEY_PREFIX}${room.id}`;
    await redisManager.set(key, JSON.stringify(room.toJSON()));
  }

  private async deleteRoom(roomId: string): Promise<void> {
    const key = `${this.ROOM_KEY_PREFIX}${roomId}`;
    await redisManager.del(key);
  }

  private async setPlayerRoom(playerId: string, roomId: string): Promise<void> {
    const key = `${this.PLAYER_ROOM_PREFIX}${playerId}`;
    await redisManager.set(key, roomId);
  }

  private async removePlayerRoom(playerId: string): Promise<void> {
    const key = `${this.PLAYER_ROOM_PREFIX}${playerId}`;
    await redisManager.del(key);
  }

  async loadRoomsFromRedis(): Promise<void> {
    logger.info('Loading rooms from Redis...');
  }
}

export const roomManager = new RoomManager();
