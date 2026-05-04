import { GameRecord, PlayerGameResult } from '../models/GameRecord';
import { redisManager, logger } from '../utils';

export interface PlayerStatistics {
  playerId: string;
  playerName: string;
  totalGames: number;
  wins: number;
  losses: number;
  totalScore: number;
  highestScore: number;
  lowestScore: number;
  totalFan: number;
  highestFan: number;
  maxWinStreak: number;
  currentWinStreak: number;
  lastPlayed: number;
}

export interface GameHistoryQuery {
  playerId?: string;
  roomId?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
  includeOperations?: boolean;
}

export interface GameHistoryResult {
  records: GameRecord[];
  total: number;
  hasMore: boolean;
}

class GameRecordManager {
  private readonly RECORD_PREFIX = 'mahjong:record:';
  private readonly PLAYER_HISTORY_PREFIX = 'mahjong:player_history:';
  private readonly PLAYER_STATS_PREFIX = 'mahjong:player_stats:';
  private readonly ROOM_HISTORY_PREFIX = 'mahjong:room_history:';

  private cachedRecords: Map<string, GameRecord> = new Map();

  constructor() {
    this.cachedRecords = new Map();
  }

  async saveRecord(record: GameRecord): Promise<boolean> {
    try {
      this.cachedRecords.set(record.id, record);

      const recordKey = `${this.RECORD_PREFIX}${record.id}`;
      await redisManager.set(recordKey, JSON.stringify(record));

      for (const player of record.players) {
        const playerHistoryKey = `${this.PLAYER_HISTORY_PREFIX}${player.playerId}`;
        await redisManager.sadd(playerHistoryKey, record.id);
        await this.updatePlayerStatistics(player, record);
      }

      const roomHistoryKey = `${this.ROOM_HISTORY_PREFIX}${record.roomId}`;
      await redisManager.sadd(roomHistoryKey, record.id);

      logger.info(`Saved game record: ${record.id} (${record.players.length} players)`);
      return true;
    } catch (error) {
      logger.error('Failed to save game record:', error);
      this.cachedRecords.set(record.id, record);
      return false;
    }
  }

  async getRecord(recordId: string, includeOperations: boolean = true): Promise<GameRecord | null> {
    try {
      if (this.cachedRecords.has(recordId)) {
        const cached = this.cachedRecords.get(recordId)!;
        if (!includeOperations) {
          return { ...cached, operations: [] };
        }
        return cached;
      }

      const recordKey = `${this.RECORD_PREFIX}${recordId}`;
      const recordJson = await redisManager.get(recordKey);
      
      if (!recordJson) {
        return null;
      }

      const record = JSON.parse(recordJson) as GameRecord;
      this.cachedRecords.set(recordId, record);

      if (!includeOperations) {
        return { ...record, operations: [] };
      }

      return record;
    } catch (error) {
      logger.error(`Failed to get record ${recordId}:`, error);
      return this.cachedRecords.get(recordId) || null;
    }
  }

  async queryRecords(query: GameHistoryQuery): Promise<GameHistoryResult> {
    try {
      let recordIds: string[] = [];

      if (query.playerId) {
        const playerHistoryKey = `${this.PLAYER_HISTORY_PREFIX}${query.playerId}`;
        recordIds = await redisManager.smembers(playerHistoryKey);
      } else if (query.roomId) {
        const roomHistoryKey = `${this.ROOM_HISTORY_PREFIX}${query.roomId}`;
        recordIds = await redisManager.smembers(roomHistoryKey);
      } else {
        return { records: [], total: 0, hasMore: false };
      }

      const allRecords: Array<{ record: GameRecord; timestamp: number }> = [];
      
      for (const recordId of recordIds) {
        const record = await this.getRecord(recordId, query.includeOperations || false);
        if (!record) continue;

        let inTimeRange = true;
        if (query.startTime && record.startTime < query.startTime) {
          inTimeRange = false;
        }
        if (query.endTime && record.startTime > query.endTime) {
          inTimeRange = false;
        }

        if (inTimeRange) {
          allRecords.push({ record, timestamp: record.startTime });
        }
      }

      allRecords.sort((a, b) => b.timestamp - a.timestamp);

      const limit = query.limit || 50;
      const offset = query.offset || 0;
      
      const paginatedRecords = allRecords.slice(offset, offset + limit).map(r => r.record);

      return {
        records: paginatedRecords,
        total: allRecords.length,
        hasMore: offset + limit < allRecords.length,
      };
    } catch (error) {
      logger.error('Failed to query records:', error);
      return { records: [], total: 0, hasMore: false };
    }
  }

  async getPlayerStatistics(playerId: string): Promise<PlayerStatistics | null> {
    try {
      const statsKey = `${this.PLAYER_STATS_PREFIX}${playerId}`;
      const statsJson = await redisManager.hgetall(statsKey);
      
      if (Object.keys(statsJson).length === 0) {
        return null;
      }

      return {
        playerId: statsJson.playerId,
        playerName: statsJson.playerName || 'Unknown',
        totalGames: parseInt(statsJson.totalGames) || 0,
        wins: parseInt(statsJson.wins) || 0,
        losses: parseInt(statsJson.losses) || 0,
        totalScore: parseInt(statsJson.totalScore) || 0,
        highestScore: parseInt(statsJson.highestScore) || 0,
        lowestScore: parseInt(statsJson.lowestScore) || 0,
        totalFan: parseInt(statsJson.totalFan) || 0,
        highestFan: parseInt(statsJson.highestFan) || 0,
        maxWinStreak: parseInt(statsJson.maxWinStreak) || 0,
        currentWinStreak: parseInt(statsJson.currentWinStreak) || 0,
        lastPlayed: parseInt(statsJson.lastPlayed) || 0,
      };
    } catch (error) {
      logger.error(`Failed to get stats for player ${playerId}:`, error);
      return null;
    }
  }

  private async updatePlayerStatistics(
    playerResult: PlayerGameResult,
    record: GameRecord
  ): Promise<void> {
    try {
      const statsKey = `${this.PLAYER_STATS_PREFIX}${playerResult.playerId}`;
      
      const existingStats = await this.getPlayerStatistics(playerResult.playerId);
      
      const stats: PlayerStatistics = existingStats || {
        playerId: playerResult.playerId,
        playerName: playerResult.playerName,
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
      };

      stats.totalGames++;
      stats.totalScore += playerResult.scoreChange;
      stats.lastPlayed = record.endTime || Date.now();

      if (playerResult.isWinner) {
        stats.wins++;
        stats.currentWinStreak++;
        if (stats.currentWinStreak > stats.maxWinStreak) {
          stats.maxWinStreak = stats.currentWinStreak;
        }
        
        if (playerResult.finalScore > stats.highestScore) {
          stats.highestScore = playerResult.finalScore;
        }
        
        if (playerResult.fanCount && playerResult.fanCount > 0) {
          stats.totalFan += playerResult.fanCount;
          if (playerResult.fanCount > stats.highestFan) {
            stats.highestFan = playerResult.fanCount;
          }
        }
      } else {
        stats.losses++;
        stats.currentWinStreak = 0;
        
        if (playerResult.finalScore < stats.lowestScore) {
          stats.lowestScore = playerResult.finalScore;
        }
      }

      await redisManager.hset(statsKey, 'playerId', stats.playerId);
      await redisManager.hset(statsKey, 'playerName', stats.playerName);
      await redisManager.hset(statsKey, 'totalGames', stats.totalGames.toString());
      await redisManager.hset(statsKey, 'wins', stats.wins.toString());
      await redisManager.hset(statsKey, 'losses', stats.losses.toString());
      await redisManager.hset(statsKey, 'totalScore', stats.totalScore.toString());
      await redisManager.hset(statsKey, 'highestScore', stats.highestScore.toString());
      await redisManager.hset(statsKey, 'lowestScore', stats.lowestScore.toString());
      await redisManager.hset(statsKey, 'totalFan', stats.totalFan.toString());
      await redisManager.hset(statsKey, 'highestFan', stats.highestFan.toString());
      await redisManager.hset(statsKey, 'maxWinStreak', stats.maxWinStreak.toString());
      await redisManager.hset(statsKey, 'currentWinStreak', stats.currentWinStreak.toString());
      await redisManager.hset(statsKey, 'lastPlayed', stats.lastPlayed.toString());
    } catch (error) {
      logger.error('Failed to update player statistics:', error);
    }
  }

  async deleteRecord(recordId: string): Promise<boolean> {
    try {
      const record = await this.getRecord(recordId, false);
      if (!record) {
        return false;
      }

      const recordKey = `${this.RECORD_PREFIX}${recordId}`;
      await redisManager.del(recordKey);

      for (const player of record.players) {
        const playerHistoryKey = `${this.PLAYER_HISTORY_PREFIX}${player.playerId}`;
        await redisManager.srem(playerHistoryKey, recordId);
      }

      const roomHistoryKey = `${this.ROOM_HISTORY_PREFIX}${record.roomId}`;
      await redisManager.srem(roomHistoryKey, recordId);

      this.cachedRecords.delete(recordId);

      logger.info(`Deleted game record: ${recordId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete record ${recordId}:`, error);
      return false;
    }
  }
}

export const gameRecordManager = new GameRecordManager();
