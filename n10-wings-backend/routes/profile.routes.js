import express from 'express';
import {
  getMyProfile,
  updateMyProfile,
  getProfileById,
  searchGamers,
  applyForOrganizer
} from '../controllers/profile.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateUpdateProfile } from '../middleware/validate.middleware.js';

const router = express.Router();

// ── Specific routes FIRST ──
router.get('/me', protect, getMyProfile);
router.put('/me', protect, validateUpdateProfile, updateMyProfile);
router.get('/search', searchGamers);
router.post('/apply-organizer', protect, applyForOrganizer);

// ── Dynamic routes LAST ──
router.get('/:id', getProfileById);

export default router;