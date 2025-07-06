import { Express } from 'express';
import authRoutes from './auth.route';

export const setupRoutes = (app: Express): void => {
  // API routes
  app.use('/api/v1/auth', authRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness check
  app.get('/ready', async (req, res) => {
    // TODO: Check database and Redis connections
    res.json({
      status: 'ready',
      service: 'auth-service',
    });
  });
};
