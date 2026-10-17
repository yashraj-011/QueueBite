import { Router } from 'express';
import { analyticsService } from '../services/analyticsService.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/admin/analytics/overview
router.get('/analytics/overview', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const data = await analyticsService.getDashboardOverview();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
