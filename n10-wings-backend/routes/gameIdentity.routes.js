import express from 'express';
import {
  getSupportedGames,
  getMyGameIdentities,
  getUserGameIdentities,
  upsertGameIdentity,
  deleteGameIdentity,
  syncPUBG,
  syncValorant
} from '../controllers/gameIdentity.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ── SPECIFIC ROUTES FIRST ──
router.get('/games', getSupportedGames);
router.get('/me', protect, getMyGameIdentities);
router.post('/sync/pubg', protect, syncPUBG);
router.post('/sync/valorant', protect, syncValorant);
router.post('/', protect, upsertGameIdentity);
router.delete('/:id', protect, deleteGameIdentity);

// ── DYNAMIC ROUTES LAST ──
router.get('/:userId', getUserGameIdentities);

export default router;