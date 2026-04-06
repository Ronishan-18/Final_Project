import express from 'express';
import {
  createTournament, getTournaments, getTournament,
  updateTournament, deleteTournament, startTournament,
  registerForTournament, registerTeamForTournament,
  handleRegistration, updateMatchResult,
  getMyTournaments, getOrganizerStats,
  sendAnnouncement, declareWinner,
} from '../controllers/tournament.controller.js';
import { protect, isOrganizer, optionalProtect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ── Public ──
router.get('/', optionalProtect, getTournaments);
router.get('/my', protect, isOrganizer, getMyTournaments);
router.get('/organizer-stats', protect, isOrganizer, getOrganizerStats);
router.get('/:id', optionalProtect, getTournament);

// ── Auth required ──
router.post('/:id/register', protect, registerForTournament);
router.post('/:id/register-team', protect, registerTeamForTournament);

// ── Organizer only ──
router.post('/', protect, isOrganizer, createTournament);
router.put('/:id', protect, isOrganizer, updateTournament);
router.delete('/:id', protect, isOrganizer, deleteTournament);
router.post('/:id/start', protect, isOrganizer, startTournament);
router.put('/:id/registrations/:regId', protect, isOrganizer, handleRegistration);
router.put('/:id/matches/:matchId', protect, isOrganizer, updateMatchResult);

// ── NEW: Announcement + Winner ──
router.post('/:id/announce', protect, isOrganizer, sendAnnouncement);
router.post('/:id/declare-winner', protect, isOrganizer, declareWinner);

export default router;