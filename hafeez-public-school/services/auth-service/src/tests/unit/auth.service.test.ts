/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthService } from '@/services/auth.service';
import { User } from '@/models/user.model';
import { Session } from '@/models/session.model';
import { getRedisClient } from '@/config/redis';
import { config } from '@/config';
import { AppError } from '@/types';
import {
  mockLoginData,
  mockRegisterData,
  mockRefreshTokenData,
  mockForgotPasswordData,
  mockResetPasswordData,
  mockChangePasswordData,
  mockTokenPayload,
//   mockAuthTokens,
  createMockUserDocument,
} from '../fixtures/auth.fixtures';
import { RedisClientType } from 'redis';

// Mock dependencies
jest.mock('@/models/user.model');
jest.mock('@/models/session.model');
jest.mock('@/config/redis');
jest.mock('@/config', () => ({
  config: {
    jwt: {
      secret: 'test-secret',
      expiresIn: '15m',
      refreshExpiresIn: '7d',
    },
    env: 'test',
  },
}));

const mockUser = User as jest.Mocked<typeof User>;
const mockSession = Session as jest.Mocked<typeof Session>;
const mockRedis = getRedisClient as jest.MockedFunction<typeof getRedisClient>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockRedisClient: RedisClientType;

  beforeEach(() => {
    authService = new AuthService();

    // Setup Redis mock
    mockRedisClient = getRedisClient() as RedisClientType;
    mockRedis.mockReturnValue(mockRedisClient);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = mockRegisterData.valid;
      const mockUserDoc = createMockUserDocument({
        email: userData.email,
        userType: userData.userType,
        profileId: userData.profileId,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue(mockUserDoc as any);
    //   mockRedisClient.setEx.mockImplementation(() => Promise.resolve('OK'));

      const result = await authService.register(userData);

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockUser.create).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        userType: userData.userType,
        profileId: userData.profileId,
      });
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error when user already exists', async () => {
      const userData = mockRegisterData.existingEmail;
      const existingUser = createMockUserDocument();

      mockUser.findOne.mockResolvedValue(existingUser);

      await expect(authService.register(userData)).rejects.toThrow(
        new AppError(400, 'User already exists', 'USER_EXISTS')
      );

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockUser.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = mockLoginData.valid;
      const mockUserDoc = createMockUserDocument({
        email: loginData.email,
        isActive: true,
      });
    //   mockUserDoc.comparePassword.(() => Promise.resolve(true));

      mockUser.findOne.mockResolvedValue(mockUserDoc);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSession.create.mockResolvedValue({} as any);
    //   mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await authService.login(
        loginData,
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockUserDoc.comparePassword).toHaveBeenCalledWith(
        loginData.password
      );
      expect(mockSession.create).toHaveBeenCalled();
      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
    });

    it('should throw error when user does not exist', async () => {
      const loginData = mockLoginData.invalidEmail;

      mockUser.findOne.mockResolvedValue(null);

      await expect(
        authService.login(loginData, '192.168.1.1', 'Mozilla/5.0')
      ).rejects.toThrow(
        new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS')
      );

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: loginData.email });
    });

    it('should throw error when user is inactive', async () => {
      const loginData = mockLoginData.valid;
      const mockUserDoc = createMockUserDocument({
        email: loginData.email,
        isActive: false,
      });

      mockUser.findOne.mockResolvedValue(mockUserDoc);

      await expect(
        authService.login(loginData, '192.168.1.1', 'Mozilla/5.0')
      ).rejects.toThrow(
        new AppError(403, 'Account is deactivated', 'ACCOUNT_DEACTIVATED')
      );

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: loginData.email });
    });

    it('should throw error when password is incorrect', async () => {
      const loginData = mockLoginData.invalidPassword;
      const mockUserDoc = createMockUserDocument({
        email: loginData.email,
        isActive: true,
      });
    //   mockUserDoc.comparePassword.mockResolvedValue(false);

      mockUser.findOne.mockResolvedValue(mockUserDoc);

      await expect(
        authService.login(loginData, '192.168.1.1', 'Mozilla/5.0')
      ).rejects.toThrow(
        new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS')
      );

      expect(mockUserDoc.comparePassword).toHaveBeenCalledWith(
        loginData.password
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const userId = 'user-123';
      const refreshToken = 'refresh-token-123';

    //   mockRedisClient.del.mockResolvedValue(1);

      mockSession.deleteOne.mockResolvedValue({ deletedCount: 1 } as any);

      await authService.logout(userId, refreshToken);

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        `refresh_token:${refreshToken}`
      );
      expect(mockSession.deleteOne).toHaveBeenCalledWith({
        userId,
        token: refreshToken,
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const refreshTokenData = mockRefreshTokenData.valid;
      const mockUserDoc = createMockUserDocument({ isActive: true });
      const tokenPayload = mockTokenPayload.valid;

    //   mockRedisClient.get.mockResolvedValue(JSON.stringify(tokenPayload));
      mockUser.findById.mockResolvedValue(mockUserDoc);
    //   mockRedisClient.del.mockResolvedValue(1);
    //   mockRedisClient.setEx.mockResolvedValue('OK');

      // Mock JWT verify
      jest.spyOn(jwt, 'verify').mockReturnValue(tokenPayload as any);

      const result = await authService.refreshToken(refreshTokenData);

      expect(mockRedisClient.get).toHaveBeenCalledWith(
        `refresh_token:${refreshTokenData.refreshToken}`
      );
      expect(mockUser.findById).toHaveBeenCalledWith(tokenPayload.userId);
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        `refresh_token:${refreshTokenData.refreshToken}`
      );
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error when refresh token is invalid', async () => {
      const refreshTokenData = mockRefreshTokenData.invalid;

    //   mockRedisClient.get.mockResolvedValue(null);

      await expect(authService.refreshToken(refreshTokenData)).rejects.toThrow(
        new AppError(401, 'Invalid refresh token', 'INVALID_TOKEN')
      );

      expect(mockRedisClient.get).toHaveBeenCalledWith(
        `refresh_token:${refreshTokenData.refreshToken}`
      );
    });

    it('should throw error when user is not found or inactive', async () => {
      const refreshTokenData = mockRefreshTokenData.valid;
      const tokenPayload = mockTokenPayload.valid;

    //   mockRedisClient.get.mockResolvedValue(JSON.stringify(tokenPayload));
      mockUser.findById.mockResolvedValue(null);

      jest.spyOn(jwt, 'verify').mockReturnValue(tokenPayload as any);

      await expect(authService.refreshToken(refreshTokenData)).rejects.toThrow(
        new AppError(401, 'User not found or inactive', 'USER_NOT_FOUND')
      );

      expect(mockUser.findById).toHaveBeenCalledWith(tokenPayload.userId);
    });
  });

  describe('forgotPassword', () => {
    it('should generate reset token for existing user', async () => {
      const forgotPasswordData = mockForgotPasswordData.valid;
      const mockUserDoc = createMockUserDocument({
        email: forgotPasswordData.email,
      });

      mockUser.findOne.mockResolvedValue(mockUserDoc);
    //   mockRedisClient.setEx.mockResolvedValue('OK');

      await authService.forgotPassword(forgotPasswordData);

      expect(mockUser.findOne).toHaveBeenCalledWith({
        email: forgotPasswordData.email,
      });
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        expect.stringMatching(/reset_token:/),
        3600,
        mockUserDoc._id.toString()
      );
    });

    it('should not throw error for non-existent user', async () => {
      const forgotPasswordData = mockForgotPasswordData.nonExistent;

      mockUser.findOne.mockResolvedValue(null);

      await expect(
        authService.forgotPassword(forgotPasswordData)
      ).resolves.toBeUndefined();

      expect(mockUser.findOne).toHaveBeenCalledWith({
        email: forgotPasswordData.email,
      });
      expect(mockRedisClient.setEx).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetPasswordData = mockResetPasswordData.valid;
      const mockUserDoc = createMockUserDocument();
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetPasswordData.token)
        .digest('hex');

    //   mockRedisClient.get.mockResolvedValue(mockUserDoc._id.toString());
      mockUser.findById.mockResolvedValue(mockUserDoc);
    //   mockUserDoc.save.mockResolvedValue(mockUserDoc);
    //   mockRedisClient
      mockSession.deleteMany.mockResolvedValue({ deletedCount: 1 } as any);

      await authService.resetPassword(resetPasswordData);

      expect(mockRedisClient.get).toHaveBeenCalledWith(
        `reset_token:${hashedToken}`
      );
      expect(mockUser.findById).toHaveBeenCalledWith(
        mockUserDoc._id.toString()
      );
      expect(mockUserDoc.save).toHaveBeenCalled();
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        `reset_token:${hashedToken}`
      );
      expect(mockSession.deleteMany).toHaveBeenCalledWith({
        userId: mockUserDoc._id.toString(),
      });
    });

    it('should throw error when reset token is invalid', async () => {
      const resetPasswordData = mockResetPasswordData.invalid;
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetPasswordData.token)
        .digest('hex');

    //   mockRedisClient.get.mockResolvedValue(null);

      await expect(
        authService.resetPassword(resetPasswordData)
      ).rejects.toThrow(
        new AppError(400, 'Invalid or expired reset token', 'INVALID_TOKEN')
      );

      expect(mockRedisClient.get).toHaveBeenCalledWith(
        `reset_token:${hashedToken}`
      );
    });

    it('should throw error when user is not found', async () => {
      const resetPasswordData = mockResetPasswordData.valid;
    //   const hashedToken = crypto
    //     .createHash('sha256')
    //     .update(resetPasswordData.token)
    //     .digest('hex');

    //   mockRedisClient.get.mockResolvedValue('user-123');
      mockUser.findById.mockResolvedValue(null);

      await expect(
        authService.resetPassword(resetPasswordData)
      ).rejects.toThrow(new AppError(404, 'User not found', 'USER_NOT_FOUND'));

      expect(mockUser.findById).toHaveBeenCalledWith('user-123');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = 'user-123';
      const changePasswordData = mockChangePasswordData.valid;
      const mockUserDoc = createMockUserDocument({ _id: userId });
    //   mockUserDoc.comparePassword.mockResolvedValue(true);

      mockUser.findById.mockResolvedValue(mockUserDoc);
    //   mockUserDoc.save.mockResolvedValue(mockUserDoc);
      mockSession.deleteMany.mockResolvedValue({ deletedCount: 1 } as any);

      await authService.changePassword(userId, changePasswordData);

      expect(mockUser.findById).toHaveBeenCalledWith(userId);
      expect(mockUserDoc.comparePassword).toHaveBeenCalledWith(
        changePasswordData.currentPassword
      );
      expect(mockUserDoc.save).toHaveBeenCalled();
      expect(mockSession.deleteMany).toHaveBeenCalledWith({ userId });
    });

    it('should throw error when user is not found', async () => {
      const userId = 'user-123';
      const changePasswordData = mockChangePasswordData.valid;

      mockUser.findById.mockResolvedValue(null);

      await expect(
        authService.changePassword(userId, changePasswordData)
      ).rejects.toThrow(new AppError(404, 'User not found', 'USER_NOT_FOUND'));

      expect(mockUser.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw error when current password is incorrect', async () => {
      const userId = 'user-123';
      const changePasswordData = mockChangePasswordData.invalidCurrentPassword;
      const mockUserDoc = createMockUserDocument({ _id: userId });
    //   mockUserDoc.comparePassword.mockResolvedValue(false);

      mockUser.findById.mockResolvedValue(mockUserDoc);

      await expect(
        authService.changePassword(userId, changePasswordData)
      ).rejects.toThrow(
        new AppError(401, 'Current password is incorrect', 'INVALID_PASSWORD')
      );

      expect(mockUserDoc.comparePassword).toHaveBeenCalledWith(
        changePasswordData.currentPassword
      );
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const userId = 'user-123';
      const mockUserDoc = createMockUserDocument({ _id: userId });

      mockUser.findById.mockResolvedValue(mockUserDoc);

      const result = await authService.getUserById(userId);

      expect(mockUser.findById).toHaveBeenCalledWith(userId);
      expect(result).toBe(mockUserDoc);
    });

    it('should throw error when user is not found', async () => {
      const userId = 'user-123';

      mockUser.findById.mockResolvedValue(null);

      await expect(authService.getUserById(userId)).rejects.toThrow(
        new AppError(404, 'User not found', 'USER_NOT_FOUND')
      );

      expect(mockUser.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('private methods', () => {
    describe('generateTokens', () => {
      it('should generate access and refresh tokens', async () => {
    //     const mockUserDoc = createMockUserDocument();
    //     const mockTokens = mockAuthTokens.valid;

    //     jest.spyOn(jwt, 'sign').mockReturnValueOnce(mockTokens.accessToken);
    //     jest.spyOn(jwt, 'sign').mockReturnValueOnce(mockTokens.refreshToken);
    //     mockRedisClient.setEx.mockResolvedValue('OK');

        // Access private method through public method
        const result = await authService.login(
          mockLoginData.valid,
          '192.168.1.1',
          'Mozilla/5.0'
        );

        expect(result.tokens.accessToken).toBeDefined();
        expect(result.tokens.refreshToken).toBeDefined();
        expect(mockRedisClient.setEx).toHaveBeenCalledWith(
          expect.stringMatching(/refresh_token:/),
          7 * 24 * 60 * 60,
          expect.any(String)
        );
      });
    });

    describe('verifyRefreshToken', () => {
      it('should verify valid refresh token', async () => {
        const token = 'valid-token';
        const payload = mockTokenPayload.valid;

        jest.spyOn(jwt, 'verify').mockReturnValue(payload as any);

        // Test through refreshToken method
    //     mockRedisClient.get.mockResolvedValue(JSON.stringify(payload));
        mockUser.findById.mockResolvedValue(createMockUserDocument());
    //     mockRedisClient.del.mockResolvedValue(1);
    //     mockRedisClient.setEx.mockResolvedValue('OK');

        await authService.refreshToken({ refreshToken: token });

        expect(jwt.verify).toHaveBeenCalledWith(token, config.jwt.secret);
      });

      it('should throw error for invalid refresh token', async () => {
        const token = 'invalid-token';

        jest.spyOn(jwt, 'verify').mockImplementation(() => {
          throw new Error('Invalid token');
        });

   

        await expect(
          authService.refreshToken({ refreshToken: token })
        ).rejects.toThrow(
          new AppError(401, 'Invalid refresh token', 'INVALID_TOKEN')
        );
      });
    });

    describe('createSession', () => {
      it('should create session successfully', async () => {
    //      const userId = 'user-123';
    //     const token = 'refresh-token';
        const ipAddress = '192.168.1.1';
        const userAgent = 'Mozilla/5.0';

        mockSession.create.mockResolvedValue({} as any);

        // Test through login method
        const mockUserDoc = createMockUserDocument();
    //          mockUserDoc.comparePassword.mockResolvedValue(true);
        mockUser.findOne.mockResolvedValue(mockUserDoc);
    //     mockRedisClient.setEx.mockResolvedValue('OK');

        await authService.login(mockLoginData.valid, ipAddress, userAgent);

        expect(mockSession.create).toHaveBeenCalledWith({
          userId: mockUserDoc._id.toString(),
          token: expect.any(String),
          ipAddress,
          userAgent,
          expiresAt: expect.any(Date),
        });
      });
    });
  });
});
