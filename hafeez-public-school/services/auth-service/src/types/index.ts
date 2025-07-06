import { Request } from 'express';

// User types
export interface IUser {
  _id: string;
  email: string;
  password: string;
  userType: UserType;
  profileId: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserType {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
}

// Auth types
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenPayload {
  userId: string;
  email: string;
  userType: UserType;
}

export interface IRefreshTokenData {
  userId: string;
  token: string;
  expiresAt: Date;
}

// Request types
export interface AuthRequest extends Request {
  user?: ITokenPayload;
  
}

// Session types
export interface ISession {
  _id: string;
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  createdAt: Date;
}

// Response types
export interface IAuthResponse {
  user: Omit<IUser, 'password'>;
  tokens: IAuthTokens;
}

export interface IMessageResponse {
  message: string;
}

// Error types
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: Record<string, unknown>,
    public type?: ErrorType
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;

    Error.captureStackTrace(this, this.constructor);
  }
}

export enum ErrorType {
  BAD_TOKEN = 'BadTokenError',
  TOKEN_EXPIRED = 'TokenExpiredError',
  UNAUTHORIZED = 'AuthFailureError',
  ACCESS_TOKEN = 'AccessTokenError',
  INTERNAL = 'InternalError',
  NOT_FOUND = 'NotFoundError',
  NO_ENTRY = 'NoEntryError',
  NO_DATA = 'NoDataError',
  BAD_REQUEST = 'BadRequestError',
  FORBIDDEN = 'ForbiddenError',
  DUPLICATE_KEY = 'MongoError',
}
