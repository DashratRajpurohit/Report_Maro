import { Router } from 'express';
import type { HealthResponse } from '@sih/shared-types';
import { prisma } from '../lib/prisma.js';
import { redisConnection } from '../lib/redis.js';
import { isMongoConnected } from '../lib/mongo.js';

export const healthRouter = Router();

const startedAt = Date.now();

healthRouter.get('/health', async (_req, res) => {
  const [postgresUp, redisUp] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    redisConnection.ping().then(() => true).catch(() => false),
  ]);
  const mongoUp = isMongoConnected();

  const body: HealthResponse = {
    status: postgresUp && redisUp ? 'ok' : 'degraded',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    version: '1.0.0',
    dependencies: {
      postgres: postgresUp ? 'up' : 'down',
      redis: redisUp ? 'up' : 'down',
      mongo: mongoUp ? 'up' : 'disabled',
    },
  };

  res.status(body.status === 'ok' ? 200 : 503).json(body);
});
