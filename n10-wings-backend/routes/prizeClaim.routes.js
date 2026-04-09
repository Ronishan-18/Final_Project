import express from 'express';
import { claimPrize, getClaims, updateClaimStatus } from '../controllers/prizeClaim.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, claimPrize);
router.get('/', verifyToken, isAdmin, getClaims);
router.put('/:id/status', verifyToken, isAdmin, updateClaimStatus);

export default router;
