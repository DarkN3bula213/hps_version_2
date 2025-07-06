import { Router } from 'express';
import { authController } from '@/controllers/auth.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validation.middleware';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '@/services/validator.service';
import { UserType } from '@/types';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  authController.refreshToken
);
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword
);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/logout', authController.logout);
router.post(
  '/change-password',
  validate(changePasswordSchema),
  authController.changePassword
);
router.get('/me', authController.getMe);

// Admin only routes
router.get('/admin-test', authorize(UserType.ADMIN), (req, res) => {
  res.json({ message: 'Admin access granted' });
});

export default router;
