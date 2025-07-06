import { UserType } from '@/types';
import { IUserDocument } from '@/models/user.model';
import mongoose from 'mongoose';

export const mockUserData = {
  validUser: {
    email: 'test@example.com',
    password: 'password123',
    userType: UserType.STUDENT,
    profileId: 'student-123',
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'admin123',
    userType: UserType.ADMIN,
    profileId: 'admin-123',
  },
  teacherUser: {
    email: 'teacher@example.com',
    password: 'teacher123',
    userType: UserType.TEACHER,
    profileId: 'teacher-123',
  },
  inactiveUser: {
    email: 'inactive@example.com',
    password: 'password123',
    userType: UserType.STUDENT,
    profileId: 'student-456',
    isActive: false,
  },
};

export const mockLoginData = {
  valid: {
    email: 'test@example.com',
    password: 'password123',
  },
  invalidEmail: {
    email: 'nonexistent@example.com',
    password: 'password123',
  },
  invalidPassword: {
    email: 'test@example.com',
    password: 'wrongpassword',
  },
};

export const mockRegisterData = {
  valid: {
    email: 'newuser@example.com',
    password: 'NewPassword123!',
    confirmPassword: 'NewPassword123!',
    userType: UserType.STUDENT,
    profileId: 'student-new',
  },
  existingEmail: {
    email: 'test@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    userType: UserType.STUDENT,
    profileId: 'student-123',
  },
};

export const mockRefreshTokenData = {
  valid: {
    refreshToken: 'valid-refresh-token',
  },
  invalid: {
    refreshToken: 'invalid-refresh-token',
  },
};

export const mockForgotPasswordData = {
  valid: {
    email: 'test@example.com',
  },
  nonExistent: {
    email: 'nonexistent@example.com',
  },
};

export const mockResetPasswordData = {
  valid: {
    token: 'valid-reset-token',
    password: 'NewPassword123!',
    confirmPassword: 'NewPassword123!',
  },
  invalid: {
    token: 'invalid-reset-token',
    password: 'NewPassword123!',
    confirmPassword: 'NewPassword123!',
  },
};

export const mockChangePasswordData = {
  valid: {
    currentPassword: 'Password123!',
    newPassword: 'NewPassword123!',
    confirmPassword: 'NewPassword123!',
  },
  invalidCurrentPassword: {
    currentPassword: 'wrongpassword',
    newPassword: 'NewPassword123!',
    confirmPassword: 'NewPassword123!',
  },
};

export const mockSessionData = {
  valid: {
    userId: 'user-123',
    token: 'refresh-token-123',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
};

export const mockTokenPayload = {
  valid: {
    userId: 'user-123',
    email: 'test@example.com',
    userType: UserType.STUDENT,
  },
};

export const mockAuthTokens = {
  valid: {
    accessToken: 'valid-access-token',
    refreshToken: 'valid-refresh-token',
  },
};

export const createMockUser = (
  overrides: Partial<IUserDocument> = {}
): Partial<IUserDocument> => ({
  _id: 'user-123',
  email: 'test@example.com',
  userType: UserType.STUDENT,
  profileId: 'student-123',
  isActive: true,
  isEmailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  comparePassword: jest.fn().mockResolvedValue(true),
  ...overrides,
});

export const createMockUserDocument = (
  overrides: Partial<IUserDocument> = {}
): IUserDocument =>
  ({
    _id: 'user-123' as unknown as mongoose.Types.ObjectId,
    email: 'test@example.com',
    userType: UserType.STUDENT,
    profileId: 'student-123',
    isActive: true,
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    comparePassword: jest.fn().mockResolvedValue(true),
    toJSON: jest.fn().mockReturnValue({
      _id: 'user-123',
      email: 'test@example.com',
      userType: UserType.STUDENT,
      profileId: 'student-123',
      isActive: true,
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    ...overrides,
  }) as IUserDocument;
