import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Define environment schema
const envSchema = z.object({
  // Service
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform(Number).default('3001'),
  SERVICE_NAME: z.string().default('auth-service'),

  // Database
  MONGODB_URI: z.string(), 

  // Redis
  REDIS_URL: z.string(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Security 
  BCRYPT_ROUNDS: z.string().transform(Number).default('10'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // CORS
  ALLOWED_ORIGINS: z.string().transform((val) => val.split(',')),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  serviceName: env.SERVICE_NAME,

  mongodb: {
    uri: env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    },
  },

  redis: {
    url: env.REDIS_URL,
    options: {
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    },
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
    },
  },

  cors: {
    origin: env.NODE_ENV === 'production' ? env.ALLOWED_ORIGINS : true,
    credentials: true,
  },

  logging: {
    level: env.LOG_LEVEL,
    pretty: env.NODE_ENV === 'development',
  },
};

// Validate critical configuration
if (env.NODE_ENV === 'production') {
  if (env.JWT_SECRET === 'your-super-secret-key-change-in-production') {
    throw new Error('JWT_SECRET must be changed in production');
  }
}
