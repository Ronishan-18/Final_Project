import express from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markAsRead);
router.patch('/read-all', protect, markAllAsRead);

export default router;