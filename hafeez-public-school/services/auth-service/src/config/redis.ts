import { createClient } from 'redis';
import { config } from './index';
import { logger } from '@/lib/utils/logger';

export type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;

export async function connectRedis(): Promise<RedisClient> {
  try {
    redisClient = createClient({
      url: config.redis.url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 50, 2000);
        },
        connectTimeout: 10000,
        // commandTimeout: 5000,
      },
      ...config.redis.options,
    });

    redisClient.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    redisClient.on('ready', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('end', () => {
      logger.warn('Redis connection ended');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

export function getRedisClient(): RedisClient {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient  
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      // Check if client is still connected before trying to quit
      if (redisClient.isOpen) {
        await redisClient.quit();
        logger.info('Redis connection closed successfully');
      } else if (redisClient.isReady) {
        // If client is ready but not open, try to disconnect
        await redisClient.disconnect();
        logger.info('Redis connection disconnected');
      } else {
        logger.info('Redis client already disconnected');
      }
    } catch (error) {
      logger.warn('Error closing Redis connection:', error);
      // Try to disconnect as fallback
      try {
        await redisClient.disconnect();
        logger.info('Redis connection force disconnected');
      } catch (disconnectError) {
        logger.warn('Error force disconnecting Redis:', disconnectError);
      }
    } finally {
      redisClient = null;
    }
  }
}
