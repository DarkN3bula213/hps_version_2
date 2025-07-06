import winston from 'winston';
import { config } from '@/config';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: false }),
  winston.format.printf(({ timestamp, level, message, module, ...meta }) => {
    const moduleInfo = module ? `[${module}]` : '';
    const metaStr = Object.keys(meta).length ? '' : '';
    return `${timestamp} ${level} ${moduleInfo} ${message} ${metaStr}`;
  })
);

// Create the logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: config.serviceName,
    env: config.env,
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: config.logging.pretty ? consoleFormat : logFormat,
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
    }),
  ],
});

// Create child loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};
