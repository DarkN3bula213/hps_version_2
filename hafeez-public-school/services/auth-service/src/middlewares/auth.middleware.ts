import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, ITokenPayload, AppError } from '@/types';
import { config } from '@/config';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('auth-middleware');

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided', 'NO_TOKEN');
    }

    const token = authHeader.substring(7);

    try {
      const payload = jwt.verify(token, config.jwt.secret) as ITokenPayload;
      req.user = payload;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(401, 'Token expired', 'TOKEN_EXPIRED');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(401, 'Invalid token', 'INVALID_TOKEN');
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated', 'NOT_AUTHENTICATED'));
    }

    if (!allowedRoles.includes(req.user.userType)) {
      logger.warn(
        JSON.stringify({
          userId: req.user.userId,
          userType: req.user.userType,
          allowedRoles,
        }),
        'Unauthorized access attempt'
      );

      return next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
    }

    next();
  };
};
