import Redis from 'ioredis';
import dotenv from 'dotenv';
import { initDistributedLock } from '../utils/distributedLock.js';

dotenv.config();

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 1000,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  connectTimeout: 5000,
};

class RedisManager {
  private static instance: Redis | null = null;
  private static isConnected = false;
  private static retryCount = 0;
  private static maxRetries = 10;
  private static stopRetrying = false;

  static getInstance(): Redis {
    if (!RedisManager.instance) {
      RedisManager.instance = new Redis(REDIS_CONFIG);
      
      RedisManager.instance.on('connect', () => {
        console.log('Redis: 连接中...');
      });
      
      RedisManager.instance.on('ready', () => {
        RedisManager.isConnected = true;
        RedisManager.retryCount = 0;
        console.log('Redis: 连接成功');
        
        try {
          initDistributedLock(RedisManager.instance);
          console.log('分布式锁已初始化');
        } catch (error) {
          console.error('分布式锁初始化失败:', error);
        }
      });
      
      RedisManager.instance.on('error', (error) => {
        RedisManager.retryCount++;
        console.error(`Redis: 连接错误 (重试 ${RedisManager.retryCount}/${RedisManager.maxRetries}):`, error.message);
        
        if (RedisManager.retryCount >= RedisManager.maxRetries && !RedisManager.stopRetrying) {
          RedisManager.stopRetrying = true;
          console.warn('Redis: 达到最大重试次数，进入降级模式。预约功能将使用数据库唯一索引进行并发控制。');
          
          RedisManager.instance?.disconnect();
        }
      });
      
      RedisManager.instance.on('close', () => {
        if (!RedisManager.stopRetrying) {
          console.warn('Redis: 连接关闭');
        }
        RedisManager.isConnected = false;
      });
      
      RedisManager.instance.on('reconnecting', () => {
        if (!RedisManager.stopRetrying) {
          console.log('Redis: 重连中...');
        }
      });
    }
    
    return RedisManager.instance;
  }

  static checkConnection(): boolean {
    return RedisManager.isConnected;
  }

  static async disconnect(): Promise<void> {
    if (RedisManager.instance) {
      RedisManager.stopRetrying = true;
      await RedisManager.instance.quit();
      RedisManager.instance = null;
      RedisManager.isConnected = false;
      console.log('Redis: 已断开连接');
    }
  }

  static isInDegradedMode(): boolean {
    return RedisManager.stopRetrying;
  }
}

export const redis = RedisManager.getInstance();
export const checkRedisConnection = () => RedisManager.checkConnection();
export const disconnectRedis = () => RedisManager.disconnect();
export const isRedisDegraded = () => RedisManager.isInDegradedMode();

export default redis;
