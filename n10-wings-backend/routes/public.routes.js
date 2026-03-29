import express from 'express';
import { getLandingStats } from '../controllers/public.controller.js';

const router = express.Router();

router.get('/landing-stats', getLandingStats);

export default router;
