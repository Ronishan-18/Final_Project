const express = require('express');
const router = express.Router();

const {
  register,
  verifyEmail,
  resendVerification,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  updateEmail,
  getMe,
  logout,
  changeUserRole    
} = require('../controllers/auth.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

// ============================================
// PUBLIC ROUTES (no token needed)
// ============================================
router.post('/register', register);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// ============================================
// PROTECTED ROUTES (token required)
// ============================================
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/change-password', protect, changePassword);
router.put('/update-email', protect, updateEmail);

// ============================================
// ADMIN ONLY ROUTES
// ============================================
router.put('/change-role', protect, authorize('admin'), changeUserRole);

module.exports = router;