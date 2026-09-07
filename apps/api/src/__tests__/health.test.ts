import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: { $queryRaw: vi.fn().mockResolvedValue([{ '1': 1 }]) },
}));
vi.mock('../lib/redis.js', () => ({
  redisConnection: { ping: vi.fn().mockResolvedValue('PONG') },
}));
vi.mock('../lib/mongo.js', () => ({
  isMongoConnected: () => false,
}));

const { createApp } = await import('../app.js');
const request = (await import('supertest')).default;

describe('GET /health', () => {
  it('reports ok when postgres and redis respond, mongo disabled', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.dependencies.mongo).toBe('disabled');
  });
});
