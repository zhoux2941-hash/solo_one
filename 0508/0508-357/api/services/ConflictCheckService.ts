import Database from 'better-sqlite3';
import db from '../db/index.js';
import redis from '../config/redis.js';
import { isRedisDegraded } from '../config/redis.js';
import { distributedLock } from '../utils/distributedLock.js';

export interface ConflictCheckResult {
  hasConflict: boolean;
  existingBooking?: {
    id: number;
    memberName: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  conflictType?: 'coach-time' | 'member-time';
}

export interface BookingSlot {
  coachId: number;
  date: string;
  startTime: string;
  endTime: string;
}

const CACHE_TTL = 300;

class ConflictCheckService {
  private static instance: ConflictCheckService | null = null;
  private db: Database.Database;

  private constructor() {
    this.db = db;
  }

  static getInstance(): ConflictCheckService {
    if (!ConflictCheckService.instance) {
      ConflictCheckService.instance = new ConflictCheckService();
    }
    return ConflictCheckService.instance;
  }

  private getCacheKey(coachId: number, date: string, startTime: string): string {
    return `booking:conflict:${coachId}:${date}:${startTime}`;
  }

  private getLockKey(coachId: number, date: string, startTime: string): string {
    return `booking:${coachId}:${date}:${startTime}`;
  }

  async checkConflict(
    coachId: number,
    date: string,
    startTime: string,
    memberId?: number
  ): Promise<ConflictCheckResult> {
    if (!isRedisDegraded()) {
      const cacheKey = this.getCacheKey(coachId, date, startTime);

      try {
        const cached = await redis.get(cacheKey);
        if (cached === 'conflict') {
          console.log(`[ConflictCheck] 缓存命中: ${cacheKey}`);
          return {
            hasConflict: true,
            conflictType: 'coach-time',
          };
        }
      } catch (error) {
        console.warn('[ConflictCheck] Redis缓存读取失败，回退到数据库:', error);
      }
    } else {
      console.log('[ConflictCheck] Redis降级模式，跳过缓存');
    }

    const result = await this.checkConflictFromDB(coachId, date, startTime, memberId);

    if (result.hasConflict && !isRedisDegraded()) {
      try {
        const cacheKey = this.getCacheKey(coachId, date, startTime);
        await redis.setex(cacheKey, CACHE_TTL, 'conflict');
        console.log(`[ConflictCheck] 缓存写入: ${cacheKey}`);
      } catch (error) {
        console.warn('[ConflictCheck] Redis缓存写入失败:', error);
      }
    }

    return result;
  }

  private async checkConflictFromDB(
    coachId: number,
    date: string,
    startTime: string,
    memberId?: number
  ): Promise<ConflictCheckResult> {
    return new Promise((resolve) => {
      const existingBooking = this.db
        .prepare(
          `SELECT b.id, b.member_name, b.date, b.start_time, b.end_time, b.member_id
           FROM bookings b
           WHERE b.coach_id = ? 
           AND b.date = ? 
           AND b.start_time = ? 
           AND b.status IN ('pending', 'in-progress')
           LIMIT 1`
        )
        .get(coachId, date, startTime) as any;

      if (existingBooking) {
        if (memberId && existingBooking.member_id === memberId) {
          resolve({ hasConflict: false });
          return;
        }

        resolve({
          hasConflict: true,
          existingBooking: {
            id: existingBooking.id,
            memberName: existingBooking.member_name,
            date: existingBooking.date,
            startTime: existingBooking.start_time,
            endTime: existingBooking.end_time,
          },
          conflictType: 'coach-time',
        });
        return;
      }

      resolve({ hasConflict: false });
    });
  }

  async checkBatchConflicts(
    slots: BookingSlot[],
    memberId?: number
  ): Promise<Map<string, ConflictCheckResult>> {
    const results = new Map<string, ConflictCheckResult>();
    const checks = slots.map(async (slot) => {
      const key = `${slot.coachId}-${slot.date}-${slot.startTime}`;
      const result = await this.checkConflict(
        slot.coachId,
        slot.date,
        slot.startTime,
        memberId
      );
      results.set(key, result);
    });

    await Promise.all(checks);
    return results;
  }

  async getAvailableSlots(
    coachId: number,
    date: string,
    timeSlots: { startTime: string; endTime: string }[]
  ): Promise<{ startTime: string; endTime: string; isAvailable: boolean }[]> {
    if (isRedisDegraded()) {
      console.log('[ConflictCheck] Redis降级模式，使用数据库查询可用时段');
      return this.getAvailableSlotsFromDB(coachId, date, timeSlots);
    }

    const results = await Promise.all(
      timeSlots.map(async (slot) => {
        const conflict = await this.checkConflict(coachId, date, slot.startTime);
        return {
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: !conflict.hasConflict,
        };
      })
    );

    return results;
  }

  private getAvailableSlotsFromDB(
    coachId: number,
    date: string,
    timeSlots: { startTime: string; endTime: string }[]
  ): Promise<{ startTime: string; endTime: string; isAvailable: boolean }[]> {
    return new Promise((resolve) => {
      const bookedSlots = db
        .prepare(
          `SELECT start_time 
           FROM bookings 
           WHERE coach_id = ? AND date = ? AND status IN ('pending', 'in-progress')`
        )
        .all(coachId, date) as { start_time: string }[];

      const bookedTimes = new Set(bookedSlots.map((b) => b.start_time));

      const results = timeSlots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: !bookedTimes.has(slot.startTime),
      }));

      resolve(results);
    });
  }

  async withBookingLock<T>(
    coachId: number,
    date: string,
    startTime: string,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!distributedLock) {
      console.warn('[ConflictCheck] 分布式锁未初始化，回退到无锁模式');
      const conflict = await this.checkConflict(coachId, date, startTime);
      if (conflict.hasConflict) {
        throw new Error('该时段已被预约，请选择其他时段');
      }
      const result = await operation();
      return result;
    }

    const lockKey = this.getLockKey(coachId, date, startTime);
    
    return distributedLock.withLock(lockKey, async () => {
      const conflict = await this.checkConflict(coachId, date, startTime);
      if (conflict.hasConflict) {
        throw new Error('该时段已被预约，请选择其他时段');
      }
      
      const result = await operation();
      
      if (!isRedisDegraded()) {
        const cacheKey = this.getCacheKey(coachId, date, startTime);
        try {
          await redis.setex(cacheKey, CACHE_TTL, 'conflict');
          console.log(`[ConflictCheck] 预约成功后缓存更新: ${cacheKey}`);
        } catch (error) {
          console.warn('[ConflictCheck] 预约成功后缓存更新失败:', error);
        }
      }
      
      return result;
    });
  }

  async clearCache(coachId: number, date: string, startTime: string): Promise<void> {
    if (isRedisDegraded()) {
      console.log('[ConflictCheck] Redis降级模式，跳过缓存清除');
      return;
    }

    const cacheKey = this.getCacheKey(coachId, date, startTime);
    try {
      await redis.del(cacheKey);
      console.log(`[ConflictCheck] 缓存清除: ${cacheKey}`);
    } catch (error) {
      console.warn('[ConflictCheck] 缓存清除失败:', error);
    }
  }

  async clearAllCacheForDate(coachId: number, date: string): Promise<void> {
    if (isRedisDegraded()) {
      console.log('[ConflictCheck] Redis降级模式，跳过批量缓存清除');
      return;
    }

    const pattern = `booking:conflict:${coachId}:${date}:*`;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[ConflictCheck] 批量清除缓存: ${keys.length} 个`);
      }
    } catch (error) {
      console.warn('[ConflictCheck] 批量清除缓存失败:', error);
    }
  }

  async checkCoachAvailabilityForDay(
    coachId: number,
    date: string
  ): Promise<{ totalSlots: number; bookedSlots: number; availableSlots: number }> {
    return new Promise((resolve) => {
      const bookedCount = this.db
        .prepare(
          `SELECT COUNT(*) as count 
           FROM bookings 
           WHERE coach_id = ? 
           AND date = ? 
           AND status IN ('pending', 'in-progress')`
        )
        .get(coachId, date) as { count: number };

      const allTimeSlots = [
        '09:00', '10:30', '14:00', '15:30', '17:00', '18:30',
      ];

      resolve({
        totalSlots: allTimeSlots.length,
        bookedSlots: bookedCount.count,
        availableSlots: allTimeSlots.length - bookedCount.count,
      });
    });
  }
}

export const conflictCheckService = ConflictCheckService.getInstance();

export default ConflictCheckService;
