import express from 'express';
import { getChatHistory, getConversations, getUnreadCount } from '../controllers/message.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.get('/:friendId', protect, getChatHistory);

export default router;