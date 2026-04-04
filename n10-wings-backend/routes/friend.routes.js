import express from 'express';
import {
  sendFriendRequest,
  respondToFriendRequest,
  getMyFriends,
  getPendingRequests,
  removeFriend,
  getFriendshipStatus,
} from '../controllers/friend.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/request', protect, sendFriendRequest);
router.post('/respond', protect, respondToFriendRequest);
router.get('/my-friends', protect, getMyFriends);
router.get('/pending', protect, getPendingRequests);
router.delete('/:friendship_id', protect, removeFriend);
router.get('/status/:targetId', protect, getFriendshipStatus);

export default router;