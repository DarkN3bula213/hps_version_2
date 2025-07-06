import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import rateLimit from 'express-rate-limit';
import { config } from '@/config';

import { errorHandler, notFound } from '@/middlewares/error.middleware';
import { setupRoutes } from '@/routes';
import { requestLogger } from '@/lib/utils/morgan';

export const createApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors(config.cors));

  // Request logging
  app.use(requestLogger);

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.security.rateLimit.windowMs,
    max: config.security.rateLimit.max,
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('*', limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Trust proxy
  app.set('trust proxy', 1);

  // Setup routes
  setupRoutes(app);

  // 404 handler
  app.use(notFound);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};
