import { Router } from 'express';
import { adminAuth } from '../../middleware/admin-auth';
import {
  trackView,
  trackPlay,
  trackComplete,
  trackClick,
  getAnalyticsByCampaign,
  getAllAnalytics,
} from './analytics.controller';

const router = Router();

/* ========== PUBLIC TRACKING ENDPOINTS ========== */
router.post('/view/:slug', trackView);
router.post('/play/:slug', trackPlay);
router.post('/complete/:slug', trackComplete);
router.post('/click/:slug', trackClick);

/* ========== PROTECTED ANALYTICS ENDPOINTS ========== */
router.get('/analytics', adminAuth, getAllAnalytics);
router.get('/analytics/:slug', adminAuth, getAnalyticsByCampaign);

export default router;
