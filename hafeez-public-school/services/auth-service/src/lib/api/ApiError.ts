import { ErrorType } from '@/types';
import { Response } from 'express';
import {
  AuthFailureResponse,
  AccessTokenErrorResponse,
  InternalErrorResponse,
  NotFoundResponse,
  BadRequestResponse,
  ForbiddenResponse,
  DuplicateKeyResponse,
} from './ApiResponse';
import { config } from '@/config';

export abstract class ApiError extends Error {
  constructor(
    public type: ErrorType,
    public message: string = 'error'
  ) {
    super(type);
  }

  public static handle(err: ApiError, res: Response): Response {
    switch (err.type) {
      case ErrorType.BAD_TOKEN:
      case ErrorType.TOKEN_EXPIRED:
      case ErrorType.UNAUTHORIZED:
        return new AuthFailureResponse(err.message).send(res);
      case ErrorType.ACCESS_TOKEN:
        return new AccessTokenErrorResponse(err.message).send(res);
      case ErrorType.INTERNAL:
        return new InternalErrorResponse(err.message).send(res);
      case ErrorType.NOT_FOUND:
      case ErrorType.NO_ENTRY:
      case ErrorType.NO_DATA:
        return new NotFoundResponse(err.message).send(res);
      case ErrorType.BAD_REQUEST:
        return new BadRequestResponse(err.message).send(res);
      case ErrorType.FORBIDDEN:
        return new ForbiddenResponse(err.message).send(res);
      case ErrorType.DUPLICATE_KEY:
        return new DuplicateKeyResponse(err.message).send(res);

      default: {
        let message = err.message;
        // Do not send failure message in production as it may send sensitive data
        if (config.env === 'production') message = 'Something went wrong.';
        return new InternalErrorResponse(message).send(res);
      }
    }
  }
}

export class AuthFailureError extends ApiError {
  constructor(message = 'Invalid Credentials') {
    super(ErrorType.UNAUTHORIZED, message);
  }
}

export class InternalError extends ApiError {
  constructor(message = 'Internal error') {
    super(ErrorType.INTERNAL, message);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request') {
    super(ErrorType.BAD_REQUEST, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not Found') {
    super(ErrorType.NOT_FOUND, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Permission denied') {
    super(ErrorType.FORBIDDEN, message);
  }
}

export class NoEntryError extends ApiError {
  constructor(message = "Entry don't exists") {
    super(ErrorType.NO_ENTRY, message);
  }
}

export class BadTokenError extends ApiError {
  constructor(message = 'Token is not valid') {
    super(ErrorType.BAD_TOKEN, message);
  }
}

export class TokenExpiredError extends ApiError {
  constructor(message = 'Token is expired') {
    super(ErrorType.TOKEN_EXPIRED, message);
  }
}

export class NoDataError extends ApiError {
  constructor(message = 'No data available') {
    super(ErrorType.NO_DATA, message);
  }
}

export class AccessTokenError extends ApiError {
  constructor(message = 'Invalid access token') {
    super(ErrorType.ACCESS_TOKEN, message);
  }
}

export class DuplicateKeyError extends ApiError {
  constructor(message = 'Duplicate key error') {
    super(ErrorType.DUPLICATE_KEY, message);
  }
}

// Custom error class for Mongoose validation errors
export class MongooseValidationError extends ApiError {
  constructor(message = 'Validation error occurred') {
    super(ErrorType.BAD_REQUEST, message);
  }
}

// Custom error class for Mongoose duplicate key errors
export class MongooseDuplicateKeyError extends ApiError {
  constructor(message = 'Duplicate key error') {
    super(ErrorType.DUPLICATE_KEY, message);
  }
}

// Custom error class for Mongoose cast errors (e.g., invalid ObjectId)
export class MongooseCastError extends ApiError {
  constructor(message = 'Invalid ID format') {
    super(ErrorType.BAD_REQUEST, message);
  }
}

// Custom error class for other general Mongoose errors
export class MongooseGeneralError extends ApiError {
  constructor(message = 'A database error occurred') {
    super(ErrorType.INTERNAL, message);
  }
}
