import { Request, Response } from 'express';
import { authService } from '@/services/auth.service';
import { AuthRequest } from '@/types';
import { asyncHandler } from '@/handlers/async.handler';
import {
  LoginInput,
  RegisterInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@/services/validator.service';

export class AuthController {
  register = asyncHandler(
    async (
      req: Request<object, object, RegisterInput>,
      res: Response
    ): Promise<void> => {
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        data: result,
      });
    }
  );

  login = asyncHandler(
    async (
      req: Request<object, object, LoginInput>,
      res: Response
    ): Promise<void> => {
      const ipAddress = req.ip || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';

      const result = await authService.login(req.body, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        data: result,
      });
    }
  );

  logout = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const refreshToken = req.body.refreshToken;
      const userId = req.user!.userId;

      await authService.logout(userId, refreshToken);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    }
  );

  refreshToken = asyncHandler(
    async (
      req: Request<object, object, RefreshTokenInput>,
      res: Response
    ): Promise<void> => {
      const tokens = await authService.refreshToken(req.body);

      res.status(200).json({
        success: true,
        data: { tokens },
      });
    }
  );

  forgotPassword = asyncHandler(
    async (
      req: Request<object, object, ForgotPasswordInput>,
      res: Response
    ): Promise<void> => {
      await authService.forgotPassword(req.body);

      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    }
  );

  resetPassword = asyncHandler(
    async (
      req: Request<object, object, ResetPasswordInput>,
      res: Response
    ): Promise<void> => {
      await authService.resetPassword(req.body);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    }
  );

  changePassword = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const userId = req.user!.userId;
      await authService.changePassword(userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    }
  );

  getMe = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
      const userId = req.user!.userId;
      const user = await authService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: { user },
      });
    }
  );
}

export const authController = new AuthController();
