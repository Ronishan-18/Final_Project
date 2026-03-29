import express from 'express';
import {
  createTeam, getTeams, getTeam, getMyTeam, updateTeam,
  invitePlayer, respondToInvitation, removeMember,
  registerTeamForTournament, getMyInvitations,
} from '../controllers/team.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getTeams);
router.get('/my', protect, getMyTeam);
router.get('/invitations', protect, getMyInvitations);
router.get('/:id', getTeam);
router.post('/', protect, createTeam);
router.put('/:id', protect, updateTeam);
router.post('/:id/invite', protect, invitePlayer);
router.put('/:id/members/:memberId', protect, respondToInvitation);
router.delete('/:id/members/:memberId', protect, removeMember);

export default router;