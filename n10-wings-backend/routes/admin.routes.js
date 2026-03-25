import express from 'express';
import {
  getPlatformStats,
  getAllUsers,
  toggleUserStatus,
  changeUserRole,
  getOrganizerApplications,
  handleOrganizerApplication,
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All admin routes are protected + admin only
router.use(protect, authorize('admin'));

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.put('/users/:id/suspend', toggleUserStatus);
router.put('/users/:id/role', changeUserRole);
router.get('/organizer-applications', getOrganizerApplications);
router.put('/organizer-applications/:id', handleOrganizerApplication);

export default router;