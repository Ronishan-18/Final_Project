import express from 'express';
import {
  register, verifyEmail, resendVerification,
  login, forgotPassword, verifyResetOtp,
  resetPassword, changePassword, updateEmail,
  getMe, logout, getAllUsers, editUserRole
} from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  validateRegister, validateLogin,
  validateForgotPassword, validateResetPassword,
  validateChangePassword, validateUpdateEmail
} from '../middleware/validate.middleware.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================
router.post('/register', validateRegister, register);
router.post('/verify-email', verifyEmail);              // ← POST now (OTP)
router.post('/resend-verification', resendVerification);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);       // ← NEW
router.post('/reset-password', validateResetPassword, resetPassword); // ← no :token now

// ============================================
// PROTECTED ROUTES
// ============================================
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/change-password', protect, validateChangePassword, changePassword);
router.put('/update-email', protect, validateUpdateEmail, updateEmail);

// ============================================
// ADMIN ONLY
// ============================================
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id/role', protect, authorize('admin'), editUserRole);

export default router;


// ---

// ### Complete OTP Flow:

// **Email Verification:**
// ```
// Register → OTP sent to email
// POST /api/auth/verify-email
// { "email": "roni@gmail.com", "otp": "123456" }
// → Account verified ✅
// ```

// **Forgot Password:**
// ```
// POST /api/auth/forgot-password
// { "email": "roni@gmail.com" }
// → OTP sent to email

// POST /api/auth/verify-reset-otp
// { "email": "roni@gmail.com", "otp": "123456" }
// → resetToken received

// POST /api/auth/reset-password
// { "resetToken": "...", "password": "NewPass@123" }
// → Password changed ✅