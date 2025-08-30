import { redis } from '../config/redis';

const TTL = 60 * 60; // 1 hour in seconds

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  },
  async set<T>(key: string, payload: T, ttl = TTL): Promise<void> {
    await redis.set(key, JSON.stringify(payload), 'EX', ttl);
  },
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  },
};