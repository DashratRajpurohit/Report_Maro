import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { API_BASE_PATH } from '@sih/shared-types';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { problemsRouter } from './routes/problems.js';
import { organizationsRouter } from './routes/organizations.js';
import { uploadsRouter } from './routes/uploads.js';
import { assignmentsRouter } from './routes/assignments.js';
import { proposalsRouter } from './routes/proposals.js';
import { projectsRouter } from './routes/projects.js';
import { notificationsRouter } from './routes/notifications.js';
import { statsRouter } from './routes/stats.js';
import { internalRouter } from './routes/internal.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(requestId);
  app.use(pinoHttp({ logger }));

  app.use(healthRouter);

  const v1 = express.Router();
  v1.use(authRouter);
  v1.use(problemsRouter);
  v1.use(organizationsRouter);
  v1.use(uploadsRouter);
  v1.use(assignmentsRouter);
  v1.use(proposalsRouter);
  v1.use(projectsRouter);
  v1.use(notificationsRouter);
  v1.use(statsRouter);
  v1.use(internalRouter);
  app.use(API_BASE_PATH, v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
