import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthService } from '@/services/auth.service';
import { User } from '@/models/user.model';
import { Session } from '@/models/session.model';
import { getRedisClient } from '@/config/redis';
import { config } from '@/config';
import { AppError, ITokenPayload } from '@/types';
import {
  mockLoginData,
  mockRegisterData,
  mockForgotPasswordData,
  mockResetPasswordData,
  mockChangePasswordData,
} from '../fixtures/auth.fixtures';
import { RedisClientType } from 'redis';

describe('AuthService Integration Tests', () => {
  let authService: AuthService;
  let redisClient: RedisClientType;

  beforeAll(async () => {
    authService = new AuthService();
    redisClient = getRedisClient() as RedisClientType;
  });

  afterEach(async () => {
    // Clean up database
    await User.deleteMany({});
    await Session.deleteMany({});

    // Clean up Redis
    const keys = await redisClient.keys('refresh_token:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    const resetKeys = await redisClient.keys('reset_token:*');
    if (resetKeys.length > 0) {
      await redisClient.del(resetKeys);
    }
  });

  describe('User Registration and Login Flow', () => {
    it('should register and login a user successfully', async () => {
      // Register user
      const registerData = mockRegisterData.valid;
      const registerResult = await authService.register(registerData);

      expect(registerResult.user).toBeDefined();
      expect(registerResult.user.email).toBe(registerData.email);
      expect(registerResult.user.userType).toBe(registerData.userType);
      expect(registerResult.tokens).toBeDefined();
      expect(registerResult.tokens.accessToken).toBeDefined();
      expect(registerResult.tokens.refreshToken).toBeDefined();

      // Verify user was saved to database
      const savedUser = await User.findOne({ email: registerData.email });
      expect(savedUser).toBeDefined();
      expect(savedUser?.email).toBe(registerData.email);
      expect(savedUser?.userType).toBe(registerData.userType);
      expect(savedUser?.isActive).toBe(true);

      // Login with the same credentials
      const loginResult = await authService.login(
        {
          email: registerData.email,
          password: registerData.password,
        },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(loginResult.user).toBeDefined();
      expect(loginResult.user.email).toBe(registerData.email);
      expect(loginResult.tokens).toBeDefined();

      // Verify session was created
      const sessions = await Session.find({
        userId: savedUser?._id.toString(),
      });
      expect(sessions).toHaveLength(1);
      expect(sessions[0].ipAddress).toBe('192.168.1.1');
      expect(sessions[0].userAgent).toBe('Mozilla/5.0');

      // Verify refresh token is stored in Redis
      const redisToken = await redisClient.get(
        `refresh_token:${loginResult.tokens.refreshToken}`
      );
      expect(redisToken).toBeDefined();
    });

    it('should prevent duplicate user registration', async () => {
      // Register first user
      const userData = mockRegisterData.valid;
      await authService.register(userData);

      // Try to register same user again
      await expect(authService.register(userData)).rejects.toThrow(
        new AppError(400, 'User already exists', 'USER_EXISTS')
      );
    });

    it('should handle login with non-existent user', async () => {
      const loginData = mockLoginData.invalidEmail;

      await expect(
        authService.login(loginData, '192.168.1.1', 'Mozilla/5.0')
      ).rejects.toThrow(
        new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS')
      );
    });

    it('should handle login with wrong password', async () => {
      // Register user
      const registerData = mockRegisterData.valid;
      await authService.register(registerData);

      // Try to login with wrong password
      const loginData = mockLoginData.invalidPassword;

      await expect(
        authService.login(loginData, '192.168.1.1', 'Mozilla/5.0')
      ).rejects.toThrow(
        new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS')
      );
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh tokens successfully', async () => {
      // Register and login user
      const registerData = mockRegisterData.valid;
      await authService.register(registerData);
      const loginResult = await authService.login(
        {
          email: registerData.email,
          password: registerData.password,
        },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      // Refresh tokens
      const refreshResult = await authService.refreshToken({
        refreshToken: loginResult.tokens.refreshToken,
      });

      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.accessToken).not.toBe(
        loginResult.tokens.accessToken
      );
      expect(refreshResult.refreshToken).not.toBe(
        loginResult.tokens.refreshToken
      );

      // Verify old refresh token is removed from Redis
      const oldToken = await redisClient.get(
        `refresh_token:${loginResult.tokens.refreshToken}`
      );
      expect(oldToken).toBeNull();

      // Verify new refresh token is stored in Redis
      const newToken = await redisClient.get(
        `refresh_token:${refreshResult.refreshToken}`
      );
      expect(newToken).toBeDefined();
    });

    it('should handle invalid refresh token', async () => {
      await expect(
        authService.refreshToken({ refreshToken: 'invalid-token' })
      ).rejects.toThrow(
        new AppError(401, 'Invalid refresh token', 'INVALID_TOKEN')
      );
    });
  });

  describe('Logout Flow', () => {
    it('should logout user successfully', async () => {
      // Register and login user
      const registerData = mockRegisterData.valid;
      await authService.register(registerData);
      const loginResult = await authService.login(
        {
          email: registerData.email,
          password: registerData.password,
        },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      // Logout
      const savedUser = await User.findOne({ email: registerData.email });
      await authService.logout(
        savedUser!._id.toString(),
        loginResult.tokens.refreshToken
      );

      // Verify refresh token is removed from Redis
      const redisToken = await redisClient.get(
        `refresh_token:${loginResult.tokens.refreshToken}`
      );
      expect(redisToken).toBeNull();

      // Verify session is removed from database
      const sessions = await Session.find({
        userId: savedUser!._id.toString(),
        token: loginResult.tokens.refreshToken,
      });
      expect(sessions).toHaveLength(0);
    });
  });

  describe('Password Reset Flow', () => {
    it('should handle forgot password for existing user', async () => {
      // Register user
      const registerData = mockRegisterData.valid;
      await authService.register(registerData);

      // Request password reset
      const forgotPasswordData = mockForgotPasswordData.valid;
      await authService.forgotPassword(forgotPasswordData);

      // Verify reset token is stored in Redis
      const keys = await redisClient.keys('reset_token:*');
      expect(keys).toHaveLength(1);

      const tokenData = await redisClient.get(keys[0]);
      expect(tokenData).toBeDefined();

      // Get the actual reset token (in development mode, it's logged)
      const savedUser = await User.findOne({ email: forgotPasswordData.email });
      expect(tokenData).toBe(savedUser!._id.toString());
    });

    it('should handle forgot password for non-existent user', async () => {
      const forgotPasswordData = mockForgotPasswordData.nonExistent;

      // Should not throw error for non-existent user
      await expect(
        authService.forgotPassword(forgotPasswordData)
      ).resolves.toBeUndefined();

      // Verify no reset token is stored
      const keys = await redisClient.keys('reset_token:*');
      expect(keys).toHaveLength(0);
    });

    it('should reset password successfully', async () => {
      // Register user
      const registerData = mockRegisterData.valid;
      await authService.register(registerData);

      // Request password reset
      const forgotPasswordData = mockForgotPasswordData.valid;
      await authService.forgotPassword(forgotPasswordData);

      // Get reset token from Redis
      const keys = await redisClient.keys('reset_token:*');
      const resetToken = keys[0].replace('reset_token:', '');
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Reset password
      const resetPasswordData = {
        token: resetToken,
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      await authService.resetPassword(resetPasswordData);

      // Verify reset token is removed from Redis
      const tokenData = await redisClient.get(`reset_token:${hashedToken}`);
      expect(tokenData).toBeNull();

      // Verify password was changed
      const savedUser = await User.findOne({ email: registerData.email });
      const isNewPasswordValid = await savedUser!.comparePassword(
        resetPasswordData.password
      );
      expect(isNewPasswordValid).toBe(true);

      // Verify all sessions are invalidated
      const sessions = await Session.find({
        userId: savedUser!._id.toString(),
      });
      expect(sessions).toHaveLength(0);
    });

    it('should handle invalid reset token', async () => {
      const resetPasswordData = mockResetPasswordData.invalid;

      await expect(
        authService.resetPassword(resetPasswordData)
      ).rejects.toThrow(
        new AppError(400, 'Invalid or expired reset token', 'INVALID_TOKEN')
      );
    });
  });

  describe('Change Password Flow', () => {
    it('should change password successfully', async () => {
      // Register and login user
      const registerData = mockRegisterData.valid;
      await authService.register(registerData);
      await authService.login(
        {
          email: registerData.email,
          password: registerData.password,
        },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      const savedUser = await User.findOne({ email: registerData.email });

      // Change password
      const changePasswordData = mockChangePasswordData.valid;
      await authService.changePassword(
        savedUser!._id.toString(),
        changePasswordData
      );

      // Verify password was changed
      const updatedUser = await User.findById(savedUser!._id);
      const isNewPasswordValid = await updatedUser!.comparePassword(
        changePasswordData.newPassword
      );
      expect(isNewPasswordValid).toBe(true);

      // Verify all sessions are invalidated
      const sessions = await Session.find({
        userId: savedUser!._id.toString(),
      });
      expect(sessions).toHaveLength(0);
    });

    it('should handle change password with wrong current password', async () => {
      // Register user
      const registerData = mockRegisterData.valid;
      await authService.register(registerData);
      const savedUser = await User.findOne({ email: registerData.email });

      // Try to change password with wrong current password
      const changePasswordData = mockChangePasswordData.invalidCurrentPassword;

      await expect(
        authService.changePassword(
          savedUser!._id.toString(),
          changePasswordData
        )
      ).rejects.toThrow(
        new AppError(401, 'Current password is incorrect', 'INVALID_PASSWORD')
      );
    });
  });

  describe('User Management', () => {
    it('should get user by ID successfully', async () => {
      // Register user
      const registerData = mockRegisterData.valid;
      await authService.register(registerData);
      const savedUser = await User.findOne({ email: registerData.email });

      // Get user by ID
      const user = await authService.getUserById(savedUser!._id.toString());

      expect(user).toBeDefined();
      expect(user.email).toBe(registerData.email);
      expect(user.userType).toBe(registerData.userType);
    });

    it('should handle get user by non-existent ID', async () => {
      await expect(
        authService.getUserById('507f1f77bcf86cd799439011')
      ).rejects.toThrow(new AppError(404, 'User not found', 'USER_NOT_FOUND'));
    });
  });

  describe('Token Validation', () => {
    it('should validate JWT tokens correctly', async () => {
      // Register user
      const registerData = mockRegisterData.valid;
      await authService.register(registerData);

      // Login to get tokens
      const loginResult = await authService.login(
        {
          email: registerData.email,
          password: registerData.password,
        },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      // Verify access token
      const accessTokenPayload = jwt.verify(
        loginResult.tokens.accessToken,
        config.jwt.secret
      ) as ITokenPayload;

      expect(accessTokenPayload.userId).toBeDefined();
      expect(accessTokenPayload.email).toBe(registerData.email);
      expect(accessTokenPayload.userType).toBe(registerData.userType);

      // Verify refresh token
      const refreshTokenPayload = jwt.verify(
        loginResult.tokens.refreshToken,
        config.jwt.secret
      ) as ITokenPayload;

      expect(refreshTokenPayload.userId).toBeDefined();
      expect(refreshTokenPayload.email).toBe(registerData.email);
      expect(refreshTokenPayload.userType).toBe(registerData.userType);
    });
  });

  describe('Session Management', () => {
    it('should create multiple sessions for same user', async () => {
      // Register user
      const registerData = mockRegisterData.valid;
      await authService.register(registerData);

      // Login multiple times
      await authService.login(
        {
          email: registerData.email,
          password: registerData.password,
        },
        '192.168.1.1',
        'Mozilla/5.0'
      );

      await authService.login(
        {
          email: registerData.email,
          password: registerData.password,
        },
        '192.168.1.2',
        'Chrome/91.0'
      );

      const savedUser = await User.findOne({ email: registerData.email });
      const sessions = await Session.find({
        userId: savedUser!._id.toString(),
      });

      expect(sessions).toHaveLength(2);
      expect(sessions[0].ipAddress).toBe('192.168.1.1');
      expect(sessions[1].ipAddress).toBe('192.168.1.2');
    });
  });
});
