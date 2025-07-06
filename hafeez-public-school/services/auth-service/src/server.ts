import { createApp } from './app';
import { config } from './config';
import { connectDatabase } from './config/database';
import { connectRedis, closeRedis } from './config/redis';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('server');

let isShuttingDown = false;

async function closeConnections(): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  try {
    // Close Redis connection
    await closeRedis();

    // Close MongoDB connection
    const mongoose = await import('mongoose');
    if (mongoose.connection.readyState !== 0) {
      // 0 = disconnected
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } else {
      logger.info('MongoDB already disconnected');
    }

    logger.info('All connections closed successfully');
  } catch (error) {
    logger.error(`Error closing connections: ${error}`);
  }
}

async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`${config.serviceName} is running on port ${config.port}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Graceful shutdown initiated: ${signal}`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');
        await closeConnections();
        process.exit(0);
      });

      // If server doesn't close within 10 seconds, force close
      setTimeout(() => {
        logger.warn('Server close timeout, forcing shutdown');
        server.close(() => {
          logger.info('HTTP server force closed');
          closeConnections().then(() => process.exit(0));
        });
      }, 10000);

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors more gracefully
    process.on('uncaughtException', async (error) => {
      logger.error(`Uncaught exception: ${error}`);

      if (!isShuttingDown) {
        isShuttingDown = true;
        await closeConnections();
      }

      // Give some time for cleanup before exiting
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      logger.error(`Unhandled rejection: ${reason}`, { promise });

      if (!isShuttingDown) {
        isShuttingDown = true;
        await closeConnections();
      }

      // Give some time for cleanup before exiting
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

startServer();
