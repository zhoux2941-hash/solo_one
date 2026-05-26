import Redlock from 'redlock';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const LOCK_TTL = parseInt(process.env.LOCK_TTL || '5000');
const LOCK_RETRY_DELAY = parseInt(process.env.LOCK_RETRY_DELAY || '200');
const LOCK_RETRY_COUNT = parseInt(process.env.LOCK_RETRY_COUNT || '5');

export interface LockOptions {
  ttl?: number;
  retryDelay?: number;
  retryCount?: number;
}

export interface Lock {
  release: () => Promise<void>;
  extend: (ttl: number) => Promise<Lock>;
  value: string | null;
  expiration: number;
  attempts: number;
}

class DistributedLock {
  private static instance: DistributedLock | null = null;
  private redlock: Redlock;

  private constructor(redisClient: Redis) {
    const compatibleClient = redisClient as unknown as Redlock.CompatibleRedisClient;

    this.redlock = new Redlock(
      [compatibleClient],
      {
        driftFactor: 0.01,
        retryCount: LOCK_RETRY_COUNT,
        retryDelay: LOCK_RETRY_DELAY,
        retryJitter: 0.2,
      }
    );

    this.redlock.on('clientError', (error) => {
      console.error('分布式锁客户端错误:', error);
    });
  }

  static getInstance(redisClient?: Redis): DistributedLock {
    if (!DistributedLock.instance) {
      if (!redisClient) {
        throw new Error('Redis client is required for first initialization');
      }
      DistributedLock.instance = new DistributedLock(redisClient);
    }
    return DistributedLock.instance;
  }

  async acquire(resource: string | string[], options: LockOptions = {}): Promise<Lock> {
    const {
      ttl = LOCK_TTL,
    } = options;

    const resources = Array.isArray(resource) ? resource : [resource];
    const lockKey = resources.map((r) => `lock:${r}`).join(',');

    try {
      const lock = await this.redlock.lock(
        resources.map((r) => `lock:${r}`),
        ttl
      );

      console.log(`[DistributedLock] 获取锁成功: ${lockKey}, TTL: ${ttl}ms`);
      
      return this.wrapLock(lock, lockKey);
    } catch (error) {
      console.error(`[DistributedLock] 获取锁失败: ${lockKey}`, error);
      throw new Error('系统繁忙，请稍后再试');
    }
  }

  private wrapLock(lock: Redlock.Lock, lockKey: string): Lock {
    return {
      release: async () => {
        try {
          await this.redlock.unlock(lock);
          console.log(`[DistributedLock] 释放锁成功: ${lockKey}`);
        } catch (error) {
          console.error(`[DistributedLock] 释放锁失败: ${lockKey}`, error);
        }
      },
      extend: async (newTtl: number): Promise<Lock> => {
        const extendedLock = await this.redlock.extend(lock, newTtl);
        console.log(`[DistributedLock] 续期锁成功: ${lockKey}, 新TTL: ${newTtl}ms`);
        return this.wrapLock(extendedLock, lockKey);
      },
      value: lock.value,
      expiration: lock.expiration,
      attempts: lock.attempts,
    };
  }

  async withLock<T>(
    resource: string | string[],
    fn: () => Promise<T>,
    options: LockOptions = {}
  ): Promise<T> {
    const lock = await this.acquire(resource, options);
    try {
      return await fn();
    } finally {
      await lock.release();
    }
  }
}

export let distributedLock: DistributedLock;

export function initDistributedLock(redisClient: Redis): DistributedLock {
  distributedLock = DistributedLock.getInstance(redisClient);
  return distributedLock;
}

export default DistributedLock;
