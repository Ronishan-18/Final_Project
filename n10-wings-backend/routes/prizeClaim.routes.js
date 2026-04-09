import express from 'express';
import { claimPrize, getClaims, updateClaimStatus } from '../controllers/prizeClaim.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, claimPrize);
router.get('/', protect, authorize('admin'), getClaims);
router.put('/:id/status', protect, authorize('admin'), updateClaimStatus);

export default router;
