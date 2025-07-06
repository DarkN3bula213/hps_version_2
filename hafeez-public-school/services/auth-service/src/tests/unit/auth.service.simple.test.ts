import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Session } from '../../models/session.model';
import { getRedisClient } from '../../config/redis';
    import { AppError, UserType } from '../../types';
import { RedisClientType } from 'redis';

// Mock dependencies
jest.mock('../../models/user.model');
jest.mock('../../models/session.model');
jest.mock('../../config/redis');

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
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        userType: UserType.STUDENT,
        profileId: 'student-123',
      };

      const mockUserDoc = {
        _id: 'user-123',
        email: userData.email,
        userType: userData.userType,
        profileId: userData.profileId,
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: jest.fn().mockReturnValue({
          _id: 'user-123',
          email: userData.email,
          userType: userData.userType,
          profileId: userData.profileId,
          isActive: true,
          isEmailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      mockUser.findOne.mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUser.create.mockResolvedValue(mockUserDoc as any);
    //   mockRedisClient.setEx.mockResolvedValue('OK');

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
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        userType: UserType.STUDENT,
        profileId: 'student-123',
      };

      const existingUser = {
        _id: 'user-123',
        email: userData.email,
        userType: userData.userType,
        profileId: userData.profileId,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUser.findOne.mockResolvedValue(existingUser as any);

      await expect(authService.register(userData)).rejects.toThrow(
        new AppError(400, 'User already exists', 'USER_EXISTS')
      );

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockUser.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUserDoc = {
        _id: 'user-123',
        email: loginData.email,
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          _id: 'user-123',
          email: loginData.email,
          userType: UserType.STUDENT,
          profileId: 'student-123',
          isActive: true,
          isEmailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUser.findOne.mockResolvedValue(mockUserDoc as any);

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
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUser.findOne.mockResolvedValue(null);

      await expect(
        authService.login(loginData, '192.168.1.1', 'Mozilla/5.0')
      ).rejects.toThrow(
        new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS')
      );

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: loginData.email });
    });

    it('should throw error when user is inactive', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUserDoc = {
        _id: 'user-123',
        email: loginData.email,
        isActive: false,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUser.findOne.mockResolvedValue(mockUserDoc as any);

      await expect(
        authService.login(loginData, '192.168.1.1', 'Mozilla/5.0')
      ).rejects.toThrow(
        new AppError(403, 'Account is deactivated', 'ACCOUNT_DEACTIVATED')
      );

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: loginData.email });
    });

    it('should throw error when password is incorrect', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUserDoc = {
        _id: 'user-123',
        email: loginData.email,
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUser.findOne.mockResolvedValue(mockUserDoc as any);

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const userId = 'user-123';
      const mockUserDoc = {
        _id: userId,
        email: 'test@example.com',
        userType: UserType.STUDENT,
        profileId: 'student-123',
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockUser.findById.mockResolvedValue(mockUserDoc as any);

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
});
