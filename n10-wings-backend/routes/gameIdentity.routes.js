import express from 'express';
import {
  getSupportedGames,
  getMyGameIdentities,
  getUserGameIdentities,
  upsertGameIdentity,
  deleteGameIdentity,
  syncPUBG,
  syncValorant,
  syncLoL
} from '../controllers/gameIdentity.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ── Specific routes FIRST ──
router.get('/games', getSupportedGames);
router.get('/me', protect, getMyGameIdentities);
router.post('/sync/pubg', protect, syncPUBG);
router.post('/sync/valorant', protect, syncValorant);
router.post('/sync/lol', protect, syncLoL);
router.post('/', protect, upsertGameIdentity);
router.delete('/:id', protect, deleteGameIdentity);

// ── Dynamic routes LAST ──
router.get('/:userId', getUserGameIdentities);

export default router;