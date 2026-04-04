import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import {
  createTeamEntryCheckout,
  createTournamentCreationCheckout,
  handleWebhook,
  verifyPayment,
  getMyPayments,
} from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rate limiter — 10 checkout attempts per minute per user
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payment requests. Please wait a minute.' },
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  skip: (req) => !req.user,
});

// CRITICAL: Stripe webhook must use raw body — express.json() must NOT parse this route
// This is handled in server.js by mounting /api/payments/webhook BEFORE express.json()
router.post('/webhook', handleWebhook);

// All routes below require authentication
router.post('/entry-checkout', protect, checkoutLimiter, createTeamEntryCheckout);
router.post('/creation-checkout', protect, checkoutLimiter, createTournamentCreationCheckout);
router.get('/verify', protect, verifyPayment);
router.get('/my-payments', protect, getMyPayments);

export default router;