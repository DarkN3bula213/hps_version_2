import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/types';
import { createLogger } from '@/lib/utils/logger';
import { config } from '@/config';

const logger = createLogger('error-handler');

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Prepare error data for logging
  const errorData = {
    message: error.message,
    ...(config.env !== 'production' && { stack: error.stack }),
    ...(error instanceof AppError && { code: error.code }),
  };

  logger.error('Request error', {
    error: errorData,
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  // Handle known errors
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
    });
    return;
  }

  // Handle mongoose errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.message,
      },
    });
    return;
  }

  if (error.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid ID format',
        code: 'INVALID_ID',
      },
    });
    return;
  }

  // Handle duplicate key errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: {
        message: 'Duplicate entry',
        code: 'DUPLICATE_ENTRY',
      },
    });
    return;
  }

  if (errorData.code === 'NO_TOKEN') {
    logger.warn('No token provided', {
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    });
  }
  // Default error
  res.status(500).json({
    success: false,
    error: {
      message:
        config.env === 'production' ? 'Internal server error' : error.message,
      code: 'INTERNAL_ERROR',
      ...(config.env !== 'production' && { stack: error.stack }),
    },
  });
};

export const notFound = (req: Request, res: Response): void => {
  logger.warn('Resource not found', {
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  res.status(404).json({
    success: false,
    error: {
      message: 'Resource not found',
      code: 'NOT_FOUND',
    },
  });
};
