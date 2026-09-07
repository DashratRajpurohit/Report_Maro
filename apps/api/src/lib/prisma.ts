import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

/** Single shared client for the process; Prisma manages its own pool. */
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
