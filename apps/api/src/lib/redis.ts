import { Redis } from 'ioredis';
import { env } from '../config/env.js';

/**
 * BullMQ requires `maxRetriesPerRequest: null` on the connection it's given.
 * Reused for the Socket.io Redis adapter too, so there is one Redis
 * connection policy for the whole process.
 */
export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
