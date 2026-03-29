import express from 'express';
import {
  createTournament, getTournaments, getTournament,
  updateTournament, deleteTournament, startTournament,
  registerForTournament,registerTeamForTournament, handleRegistration,
  updateMatchResult, getMyTournaments, getOrganizerStats,
} from '../controllers/tournament.controller.js';
import { protect, isOrganizer } from '../middleware/auth.middleware.js';

const router = express.Router();

// ── Public ──
router.get('/', getTournaments);
router.get('/my', protect, isOrganizer, getMyTournaments);
router.get('/organizer-stats', protect, isOrganizer, getOrganizerStats);
router.get('/:id', getTournament);

// ── Auth required ──
router.post('/:id/register', protect, registerForTournament);

// ── Organizer only ──
router.post('/', protect, isOrganizer, createTournament);
router.put('/:id', protect, isOrganizer, updateTournament);
router.delete('/:id', protect, isOrganizer, deleteTournament);
router.post('/:id/start', protect, isOrganizer, startTournament);
router.put('/:id/registrations/:regId', protect, isOrganizer, handleRegistration);
router.put('/:id/matches/:matchId', protect, isOrganizer, updateMatchResult);

router.post('/:id/register-team', protect, registerTeamForTournament);

export default router;