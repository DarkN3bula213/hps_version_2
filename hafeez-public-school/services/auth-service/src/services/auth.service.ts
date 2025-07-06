import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUserDocument } from '@/models/user.model';
import { Session } from '@/models/session.model';
import { getRedisClient } from '@/config/redis';
import { config } from '@/config';
import { IAuthTokens, ITokenPayload, AppError, IAuthResponse } from '@/types';
import {
  LoginInput,
  RegisterInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from '@/services/validator.service';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('auth-service');

export class AuthService {
  private readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';
  private readonly RESET_TOKEN_PREFIX = 'reset_token:';
  private readonly SESSION_PREFIX = 'session:';

  async register(data: RegisterInput): Promise<IAuthResponse> {
    const { email, password, userType, profileId } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError(400, 'User already exists', 'USER_EXISTS');
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      userType,
      profileId,
    });

    logger.info(`User registered successfully: ${user._id} - ${email}`);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  async login(
    data: LoginInput,
    ipAddress: string,
    userAgent: string
  ): Promise<IAuthResponse> {
    const { email, password } = data;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError(403, 'Account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Create session
    await this.createSession(
      user._id,
      tokens.refreshToken,
      ipAddress,
      userAgent
    );

    logger.info(`User logged in successfully: ${user._id} - ${email}`);

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const redis = getRedisClient();

    // Remove refresh token from Redis
    await redis.del(`${this.REFRESH_TOKEN_PREFIX}${refreshToken}`);

    // Remove session
    await Session.deleteOne({ userId, token: refreshToken });

    logger.info(`User logged out successfully: ${userId}`);
  }

  async refreshToken(data: RefreshTokenInput): Promise<IAuthTokens> {
    const { refreshToken } = data;
    const redis = getRedisClient();

    // Get token data from Redis
    const tokenData = await redis.get(
      `${this.REFRESH_TOKEN_PREFIX}${refreshToken}`
    );
    if (!tokenData) {
      throw new AppError(401, 'Invalid refresh token', 'INVALID_TOKEN');
    }

    // Verify token
    const payload = await this.verifyRefreshToken(refreshToken);

    // Get user
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new AppError(401, 'User not found or inactive', 'USER_NOT_FOUND');
    }

    // Delete old refresh token
    await redis.del(`${this.REFRESH_TOKEN_PREFIX}${refreshToken}`);

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    logger.info(`Tokens refreshed successfully: ${user._id}`);

    return tokens;
  }

  async forgotPassword(data: ForgotPasswordInput): Promise<void> {
    const { email } = data;
    const redis = getRedisClient();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      logger.warn(`Password reset requested for non-existent user: ${email}`);
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Store in Redis with 1 hour expiry
    await redis.setEx(
      `${this.RESET_TOKEN_PREFIX}${hashedToken}`,
      3600,
      user._id.toString()
    );

    // TODO: Send email with reset token
    logger.info(`Password reset token generated: ${user._id} - ${email}`);

    // In development, log the token
    if (config.env === 'development') {
      logger.debug(`Reset token (dev only): ${resetToken}`);
    }
  }

  async resetPassword(data: ResetPasswordInput): Promise<void> {
    const { token, password } = data;
    const redis = getRedisClient();

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Get user ID from Redis
    const userId = await redis.get(`${this.RESET_TOKEN_PREFIX}${hashedToken}`);
    if (!userId) {
      throw new AppError(
        400,
        'Invalid or expired reset token',
        'INVALID_TOKEN'
      );
    }

    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    user.password = password;
    await user.save();

    // Delete reset token
    await redis.del(`${this.RESET_TOKEN_PREFIX}${hashedToken}`);

    // Invalidate all sessions
    await Session.deleteMany({ userId });

    logger.info(`Password reset successfully: ${userId}`);
  }

  async changePassword(
    userId: string,
    data: ChangePasswordInput
  ): Promise<void> {
    const { currentPassword, newPassword } = data;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError(
        401,
        'Current password is incorrect',
        'INVALID_PASSWORD'
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate all sessions
    await Session.deleteMany({ userId });

    logger.info(`Password changed successfully: ${userId}`);
  }

  async getUserById(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    return user;
  }

  private async generateTokens(user: IUserDocument): Promise<IAuthTokens> {
    const payload: ITokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      userType: user.userType,
    };

    // Generate access token
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    // Generate refresh token
    const refreshToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as jwt.SignOptions);

    // Store refresh token in Redis
    const redis = getRedisClient();
    await redis.setEx(
      `${this.REFRESH_TOKEN_PREFIX}${refreshToken}`,
      7 * 24 * 60 * 60, // 7 days
      JSON.stringify(payload)
    );

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(token: string): Promise<ITokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as ITokenPayload;
      return payload;
    } catch (error) {
      throw new AppError(401, 'Invalid refresh token', 'INVALID_TOKEN');
    }
  }

  private async createSession(
    userId: string,
    token: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    // Calculate expiry (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await Session.create({
      userId,
      token,
      ipAddress,
      userAgent,
      expiresAt,
    });
  }
}

export const authService = new AuthService();
