import express from 'express';
import { createMatch, getMatches, submitMatchResults, getLeaderboard } from '../controllers/br.controller.js';
import { protect, isOrganizer, optionalProtect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:tournament_id/matches', optionalProtect, getMatches);
router.get('/:tournament_id/leaderboard', optionalProtect, getLeaderboard);

router.post('/:tournament_id/matches', protect, isOrganizer, createMatch);
router.post('/matches/:match_id/results', protect, isOrganizer, submitMatchResults);

export default router;
