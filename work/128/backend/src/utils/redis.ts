import { createClient, RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisManager {
  private static instance: RedisManager;
  private client: RedisClientType | null = null;

  private constructor() {}

  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  async connect(): Promise<void> {
    if (this.client?.isOpen) {
      return;
    }

    try {
      this.client = createClient({
        url: REDIS_URL,
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  getClient(): RedisClientType {
    if (!this.client?.isOpen) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  async disconnect(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = this.getClient();
    if (ttl) {
      await client.set(key, value, { EX: ttl });
    } else {
      await client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    return await client.get(key);
  }

  async del(key: string): Promise<void> {
    const client = this.getClient();
    await client.del(key);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    const client = this.getClient();
    await client.hSet(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    const client = this.getClient();
    return await client.hGet(key, field);
  }

  async hdel(key: string, field: string): Promise<void> {
    const client = this.getClient();
    await client.hDel(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const client = this.getClient();
    return await client.hGetAll(key);
  }

  async sadd(key: string, value: string): Promise<void> {
    const client = this.getClient();
    await client.sAdd(key, value);
  }

  async srem(key: string, value: string): Promise<void> {
    const client = this.getClient();
    await client.sRem(key, value);
  }

  async smembers(key: string): Promise<string[]> {
    const client = this.getClient();
    return await client.sMembers(key);
  }

  async publish(channel: string, message: string): Promise<void> {
    const client = this.getClient();
    await client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    const client = this.getClient();
    const subscriber = client.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(channel, callback);
  }
}

export const redisManager = RedisManager.getInstance();
