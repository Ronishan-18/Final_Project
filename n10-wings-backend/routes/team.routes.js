import express from 'express';
import {
  createTeam, getTeams, getTeam, getMyTeams, updateTeam,
  invitePlayer, respondToInvitation, removeMember,
  registerTeamForTournament, getMyInvitations,
  requestJoinTeam, getJoinRequests, respondToJoinRequest,
  deleteTeam
} from '../controllers/team.controller.js';
import { protect, optionalProtect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', optionalProtect, getTeams);
router.get('/my', protect, getMyTeams);
router.get('/invitations', protect, getMyInvitations);
router.get('/:id', getTeam);
router.post('/', protect, createTeam);
router.put('/:id', protect, updateTeam);
router.delete('/:id', protect, deleteTeam);
router.post('/:id/invite', protect, invitePlayer);
router.put('/:id/members/:memberId', protect, respondToInvitation);
router.delete('/:id/members/:memberId', protect, removeMember);

router.post('/register/:tournament_id', protect, registerTeamForTournament);

// Join Requests Flow
router.post('/:id/request-join', protect, requestJoinTeam);
router.get('/:id/requests', protect, getJoinRequests);
router.put('/:id/requests/:requestId', protect, respondToJoinRequest);

export default router;