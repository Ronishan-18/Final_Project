import express from 'express';
import { getLandingStats, submitAppeal } from '../controllers/public.controller.js';
import { submitContactMessage } from '../controllers/support.controller.js';


const router = express.Router();

router.get('/landing-stats', getLandingStats);
router.post('/appeals', submitAppeal);
router.post('/contact', submitContactMessage);

export default router;
