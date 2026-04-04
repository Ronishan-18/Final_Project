import express from 'express';
import { getLandingStats, submitAppeal } from '../controllers/public.controller.js';

const router = express.Router();

router.get('/landing-stats', getLandingStats);
router.post('/appeals', submitAppeal);

export default router;
