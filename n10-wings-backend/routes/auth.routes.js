import express from 'express';
import passport from '../config/passport.js';
import {
  register, verifyEmail, resendVerification,
  login, getMe, logout,
  forgotPassword, verifyResetOtp, resetPassword,
  changePassword, updateEmail,
  getAllUsers, editUserRole,
  googleAuth, googleCallback
} from '../controllers/auth.controller.js';

import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  validateRegister, validateLogin,
  validateForgotPassword, validateResetPassword,
  validateChangePassword, validateUpdateEmail,
} from '../middleware/validate.middleware.js';

const router = express.Router();

// ── PUBLIC ──
router.post('/register', validateRegister, register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', validateResetPassword, resetPassword);

// ── GOOGLE OAuth ──
router.get('/google', googleAuth,
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  googleCallback
);

// ── PROTECTED ──
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/change-password', protect, validateChangePassword, changePassword);
router.put('/update-email', protect, validateUpdateEmail, updateEmail);

// ── ADMIN ──
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id/role', protect, authorize('admin'), editUserRole);

export default router;